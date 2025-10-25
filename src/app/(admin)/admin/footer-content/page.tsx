"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FooterContent } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';

export default function FooterContentPage() {
  const [contents, setContents] = useState<FooterContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [editingTypes, setEditingTypes] = useState<Record<string, string>>({});
  const [editingSections, setEditingSections] = useState<Record<string, string>>({});
  const [editingOrders, setEditingOrders] = useState<Record<string, number>>({});
  const [editingActive, setEditingActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const response = await apiClient.get<FooterContent[]>('/footer-content');
    if (response.success && response.data) {
      setContents(response.data);
      const values: Record<string, string> = {};
      const types: Record<string, string> = {};
      const sections: Record<string, string> = {};
      const orders: Record<string, number> = {};
      const active: Record<string, boolean> = {};
      
      response.data.forEach((content) => {
        values[content.key] = content.value;
        types[content.key] = content.type;
        sections[content.key] = content.section;
        orders[content.key] = content.order;
        active[content.key] = content.isActive;
      });
      
      setEditingValues(values);
      setEditingTypes(types);
      setEditingSections(sections);
      setEditingOrders(orders);
      setEditingActive(active);
    }
    setLoading(false);
  };

  const handleUpdateContent = async (key: string) => {
    setSaving(true);
    const response = await apiClient.patch('/footer-content', {
      key,
      value: editingValues[key],
      type: editingTypes[key],
      section: editingSections[key],
      order: editingOrders[key],
      isActive: editingActive[key],
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

    const section = prompt('Enter section (social, links, company_info, etc.):') || 'general';
    const type = prompt('Enter type (text, url, email, phone):') || 'text';
    const order = parseInt(prompt('Enter order (number):') || '0');

    setSaving(true);
    const response = await apiClient.post('/footer-content', {
      key,
      value,
      type,
      section,
      order,
      isActive: true,
    });

    if (response.success) {
      await fetchContents();
    }
    setSaving(false);
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    setSaving(true);
    const response = await apiClient.delete(`/footer-content?id=${id}`);

    if (response.success) {
      await fetchContents();
    }
    setSaving(false);
  };

  const contentSections = [
    { title: 'Social Media Links', section: 'social' },
    { title: 'Policy Links', section: 'links' },
    { title: 'Company Information', section: 'company_info' },
    { title: 'General Content', section: 'general' },
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
            Footer Content Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage footer content and settings
          </p>
        </div>
        <Button onClick={handleCreateContent} disabled={saving}>
          Add New Content
        </Button>
      </div>

      {contentSections.map((group) => {
        const groupContents = contents.filter((c) => c.section === group.section);
        
        if (groupContents.length === 0) {
          return null;
        }

        return (
          <ComponentCard key={group.title} title={group.title}>
            <div className="space-y-4">
              {groupContents.map((content) => (
                <div key={content.id} className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {content.key}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Value
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            value={editingValues[content.key] || ''}
                            onChange={(e) =>
                              setEditingValues((prev) => ({ ...prev, [content.key]: e.target.value }))
                            }
                            placeholder="Enter content value"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Type
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            value={editingTypes[content.key] || 'text'}
                            onChange={(e) =>
                              setEditingTypes((prev) => ({ ...prev, [content.key]: e.target.value }))
                            }
                          >
                            <option value="text">Text</option>
                            <option value="url">URL</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Section
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            value={editingSections[content.key] || ''}
                            onChange={(e) =>
                              setEditingSections((prev) => ({ ...prev, [content.key]: e.target.value }))
                            }
                            placeholder="Enter section"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Order
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            value={editingOrders[content.key] || 0}
                            onChange={(e) =>
                              setEditingOrders((prev) => ({ ...prev, [content.key]: parseInt(e.target.value) || 0 }))
                            }
                            placeholder="Enter order"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingActive[content.key] || false}
                            onChange={(e) =>
                              setEditingActive((prev) => ({ ...prev, [content.key]: e.target.checked }))
                            }
                            className="rounded border-gray-300 dark:border-gray-700"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateContent(content.key)}
                          disabled={saving}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteContent(content.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(content.updatedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </ComponentCard>
        );
      })}
    </div>
  );
}
