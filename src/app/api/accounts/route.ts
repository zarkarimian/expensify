import { createAccountSchema } from "@/src/lib/account-schemas";
import {
  accountDto,
  createFinanceAccount,
  listAccountsWithTotals,
} from "@/src/lib/finance-account.service";
import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    details !== undefined ? { error: message, details } : { error: message },
    { status },
  );
}

async function requireSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session) {
    return jsonError("Unauthorized", 401);
  }
  return session;
}

export async function GET(request: Request) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const userId = sessionOrError.user.id;

  try {
    const accounts = await listAccountsWithTotals(userId);
    return NextResponse.json(accounts);
  } catch {
    return jsonError("Failed to fetch accounts", 500);
  }
}

export async function POST(request: Request) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const userId = sessionOrError.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  try {
    const acc = await createFinanceAccount(userId, parsed.data);
    return NextResponse.json(accountDto(acc, 0), { status: 201 });
  } catch {
    return jsonError("Failed to create account", 500);
  }
}
