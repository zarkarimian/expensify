import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { format } from "date-fns";
import { NextResponse } from "next/server";

type Period = "week" | "month" | "3months" | "year";

type DateRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  bucket: "day" | "month";
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 0, 0, 0, 0);
}

function diffCalendarDays(a: Date, b: Date) {
  const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((aUtc - bUtc) / (1000 * 60 * 60 * 24));
}

function getRange(period: Period, now: Date): DateRange {
  const todayEnd = endOfDay(now);

  if (period === "week") {
    const end = todayEnd;
    const start = startOfDay(addDays(end, -6));
    const previousEnd = endOfDay(addDays(start, -1));
    const previousStart = startOfDay(addDays(previousEnd, -6));
    return { start, end, previousStart, previousEnd, bucket: "day" };
  }

  if (period === "3months") {
    const end = todayEnd;
    const start = startOfMonth(addMonths(now, -2));
    const length = diffCalendarDays(end, start) + 1;
    const previousEnd = endOfDay(addDays(start, -1));
    const previousStart = startOfDay(addDays(previousEnd, -(length - 1)));
    return { start, end, previousStart, previousEnd, bucket: "month" };
  }

  if (period === "year") {
    // Rolling last 12 months (inclusive), ending today.
    const end = todayEnd;
    const start = startOfDay(addDays(end, -364));
    const length = diffCalendarDays(end, start) + 1;
    const previousEnd = endOfDay(addDays(start, -1));
    const previousStart = startOfDay(addDays(previousEnd, -(length - 1)));
    return { start, end, previousStart, previousEnd, bucket: "month" };
  }

  const end = todayEnd;
  const start = startOfMonth(now);
  const length = diffCalendarDays(end, start) + 1;
  const previousEnd = endOfDay(addDays(start, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(length - 1)));
  return { start, end, previousStart, previousEnd, bucket: "day" };
}

function safeCategory(category: string | null | undefined) {
  return category?.trim() || "General";
}

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const periodParam = url.searchParams.get("period");
  const period: Period =
    periodParam === "week" || periodParam === "month" || periodParam === "3months" || periodParam === "year"
      ? periodParam
      : "month";

  const range = getRange(period, new Date());

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: range.previousStart,
          lte: range.end,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        account: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    const inCurrent = expenses.filter(
      (expense) => expense.createdAt >= range.start && expense.createdAt <= range.end,
    );
    const inPrevious = expenses.filter(
      (expense) => expense.createdAt >= range.previousStart && expense.createdAt <= range.previousEnd,
    );

    const totalSpent = inCurrent.reduce((sum, expense) => sum + expense.amount, 0);
    const previousPeriodTotal = inPrevious.reduce((sum, expense) => sum + expense.amount, 0);
    const highestExpense = inCurrent.reduce((max, expense) => Math.max(max, expense.amount), 0);
    const totalTransactions = inCurrent.length;
    const averageExpense = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
    const daysInPeriod = diffCalendarDays(range.end, range.start) + 1;
    const dailyAverage = daysInPeriod > 0 ? totalSpent / daysInPeriod : 0;

    const percentageChange =
      previousPeriodTotal > 0 ? ((totalSpent - previousPeriodTotal) / previousPeriodTotal) * 100 : 0;

    const categoryTotals = new Map<string, number>();
    const accountTotals = new Map<string, { accountName: string; accountType: string; total: number }>();

    for (const expense of inCurrent) {
      const category = safeCategory(expense.category);
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + expense.amount);

      const accountName = expense.account?.name ?? "Unassigned";
      const accountType = expense.account?.type ?? "other";
      const accountKey = `${accountName}::${accountType}`;
      const current = accountTotals.get(accountKey);
      accountTotals.set(accountKey, {
        accountName,
        accountType,
        total: (current?.total ?? 0) + expense.amount,
      });
    }

    const spendingByCategory = Array.from(categoryTotals.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage: percentage(total, totalSpent),
      }))
      .sort((a, b) => b.total - a.total);

    const spendingByAccount = Array.from(accountTotals.values())
      .map((account) => ({
        ...account,
        percentage: percentage(account.total, totalSpent),
      }))
      .sort((a, b) => b.total - a.total);

    // Always bucket trend by month (monthly spending).
    const bucketTotals = new Map<string, number>();
    for (let cursor = startOfMonth(range.start); cursor <= range.end; cursor = addMonths(cursor, 1)) {
      bucketTotals.set(format(cursor, "MMM yyyy"), 0);
    }
    for (const expense of inCurrent) {
      const key = format(startOfMonth(expense.createdAt), "MMM yyyy");
      bucketTotals.set(key, (bucketTotals.get(key) ?? 0) + expense.amount);
    }

    const spendingOverTime = Array.from(bucketTotals.entries()).map(([date, total]) => ({
      date,
      total,
    }));

    const topExpenses = [...inCurrent]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((expense) => ({
        id: expense.id,
        title: expense.title?.trim() || "Untitled expense",
        amount: expense.amount,
        category: safeCategory(expense.category),
        accountName: expense.account?.name ?? "Unassigned",
        date: expense.createdAt.toISOString(),
      }));

    return NextResponse.json({
      totalSpent,
      averageExpense,
      highestExpense,
      dailyAverage,
      previousPeriodTotal,
      percentageChange,
      totalTransactions,
      spendingByCategory,
      spendingByAccount,
      spendingOverTime,
      topExpenses,
    });
  } catch {
    return jsonError("Failed to fetch analytics", 500);
  }
}
