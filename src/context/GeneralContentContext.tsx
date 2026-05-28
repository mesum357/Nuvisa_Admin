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
import { SiteContent } from "@/types";

type GeneralContentContextValue = {
  rows: SiteContent[];
  loading: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
};

const GeneralContentContext = createContext<GeneralContentContextValue | null>(
  null,
);

export function GeneralContentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rows, setRows] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const response = await apiClient.get<SiteContent[]>("/content");
      if (response.success && Array.isArray(response.data)) {
        setRows(response.data);
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ rows, loading, refresh }),
    [rows, loading, refresh],
  );

  return (
    <GeneralContentContext.Provider value={value}>
      {children}
    </GeneralContentContext.Provider>
  );
}

export function useGeneralContent() {
  const ctx = useContext(GeneralContentContext);
  if (!ctx) {
    throw new Error(
      "useGeneralContent must be used within GeneralContentProvider",
    );
  }
  return ctx;
}

export function pickContentValue(
  rows: SiteContent[],
  key: string,
): string {
  return rows.find((row) => row.key === key)?.value || "";
}

export function useContentByKey() {
  const { rows, loading, refresh } = useGeneralContent();
  const byKey = useMemo(() => {
    const map: Record<string, SiteContent> = {};
    for (const row of rows) {
      map[row.key] = row;
    }
    return map;
  }, [rows]);
  return { byKey, loading, refresh, rows };
}
