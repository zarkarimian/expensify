"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsKeys } from "@/src/hooks/query-keys";
import { fetchAnalytics } from "@/src/lib/analytics-api";
import type { AnalyticsPeriod } from "@/src/lib/analytics-types";

export function useAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: analyticsKeys.byPeriod(period),
    queryFn: () => fetchAnalytics(period),
  });
}
