import type { AnalyticsPeriod, AnalyticsResponse } from "@/src/lib/analytics-types";

async function parseJsonError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchAnalytics(period: AnalyticsPeriod): Promise<AnalyticsResponse> {
  const res = await fetch(`/api/analytics?period=${encodeURIComponent(period)}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await parseJsonError(res));
  }
  return res.json() as Promise<AnalyticsResponse>;
}
