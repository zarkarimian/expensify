import type { z } from "zod";
import {
  createAccountSchema,
  createTransferSchema,
  accountTypeSchema,
  patchAccountSchema,
  patchTransferSchema,
} from "@/src/lib/account-schemas";
import { createExpenseSchema, patchExpenseSchema } from "@/src/lib/expense-schemas";

export type AccountType = z.infer<typeof accountTypeSchema>;

/** Finance account (wallet) returned from `GET /api/accounts` — Prisma `FinanceAccount` + `totalSpent`. */
export type Account = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  createdAt: string | Date;
  totalSpent: number;
  remaining: number;
};

export type Transfer = {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string | null;
  createdAt: string | Date;
  fromAccount: { id: string; name: string; currency: string };
  toAccount: { id: string; name: string; currency: string };
};

export type Expense = {
  id: string;
  title: string | null;
  amount: number;
  category: string | null;
  createdAt: string;
  accountId: string;
  account: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };
};

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type PatchAccountInput = z.infer<typeof patchAccountSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type PatchTransferInput = z.infer<typeof patchTransferSchema>;
export type PatchExpenseInput = z.infer<typeof patchExpenseSchema>;
/** Full update input for the client: PATCH body plus expense id. */
export type UpdateExpenseInput = { id: string } & PatchExpenseInput;
