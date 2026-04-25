import { Prisma } from "../../../../../generated/prisma/client";
import { patchExpenseSchema } from "@/src/lib/expense-schemas";
import { patchExpenseForUser } from "@/src/lib/expense.service";
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

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const userId = sessionOrError.user.id;
  const { id: expenseId } = await context.params;
  if (!expenseId?.trim()) {
    return jsonError("Invalid id", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = patchExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  try {
    const expense = await patchExpenseForUser(
      userId,
      expenseId.trim(),
      parsed.data,
    );
    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Expense or account not found", 404);
    }
    return jsonError("Failed to update expense", 500);
  }
}
