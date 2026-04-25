import { Prisma } from "../../generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import type { CreateExpenseInput, PatchExpenseInput } from "@/src/lib/expense-types";
import { financeAccountBelongsToUser } from "@/src/lib/finance-account.service";

const accountSelect = { select: { id: true, name: true, type: true, currency: true } as const };

export function listExpensesForUser(userId: string) {
  return prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      account: accountSelect,
    },
  });
}

function normalizeCreate(data: CreateExpenseInput) {
  return {
    title: data.title?.trim() || "Untitled expense",
    amount: data.amount,
    category: data.category?.trim() || "General",
    accountId: data.accountId,
  };
}

export async function createExpense(userId: string, data: CreateExpenseInput) {
  const accOk = await financeAccountBelongsToUser(data.accountId, userId);
  if (!accOk) {
    throw new Prisma.PrismaClientKnownRequestError("Account not found", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  }
  const normalized = normalizeCreate(data);
  return prisma.expense.create({
    data: {
      title: normalized.title,
      amount: normalized.amount,
      category: normalized.category,
      userId,
      accountId: normalized.accountId,
    },
    include: {
      account: accountSelect,
    },
  });
}

function buildPatchData(patch: PatchExpenseInput) {
  const d: {
    title?: string | null;
    amount?: number;
    category?: string | null;
    accountId?: string;
  } = {};
  if (patch.title !== undefined) {
    d.title = patch.title;
  }
  if (patch.amount !== undefined) {
    d.amount = patch.amount;
  }
  if (patch.category !== undefined) {
    d.category = patch.category;
  }
  if (patch.accountId !== undefined) {
    d.accountId = patch.accountId;
  }
  return d;
}

export async function patchExpenseForUser(
  userId: string,
  expenseId: string,
  patch: PatchExpenseInput,
) {
  const owned = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
    select: { id: true },
  });
  if (!owned) {
    throw new Prisma.PrismaClientKnownRequestError("Record to update not found.", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  }
  if (patch.accountId !== undefined) {
    const ok = await financeAccountBelongsToUser(patch.accountId, userId);
    if (!ok) {
      throw new Prisma.PrismaClientKnownRequestError("Account not found", {
        code: "P2025",
        clientVersion: Prisma.prismaVersion.client,
      });
    }
  }
  return prisma.expense.update({
    where: { id: expenseId },
    data: buildPatchData(patch),
    include: {
      account: accountSelect,
    },
  });
}

export async function deleteExpenseForUser(userId: string, id: string) {
  const res = await prisma.expense.deleteMany({ where: { id, userId } });
  if (res.count === 0) {
    throw new Prisma.PrismaClientKnownRequestError("Record to delete not found.", {
      code: "P2025",
      clientVersion: Prisma.prismaVersion.client,
    });
  }
}
