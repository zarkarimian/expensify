import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().trim().max(500).optional(),
  amount: z.coerce
    .number()
    .finite("Amount must be a finite number")
    .nonnegative("Amount cannot be negative"),
  category: z.string().trim().max(100).optional(),
  accountId: z.string().trim().min(1, "Account is required"),
});

export const patchExpenseSchema = z
  .object({
    title: z.string().trim().max(500).optional().nullable(),
    amount: z.coerce.number().finite().nonnegative().optional(),
    category: z.string().trim().max(100).optional().nullable(),
    accountId: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.amount !== undefined ||
      data.category !== undefined ||
      data.accountId !== undefined,
    { message: "Provide at least one of title, amount, category, or account" },
  );
