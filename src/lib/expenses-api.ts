import type {
  CreateExpenseInput,
  Expense,
  UpdateExpenseInput,
} from "@/src/lib/expense-types";

async function parseJsonError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch("/api/expenses", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Expense[]>;
}

export async function createExpenseApi(input: CreateExpenseInput): Promise<Expense> {
  const res = await fetch("/api/expenses", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Expense>;
}

export async function updateExpenseApi(input: UpdateExpenseInput): Promise<Expense> {
  const { id, ...body } = input;
  const res = await fetch(`/api/expenses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Expense>;
}

export async function deleteExpenseApi(id: string): Promise<void> {
  const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.status === 204) return;
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
}
