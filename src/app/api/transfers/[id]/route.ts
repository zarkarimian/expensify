import { patchTransferSchema } from "@/src/lib/account-schemas";
import {
  deleteTransferForUser,
  updateTransferForUser,
} from "@/src/lib/transfer.service";
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

  const parsed = patchTransferSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  try {
    const t = await updateTransferForUser(userId, id.trim(), parsed.data);
    return NextResponse.json(t);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Transfer not found", 404);
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg === "SAME_ACCOUNT") {
      return jsonError("From and to accounts must differ", 400);
    }
    if (msg === "ACCOUNT_NOT_FOUND") {
      return jsonError("One or more accounts not found", 404);
    }
    if (msg === "INSUFFICIENT_FUNDS") {
      return jsonError("Insufficient funds in the source account", 400);
    }
    return jsonError("Failed to update transfer", 500);
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
    await deleteTransferForUser(userId, id.trim());
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Transfer not found", 404);
    }
    return jsonError("Failed to delete transfer", 500);
  }
}
