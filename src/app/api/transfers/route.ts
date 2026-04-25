import { createTransferSchema } from "@/src/lib/account-schemas";
import { listTransfersForUser, createTransferForUser } from "@/src/lib/transfer.service";
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
    const rows = await listTransfersForUser(userId);
    return NextResponse.json(rows);
  } catch {
    return jsonError("Failed to fetch transfers", 500);
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

  const parsed = createTransferSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const { note, ...rest } = parsed.data;
  const payload = { ...rest, note: note ?? undefined };

  try {
    const t = await createTransferForUser(userId, payload);
    return NextResponse.json(t, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SAME_ACCOUNT") {
      return jsonError("From and to accounts must differ", 400);
    }
    if (msg === "ACCOUNT_NOT_FOUND") {
      return jsonError("One or more accounts not found", 404);
    }
    if (msg === "INSUFFICIENT_FUNDS") {
      return jsonError("Insufficient funds in the source account", 400);
    }
    return jsonError("Failed to create transfer", 500);
  }
}
