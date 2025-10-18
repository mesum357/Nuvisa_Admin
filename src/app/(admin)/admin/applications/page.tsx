"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Application, PaginatedResponse } from '@/types';
import { formatDate, formatCurrency, getStatusColor, downloadCSV } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import Button from '@/components/ui/button/Button';
import { Suspense } from 'react';
import Pagination from '@/components/ui/Pagination';

function ApplicationsContent() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.country) params.country = filters.country;

    const response = await apiClient.get<PaginatedResponse<Application>>('/backend/applications', params);
    if (response.success && response.data) {
      const list = Array.isArray(response.data.data) ? response.data.data : [];
      setApplications(list);
      if (response.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: Number(response.data?.pagination?.total || 0),
          totalPages: Number(response.data?.pagination?.totalPages || 0),
        }));
      }
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, debouncedSearch, filters.country, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleExport = useCallback(async () => {
    const response = await apiClient.get<any[]>('/export/applications', {
      search: debouncedSearch,
    });
    if (response.success && response.data) {
      downloadCSV(response.data, `applications-${Date.now()}`);
    }
  }, [debouncedSearch]);

  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Status filter removed

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Applications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all application submissions
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          Export CSV
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search applications..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by country..."
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              value={filters.country}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, country: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Application No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-pulse">Loading...</div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {app.applicationNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {app.user?.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {app.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(app as any).country || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {(app.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(app.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Showing {applications.length} of {pagination.total} applications
          </div>
          <Pagination
            page={pagination.page}
            totalPages={Math.max(pagination.totalPages, 1)}
            pageSize={pagination.limit}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            onPageSizeChange={(size) => setPagination((prev) => ({ ...prev, limit: size, page: 1 }))}
          />
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}

