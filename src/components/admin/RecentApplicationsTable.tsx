"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Application } from '@/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

export default function RecentApplicationsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async (showLoading: boolean = true) => {
    if (showLoading) {
      setLoading(true);
    }
    // Get today's applications from dashboard stats instead of recent applications
    const response = await apiClient.get<{ data: { recentApplications: Application[] } }>('/dashboard/stats');
    if (response.success && response.data) {
      setApplications((response.data as any).recentApplications || []);
    }
    if (showLoading) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // No auto-refresh; fetch once on mount

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Today&apos;s Applications
          </h3>
          {!loading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </span>
          )}
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
                Status
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
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading today&apos;s applications...</span>
                  </div>
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="py-8">
                    <div className="text-sm">No applications submitted today</div>
                    <div className="text-xs mt-1">Applications submitted today will appear here</div>
                  </div>
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {app.applicationNo || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {app.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {app.user?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {(app.status || '').replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())}
                    </span>
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
        <Link
          href="/admin/applications"
          className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
        >
          View All Applications →
        </Link>
      </div>
    </div>
  );
}

