import type { Account, CreateAccountInput, PatchAccountInput } from "@/src/lib/expense-types";

async function parseJsonError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch("/api/accounts", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Account[]>;
}

export async function createAccountApi(
  input: CreateAccountInput,
): Promise<Account> {
  const res = await fetch("/api/accounts", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Account>;
}

export async function patchAccountApi(
  id: string,
  input: PatchAccountInput,
): Promise<Account> {
  const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Account>;
}

export async function deleteAccountApi(id: string): Promise<void> {
  const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.status === 204) {
    return;
  }
  if (!res.ok) {
    const message = await parseJsonError(res);
    throw new Error(message, { cause: { status: res.status } });
  }
}
