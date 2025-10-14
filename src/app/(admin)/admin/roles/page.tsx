"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { AdminRole } from '@/types';
import Button from '@/components/ui/button/Button';

export default function RolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ id?: string; name: string; description?: string; permissions: any }>({ name: '', description: '', permissions: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MODULES: { key: string; label: string; actions: { key: string; label: string }[] }[] = [
    { key: 'applications', label: 'Applications', actions: [
      { key: 'read', label: 'Read' },
      { key: 'write', label: 'Write' },
      { key: 'export', label: 'Export' },
    ]},
    { key: 'users', label: 'Users', actions: [
      { key: 'read', label: 'Read' },
      { key: 'write', label: 'Write' },
    ]},
    { key: 'siteContent', label: 'Site Content', actions: [
      { key: 'read', label: 'Read' },
      { key: 'write', label: 'Write' },
    ]},
    { key: 'roles', label: 'Roles & Permissions', actions: [
      { key: 'read', label: 'Read' },
      { key: 'write', label: 'Write' },
    ]},
  ];

  const togglePermission = (moduleKey: string, actionKey: string) => {
    setForm((prev) => {
      const next = { ...prev } as any;
      const currentModule = { ...(next.permissions?.[moduleKey] || {}) };
      currentModule[actionKey] = !currentModule[actionKey];
      next.permissions = { ...(next.permissions || {}), [moduleKey]: currentModule };
      return next;
    });
  };

  async function fetchRoles() {
    setLoading(true);
    const res = await apiClient.get<AdminRole[]>('/roles', { search });
    if (res.success && res.data) setRoles(res.data as any);
    setLoading(false);
  }

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleEdit = (role: AdminRole) => {
    setForm({ id: role.id, name: role.name, description: role.description || '', permissions: role.permissions || {} });
    setModalOpen(true);
  };

  const handleCreate = () => {
    setForm({ id: undefined, name: '', description: '', permissions: {} });
    setModalOpen(true);
  };

  const handleDelete = async (role: AdminRole) => {
    if (!confirm('Delete this role?')) return;
    await apiClient.delete(`/roles/${role.id}`);
    fetchRoles();
  };

  const handleSave = async () => {
    if (!form.name || !form.name.trim()) {
      setError('Role name is required');
      return;
    }
    setError(null);
    setSaving(true);
    const payload = { name: form.name.trim(), description: (form.description || '').trim() || null, permissions: form.permissions || {} };
    try {
      if (form.id) {
        const res = await apiClient.patch(`/roles/${form.id}`, payload);
        if (!res.success) throw new Error(res.error || 'Update failed');
      } else {
        const res = await apiClient.post('/roles', payload);
        if (!res.success) throw new Error(res.error || 'Create failed');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const prettyPermissions = useMemo(() => (obj: any) => {
    try { return JSON.stringify(obj || {}, null, 2); } catch { return '{}'; }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage custom admin roles with module restrictions</p>
        </div>
        <Button onClick={handleCreate}>New Role</Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No roles found</td></tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{role.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{role.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-pre text-xs text-gray-600 dark:text-gray-400 max-w-[500px]">
                      <pre className="whitespace-pre-wrap">{prettyPermissions(role.permissions)}</pre>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => !role.isSystem && handleEdit(role)}
                        disabled={role.isSystem}
                        className={`text-brand-600 hover:text-brand-700 ${role.isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Edit
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => handleDelete(role)} className="text-red-600 hover:text-red-700">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0b0b0c] rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">{form.id ? 'Edit Role' : 'Create Role'}</h2>
            <div className="grid gap-4">
              
              <input
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Role name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={saving}
              />
              <input
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Description (optional)"
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={saving}
              />
              <div className="space-y-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Permissions</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MODULES.map((mod) => (
                    <div key={mod.key} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="font-medium text-gray-900 dark:text-white mb-3">{mod.label}</div>
                      <div className="flex flex-wrap gap-4">
                        {mod.actions.map((act) => {
                          const checked = Boolean((form.permissions?.[mod.key] || {})[act.key]);
                          return (
                            <label key={act.key} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(mod.key, act.key)}
                                disabled={saving}
                              />
                              {act.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => !saving && setModalOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.name.trim()}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

