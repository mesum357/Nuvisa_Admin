"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { SiteContent } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';

export default function ContentPage() {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const response = await apiClient.get<SiteContent[]>('/content');
    if (response.success && response.data) {
      setContents(response.data);
      const values: Record<string, string> = {};
      response.data.forEach((content) => {
        values[content.key] = content.value;
      });
      setEditingValues(values);
    }
    setLoading(false);
  };

  const handleUpdateContent = async (key: string) => {
    setSaving(true);
    const response = await apiClient.patch('/content', {
      key,
      value: editingValues[key],
    });

    if (response.success) {
      await fetchContents();
    }
    setSaving(false);
  };

  const handleCreateContent = async () => {
    const key = prompt('Enter content key:');
    if (!key) return;

    const value = prompt('Enter content value:');
    if (!value) return;

    setSaving(true);
    const response = await apiClient.post('/content', {
      key,
      value,
      type: 'text',
    });

    if (response.success) {
      await fetchContents();
    }
    setSaving(false);
  };

  const contentGroups = [
    {
      title: 'Website Settings',
      keys: ['site_name', 'site_description', 'contact_email', 'contact_phone'],
    },
    {
      title: 'Application Settings',
      keys: ['total_customers_applied', 'appointment_slots_per_day', 'application_fee'],
    },
    {
      title: 'Notices & Alerts',
      keys: ['homepage_notice', 'maintenance_mode', 'urgent_alert'],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Content Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage website content and settings
          </p>
        </div>
        <Button onClick={handleCreateContent} disabled={saving}>
          Add New Content
        </Button>
      </div>

      {contentGroups.map((group) => {
        const groupContents = contents.filter((c) => group.keys.includes(c.key));
        
        if (groupContents.length === 0 && group.keys.length > 0) {
          return null;
        }

        return (
          <ComponentCard key={group.title} title={group.title}>
            <div className="space-y-4">
              {group.keys.map((key) => {
                const content = contents.find((c) => c.key === key);
                const displayKey = (key || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {displayKey}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        value={editingValues[key] || ''}
                        onChange={(e) =>
                          setEditingValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={`Enter ${displayKey.toLowerCase()}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateContent(key)}
                        disabled={saving || editingValues[key] === content?.value}
                      >
                        Save
                      </Button>
                    </div>
                    {content && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {new Date(content.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ComponentCard>
        );
      })}

      <ComponentCard title="All Content">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {contents.map((content) => (
                <tr key={content.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {content.key}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {content.value.length > 50
                      ? content.value.substring(0, 50) + '...'
                      : content.value}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(content.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => {
                        const newValue = prompt('Enter new value:', content.value);
                        if (newValue !== null) {
                          setEditingValues((prev) => ({ ...prev, [content.key]: newValue }));
                          handleUpdateContent(content.key);
                        }
                      }}
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    </div>
  );
}

