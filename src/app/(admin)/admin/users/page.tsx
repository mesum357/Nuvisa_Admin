"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { User, UserStatus, PaginatedResponse } from '@/types';
import { formatDate, getStatusColor, downloadCSV } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import Button from '@/components/ui/button/Button';
import { Suspense } from 'react';

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  // Keep only search filter as requested
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const response = await apiClient.get<PaginatedResponse<User>>('/backend/users', {
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      search: debouncedSearch,
    });
    if (response.success && response.data) {
      setUsers(response.data.data || []);
      if (response.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: response.data?.pagination?.total || 0,
          totalPages: response.data?.pagination?.totalPages || 0,
        }));
      }
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const handleExport = useCallback(async () => {
    const response = await apiClient.get<any[]>('/export/users', { search: debouncedSearch });
    if (response.success && response.data) {
      downloadCSV(response.data, `users-${Date.now()}`);
    }
  }, [debouncedSearch]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleUpdateUserStatus = useCallback(async (userId: string, newStatus: UserStatus) => {
    const response = await apiClient.patch(`/backend/users/${userId}`, {
      status: newStatus,
    });

    if (response.success) {
      fetchUsers();
    }
  }, [fetchUsers]);

  const handleVerifyUser = useCallback(async (userId: string) => {
    const response = await apiClient.patch(`/backend/users/${userId}`, {
      isVerified: true,
      status: 'ACTIVE',
    });

    if (response.success) {
      fetchUsers();
    }
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all user accounts
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          Export CSV
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {(user.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.isVerified ? (
                        <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <a
                        href={`/admin/users/${encodeURIComponent(user.email || user.id)}`}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        View
                      </a>
                      {!user.isVerified && (
                        <button
                          onClick={() => handleVerifyUser(user.id)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400"
                        >
                          Verify
                        </button>
                      )}
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleUpdateUserStatus(user.id, 'BLOCKED')}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}
                          className="text-green-600 hover:text-green-700 dark:text-green-400"
                        >
                          Activate
                        </button>
                      )}
                      {/* Assign role UI removed as per request */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {users.length} of {pagination.total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersContent />
    </Suspense>
  );
}

