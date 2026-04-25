import { patchAccountSchema } from "@/src/lib/account-schemas";
import {
  deleteFinanceAccountForUser,
  patchFinanceAccountForUser,
} from "@/src/lib/finance-account.service";
import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";
import { Prisma } from "../../../../../generated/prisma/client";

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

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const userId = sessionOrError.user.id;
  const { id } = await context.params;
  if (!id?.trim()) {
    return jsonError("Invalid id", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = patchAccountSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  try {
    const account = await patchFinanceAccountForUser(
      id.trim(),
      userId,
      parsed.data,
    );
    return NextResponse.json(account);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Account not found", 404);
    }
    return jsonError("Failed to update account", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessionOrError = await requireSession(_request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const userId = sessionOrError.user.id;
  const { id } = await context.params;
  if (!id?.trim()) {
    return jsonError("Invalid id", 400);
  }

  try {
    const result = await deleteFinanceAccountForUser(id.trim(), userId);
    if (!result.ok) {
      return jsonError("Cannot delete account with linked expenses", 409);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : undefined;
    if (code === "P2025") {
      return jsonError("Account not found", 404);
    }
    return jsonError("Failed to delete account", 500);
  }
}
