import { prisma } from "@/src/lib/prisma";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/src/lib/expense-types";

export async function listExpenses() {
  return prisma.expense.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createExpense(data: CreateExpenseInput) {
  return prisma.expense.create({
    data,
  });
}

export async function updateExpense(data: UpdateExpenseInput) {
  const { id, ...updates } = data;
  return prisma.expense.update({
    where: { id },
    data: updates,
  });
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({
    where: { id },
  });
}
