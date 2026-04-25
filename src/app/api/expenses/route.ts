import { Prisma } from "../../../../generated/prisma/client";
import { createExpenseSchema } from "@/src/lib/expense-schemas";
import {
  createExpense,
  deleteExpenseForUser,
  listExpensesForUser,
} from "@/src/lib/expense.service";
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
    const expenses = await listExpensesForUser(userId);
    return NextResponse.json(expenses);
  } catch {
    return jsonError("Failed to fetch expenses", 500);
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

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  try {
    const expense = await createExpense(userId, parsed.data);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Account not found", 404);
    }
    return jsonError("Failed to create expense", 500);
  }
}

export async function DELETE(request: Request) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const userId = sessionOrError.user.id;

  const id = new URL(request.url).searchParams.get("id");
  if (!id?.trim()) {
    return jsonError("Query parameter id is required", 400);
  }

  try {
    await deleteExpenseForUser(userId, id.trim());
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Expense not found", 404);
    }
    return jsonError("Failed to delete expense", 500);
  }
}
