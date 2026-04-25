import type {
  CreateTransferInput,
  PatchTransferInput,
  Transfer,
} from "@/src/lib/expense-types";

async function parseJsonError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchTransfers(): Promise<Transfer[]> {
  const res = await fetch("/api/transfers", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Transfer[]>;
}

export async function createTransferApi(
  input: CreateTransferInput,
): Promise<Transfer> {
  const res = await fetch("/api/transfers", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      note: input.note,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Transfer>;
}

export async function updateTransferApi(
  id: string,
  input: PatchTransferInput,
): Promise<Transfer> {
  const res = await fetch(`/api/transfers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<Transfer>;
}

export async function deleteTransferApi(id: string): Promise<void> {
  const res = await fetch(`/api/transfers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
}
