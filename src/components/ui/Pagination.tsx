"use client";

import React from "react";
import Button from "@/components/ui/button/Button";

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

export default function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: Props) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pages = React.useMemo(() => {
    const arr: number[] = [];
    const maxShown = 5;
    let start = Math.max(1, page - Math.floor(maxShown / 2));
    const end = Math.min(totalPages, start + maxShown - 1);
    start = Math.max(1, Math.min(start, end - maxShown + 1));
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="w-full flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1 rounded-md text-sm border ${
                p === page
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
        >
          Next
        </Button>
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page</span>
          <select
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}


