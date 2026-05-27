"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient } from "@/lib/api-client";
import { DashboardStats } from "@/types";

type DashboardDataContextValue = {
  stats: DashboardStats | null;
  loading: boolean;
  refresh: (showLoading?: boolean) => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null,
);

export function DashboardDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const response = await apiClient.get<DashboardStats>("/dashboard/stats");
    if (response.success && response.data) {
      setStats(response.data);
    }
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ stats, loading, refresh }),
    [stats, loading, refresh],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }
  return ctx;
}
