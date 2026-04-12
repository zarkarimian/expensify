import type { z } from "zod";
import { createExpenseSchema, updateExpenseSchema } from "@/src/lib/expense-schemas";

/** Expense row from GET /api/expenses (Prisma `Expense`). */
export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
