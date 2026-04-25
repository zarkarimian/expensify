import { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { financeAccountBelongsToUser } from "@/src/lib/finance-account.service";
import type { CreateTransferInput, PatchTransferInput } from "@/src/lib/expense-types";

const include = {
  fromAccount: { select: { id: true, name: true, currency: true } },
  toAccount: { select: { id: true, name: true, currency: true } },
} as const;

type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

async function getAvailableFunds(
  tx: TransactionClient,
  accountId: string,
  userId: string,
): Promise<number> {
  const a = await tx.financeAccount.findFirst({
    where: { id: accountId, userId },
  });
  if (!a) {
    return -Infinity;
  }
  const agg = await tx.expense.aggregate({
    where: { accountId, userId },
    _sum: { amount: true },
  });
  return a.balance - (agg._sum.amount ?? 0);
}

/**
 * Move `amount` from fromId to toId (debit source, credit destination).
 * Uses current row balances; must run inside a transaction.
 */
async function applyTransferToBalances(
  tx: TransactionClient,
  userId: string,
  fromId: string,
  toId: string,
  amount: number,
) {
  const [from, to] = await Promise.all([
    tx.financeAccount.findFirst({ where: { id: fromId, userId } }),
    tx.financeAccount.findFirst({ where: { id: toId, userId } }),
  ]);
  if (!from || !to) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }
  await tx.financeAccount.update({
    where: { id: fromId },
    data: { balance: from.balance - amount },
  });
  await tx.financeAccount.update({
    where: { id: toId },
    data: { balance: to.balance + amount },
  });
}

/**
 * Undo a past transfer: put money back on source, remove from dest.
 * Equivalent to moving `amount` from toId to fromId.
 */
function reverseTransferOnBalances(
  tx: TransactionClient,
  userId: string,
  fromId: string,
  toId: string,
  amount: number,
) {
  return applyTransferToBalances(tx, userId, toId, fromId, amount);
}

export function listTransfersForUser(userId: string) {
  return prisma.transfer.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include,
  });
}

export async function createTransferForUser(userId: string, data: CreateTransferInput) {
  if (data.fromAccountId === data.toAccountId) {
    throw new Error("SAME_ACCOUNT");
  }
  const [fromOk, toOk] = await Promise.all([
    financeAccountBelongsToUser(data.fromAccountId, userId),
    financeAccountBelongsToUser(data.toAccountId, userId),
  ]);
  if (!fromOk || !toOk) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const available = await getAvailableFunds(tx, data.fromAccountId, userId);
    if (available < data.amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    await applyTransferToBalances(
      tx,
      userId,
      data.fromAccountId,
      data.toAccountId,
      data.amount,
    );
    return tx.transfer.create({
      data: {
        userId,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        note: data.note ?? null,
      },
      include,
    });
  });
}

export async function updateTransferForUser(
  userId: string,
  transferId: string,
  patch: PatchTransferInput,
) {
  const existing = await prisma.transfer.findFirst({
    where: { id: transferId, userId },
  });
  if (!existing) {
    throw new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  }

  const fromId = patch.fromAccountId ?? existing.fromAccountId;
  const toId = patch.toAccountId ?? existing.toAccountId;
  const amount = patch.amount ?? existing.amount;
  const note =
    patch.note !== undefined
      ? patch.note === null
        ? null
        : patch.note
      : existing.note;

  if (fromId === toId) {
    throw new Error("SAME_ACCOUNT");
  }
  const [fromOk, toOk] = await Promise.all([
    financeAccountBelongsToUser(fromId, userId),
    financeAccountBelongsToUser(toId, userId),
  ]);
  if (!fromOk || !toOk) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }

  const onlyNote =
    fromId === existing.fromAccountId &&
    toId === existing.toAccountId &&
    amount === existing.amount;

  if (onlyNote) {
    return prisma.transfer.update({
      where: { id: transferId },
      data: { note },
      include,
    });
  }

  return prisma.$transaction(async (tx) => {
    await reverseTransferOnBalances(
      tx,
      userId,
      existing.fromAccountId,
      existing.toAccountId,
      existing.amount,
    );

    const available = await getAvailableFunds(tx, fromId, userId);
    if (available < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    await applyTransferToBalances(tx, userId, fromId, toId, amount);

    return tx.transfer.update({
      where: { id: transferId },
      data: {
        fromAccountId: fromId,
        toAccountId: toId,
        amount,
        note,
      },
      include,
    });
  });
}

export async function deleteTransferForUser(userId: string, transferId: string) {
  const row = await prisma.transfer.findFirst({
    where: { id: transferId, userId },
  });
  if (!row) {
    throw new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  }

  await prisma.$transaction(async (tx) => {
    await reverseTransferOnBalances(
      tx,
      userId,
      row.fromAccountId,
      row.toAccountId,
      row.amount,
    );
    await tx.transfer.delete({ where: { id: transferId } });
  });
}
