"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Banknote,
  Bitcoin,
  CreditCard,
  Loader2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAnalytics } from "@/src/hooks/use-analytics";
import type { AnalyticsPeriod } from "@/src/lib/analytics-types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const periodOptions: { label: string; value: AnalyticsPeriod }[] = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last 12 Months", value: "year" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function accountIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized === "bank") return Banknote;
  if (normalized === "cash") return Wallet;
  if (normalized === "crypto") return Bitcoin;
  return CreditCard;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function TrendChart({
  data,
  width = 920,
  height = 260,
}: {
  data: { date: string; total: number }[];
  width?: number;
  height?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.total), 1);
  const padding = 24;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const labelInterval = Math.max(1, Math.ceil(data.length / 8));

  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * innerWidth;
    const y = padding + (1 - item.total / max) * innerHeight;
    return { ...item, x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-border" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="stroke-border" />
        <path d={path} fill="none" className="stroke-primary" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g
            key={`${point.date}-${index}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? 5 : 3}
              className="fill-primary cursor-pointer"
            />
            {index % labelInterval === 0 || index === data.length - 1 ? (
              <text x={point.x} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                {point.date}
              </text>
            ) : null}
          </g>
        ))}
        {activeIndex !== null ? (
          <g>
            <rect
              x={Math.min(width - 190, points[activeIndex].x + 10)}
              y={Math.max(8, points[activeIndex].y - 54)}
              width={180}
              height={44}
              rx={8}
              className="fill-card stroke-border"
            />
            <text
              x={Math.min(width - 180, points[activeIndex].x + 20)}
              y={Math.max(24, points[activeIndex].y - 34)}
              className="fill-card-foreground text-xs"
            >
              {points[activeIndex].date}
            </text>
            <text
              x={Math.min(width - 180, points[activeIndex].x + 20)}
              y={Math.max(42, points[activeIndex].y - 16)}
              className="fill-card-foreground text-xs font-semibold"
            >
              {formatCurrency(points[activeIndex].total)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

const ExpensesRengeCard = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const { data, isPending, isError, error } = useAnalytics(period);

  if (isPending) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p>Loading analytics...</p>
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="ml-20 mr-20 mt-8">
        <p className="text-destructive">{error instanceof Error ? error.message : "Failed to load analytics"}</p>
      </section>
    );
  }

  const isDown = data.percentageChange < 0;
  const isUp = data.percentageChange > 0;
  const showInsight = data.previousPeriodTotal > 0;

  return (
    <div className="ml-20 mr-20 mt-6 space-y-6">
      <Tabs value={period} onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}>
        <TabsList>
          {periodOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Spent</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(data.totalSpent)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Average Expense</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(data.averageExpense)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Highest Expense</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(data.highestExpense)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Daily Average</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(data.dailyAverage)}</p></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>vs Last Period</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            {isDown ? <TrendingDown className="h-5 w-5 text-emerald-600" /> : null}
            {isUp ? <TrendingUp className="h-5 w-5 text-rose-600" /> : null}
            <p className="text-2xl font-bold">{Math.abs(data.percentageChange).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Total Transactions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.totalTransactions}</p></CardContent></Card>
      </div>

      {showInsight ? (
        <Alert className={isDown ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}>
          <AlertDescription className={isDown ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
            {isDown
              ? `🎉 You spent ${Math.abs(data.percentageChange).toFixed(1)}% less than last period — great job!`
              : `⚠️ You spent ${Math.abs(data.percentageChange).toFixed(1)}% more than last period.`}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Spending Trend</CardTitle></CardHeader>
        <CardContent>
          {data.spendingOverTime.length === 0 ? (
            <EmptyState text="No spending trend available for this period." />
          ) : (
            <TrendChart data={data.spendingOverTime} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Spending by Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.spendingByAccount.length === 0 ? (
              <EmptyState text="No account spending data available." />
            ) : (
              data.spendingByAccount.map((account) => {
                const Icon = accountIcon(account.accountType);
                return (
                  <div key={`${account.accountName}-${account.accountType}`} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{account.accountName}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(account.total)} ({account.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={Math.min(100, account.percentage)} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top 5 Expenses</CardTitle></CardHeader>
          <CardContent>
            {data.topExpenses.length === 0 ? (
              <EmptyState text="No expenses found for this period." />
            ) : (
              <div className="space-y-3">
                {data.topExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{expense.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{expense.category}</Badge>
                        <span>{expense.accountName}</span>
                        <span>{format(new Date(expense.date), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Category Statistics</CardTitle></CardHeader>
        <CardContent>
          {data.spendingByCategory.length === 0 ? (
            <EmptyState text="No category statistics available for this period." />
          ) : (
            <div className="space-y-3">
              {data.spendingByCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                    <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}% of spending</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesRengeCard;