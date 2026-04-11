import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { createExpenseSchema, updateExpenseSchema } from "@/src/lib/expense-schemas";
import { NextResponse } from "next/server";

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(details !== undefined ? { error: message, details } : { error: message }, {
    status,
  });
}

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(expenses);
  } catch {
    return jsonError("Failed to fetch expenses", 500);
  }
}

export async function POST(request: Request) {
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
    const expense = await prisma.expense.create({
      data: parsed.data,
    });
    return NextResponse.json(expense, { status: 201 });
  } catch {
    return jsonError("Failed to create expense", 500);
  }
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const { id, ...updates } = parsed.data;

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json(expense);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Expense not found", 404);
    }
    return jsonError("Failed to update expense", 500);
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id?.trim()) {
    return jsonError("Query parameter id is required", 400);
  }

  try {
    await prisma.expense.delete({
      where: { id: id.trim() },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Expense not found", 404);
    }
    return jsonError("Failed to delete expense", 500);
  }
}
