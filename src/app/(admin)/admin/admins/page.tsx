"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Button from '@/components/ui/button/Button';

type AdminRow = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  role: string;
  roleId?: string | null;
  customRole?: { id: string; name: string } | null;
  createdAt: string | Date;
};

export default function AdminsPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState<{ name: string; email: string; password: string; roleId?: string; isActive: boolean }>({ name: '', email: '', password: '', roleId: '', isActive: true });
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get<{ data: AdminRow[]; pagination: any }>(
      '/admins',
      { page: String(pagination.page), limit: String(pagination.limit), search }
    );
    if (res.success && res.data) {
      const payload: any = res.data;
      setRows(payload.data || []);
      if (payload.pagination) {
        setPagination((p) => ({ ...p, total: payload.pagination.total || 0, totalPages: payload.pagination.totalPages || 0 }));
      }
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    (async () => {
      const r = await apiClient.get<any[]>('/roles');
      if (r.success && r.data) setRoles(((r.data as unknown) as any[]).map((x: any) => ({ id: x.id, name: x.name })));
    })();
  }, []);

  const assignRole = async (adminId: string, roleId: string | null) => {
    const res = await apiClient.patch(`/admins/${adminId}`, { roleId });
    if (res.success) fetchAdmins();
  };

  const toggleActive = async (adminId: string, next: boolean) => {
    const res = await apiClient.patch(`/admins/${adminId}`, { isActive: next });
    if (res.success) fetchAdmins();
  };

  const createAdmin = async () => {
    if (!newAdmin.name.trim()) { setCreateError('Name is required'); return; }
    if (!newAdmin.email.trim()) { setCreateError('Email is required'); return; }
    if (!newAdmin.password.trim()) { setCreateError('Password is required'); return; }
    setCreateError(null);
    setCreating(true);
    const res = await apiClient.post('/admins', {
      name: newAdmin.name.trim(),
      email: newAdmin.email.trim(),
      password: newAdmin.password,
      roleId: newAdmin.roleId || undefined,
      isActive: newAdmin.isActive,
    });
    setCreating(false);
    if (res.success) {
      setNewAdmin({ name: '', email: '', password: '', roleId: '', isActive: true });
      setModalOpen(false);
      fetchAdmins();
    } else {
      setCreateError(res.error || 'Failed to create admin');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admins</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage admin accounts and assign roles</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            placeholder="Search admins..."
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <Button onClick={() => setModalOpen(true)}>Add Admin</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No admins found</td></tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{a.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{a.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        value={a.roleId || ''}
                        onChange={(e) => assignRole(a.id, e.target.value || null)}
                      >
                        <option value="">— None —</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {a.isActive ? (
                        <span className="text-green-600 dark:text-green-400">Active</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button onClick={() => toggleActive(a.id, !a.isActive)} className="text-brand-600 hover:text-brand-700">
                        {a.isActive ? 'Disable' : 'Enable'}
                      </button>
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
              Showing {rows.length} of {pagination.total} admins
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0b0b0c] rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Add Admin</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={newAdmin.name}
                onChange={(e) => setNewAdmin((s) => ({ ...s, name: e.target.value }))}
                placeholder="Name"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                disabled={creating}
              />
              <input
                value={newAdmin.email}
                onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))}
                placeholder="Email"
                type="email"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                disabled={creating}
              />
              <input
                value={newAdmin.password}
                onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
                placeholder="Password"
                type="password"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                disabled={creating}
              />
              <select
                value={newAdmin.roleId || ''}
                onChange={(e) => setNewAdmin((s) => ({ ...s, roleId: e.target.value }))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                disabled={creating}
              >
                <option value="">Role (optional)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={newAdmin.isActive} onChange={(e) => setNewAdmin((s) => ({ ...s, isActive: e.target.checked }))} disabled={creating} />
                Active
              </label>
              {createError && <div className="md:col-span-2 text-sm text-red-600 dark:text-red-400">{createError}</div>}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => !creating && setModalOpen(false)} disabled={creating}>Cancel</Button>
              <Button onClick={createAdmin} disabled={creating}>{creating ? 'Adding...' : 'Add Admin'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


