import { z } from "zod";

export const accountTypeSchema = z.enum(["cash", "bank", "crypto", "other"]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  type: accountTypeSchema,
  currency: z.string().trim().min(1).max(12).default("USD"),
  balance: z.coerce.number().finite("Starting balance is required"),
});

export const patchAccountSchema = z.object({
  balance: z.coerce.number().finite(),
});

export const createTransferSchema = z.object({
  fromAccountId: z.string().trim().min(1),
  toAccountId: z.string().trim().min(1),
  amount: z.coerce.number().finite().positive("Amount must be positive"),
  note: z.string().trim().max(500).optional().nullable(),
});

export const patchTransferSchema = z
  .object({
    fromAccountId: z.string().trim().min(1).optional(),
    toAccountId: z.string().trim().min(1).optional(),
    amount: z.coerce.number().finite().positive("Amount must be positive").optional(),
    note: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (d) =>
      d.fromAccountId !== undefined ||
      d.toAccountId !== undefined ||
      d.amount !== undefined ||
      d.note !== undefined,
    { message: "Provide at least one field to update" },
  );
