export type AnalyticsPeriod = "week" | "month" | "3months" | "year";

export type AnalyticsResponse = {
  totalSpent: number;
  averageExpense: number;
  highestExpense: number;
  dailyAverage: number;
  previousPeriodTotal: number;
  percentageChange: number;
  totalTransactions: number;
  spendingByCategory: {
    category: string;
    total: number;
    percentage: number;
  }[];
  spendingByAccount: {
    accountName: string;
    accountType: string;
    total: number;
    percentage: number;
  }[];
  spendingOverTime: {
    date: string;
    total: number;
  }[];
  topExpenses: {
    id: string;
    title: string;
    amount: number;
    category: string;
    accountName: string;
    date: string;
  }[];
};
