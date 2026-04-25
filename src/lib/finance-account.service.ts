import { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import type { CreateAccountInput, PatchAccountInput } from "@/src/lib/expense-types";

export function accountDto(
  a: {
    id: string;
    userId: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    createdAt: Date;
  },
  totalSpent: number,
) {
  const spent = totalSpent;
  const remaining = a.balance - spent;
  return {
    id: a.id,
    userId: a.userId,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    createdAt: a.createdAt,
    totalSpent: spent,
    remaining,
  };
}

export async function listAccountsWithTotals(userId: string) {
  const accounts = await prisma.financeAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const sums = await prisma.expense.groupBy({
    by: ["accountId"],
    where: { userId },
    _sum: { amount: true },
  });
  const sumByAccount = new Map(
    sums.map((s) => [s.accountId, s._sum.amount ?? 0]),
  );
  return accounts.map((a) =>
    accountDto(a, sumByAccount.get(a.id) ?? 0),
  );
}

export function createFinanceAccount(userId: string, data: CreateAccountInput) {
  return prisma.financeAccount.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency ?? "USD",
      balance: data.balance,
    },
  });
}

export async function patchFinanceAccountForUser(
  id: string,
  userId: string,
  patch: PatchAccountInput,
) {
  const existing = await prisma.financeAccount.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  }
  const updated = await prisma.financeAccount.update({
    where: { id },
    data: { balance: patch.balance },
  });
  const sum = await prisma.expense.aggregate({
    where: { accountId: id, userId },
    _sum: { amount: true },
  });
  return accountDto(updated, sum._sum.amount ?? 0);
}

export async function getAccountWithTotalsForUser(id: string, userId: string) {
  const a = await prisma.financeAccount.findFirst({ where: { id, userId } });
  if (!a) {
    return null;
  }
  const sum = await prisma.expense.aggregate({
    where: { accountId: id, userId },
    _sum: { amount: true },
  });
  return accountDto(a, sum._sum.amount ?? 0);
}

export async function deleteFinanceAccountForUser(id: string, userId: string) {
  const expenseCount = await prisma.expense.count({
    where: { accountId: id, userId },
  });
  if (expenseCount > 0) {
    return { ok: false as const, code: "HAS_EXPENSES" as const };
  }
  const res = await prisma.financeAccount.deleteMany({ where: { id, userId } });
  if (res.count === 0) {
    throw new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  }
  return { ok: true as const };
}

export async function financeAccountBelongsToUser(
  accountId: string,
  userId: string,
): Promise<boolean> {
  const n = await prisma.financeAccount.count({
    where: { id: accountId, userId },
  });
  return n > 0;
}
