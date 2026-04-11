import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  amount: z.coerce.number().finite("Amount must be a finite number").nonnegative("Amount cannot be negative"),
  category: z.string().trim().min(1, "Category is required"),
});

export const updateExpenseSchema = z
  .object({
    id: z.string().trim().min(1, "id is required"),
    title: z.string().trim().min(1).optional(),
    amount: z.coerce.number().finite().nonnegative().optional(),
    category: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.amount !== undefined || data.category !== undefined,
    { message: "Provide at least one of title, amount, or category to update" },
  );
