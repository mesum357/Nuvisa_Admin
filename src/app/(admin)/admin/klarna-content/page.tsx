"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { KlarnaContent } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';

export default function KlarnaContentPage() {
  const [contents, setContents] = useState<KlarnaContent[]>([]);
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
    const response = await apiClient.get<KlarnaContent[]>('/klarna-content');
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
    const response = await apiClient.patch('/klarna-content', {
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

  const handleCreateDefaultContent = async () => {
    if (!confirm('This will create default Klarna content. Continue?')) return;

    setSaving(true);
    
    const response = await apiClient.post('/klarna-content/seed');
    
    if (response.success) {
      await fetchContents();
      alert('Default content created successfully!');
    } else {
      alert(response.message || 'Failed to create content');
    }
    
    setSaving(false);
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    setSaving(true);
    const response = await apiClient.delete(`/klarna-content?id=${id}`);

    if (response.success) {
      await fetchContents();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Show empty state if no content
  if (contents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Klarna Content Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage the Klarna payment section content displayed on the homepage
            </p>
          </div>
        </div>

        <ComponentCard title="No Content Yet">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              No Klarna content has been set up yet. Click the button below to create default content.
            </p>
            <button
              onClick={handleCreateDefaultContent}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Creating...' : 'Create Default Content'}
            </button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Klarna Content Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage the Klarna payment section content displayed on the homepage
          </p>
        </div>
      </div>

      {/* Heading Section */}
      {contents.filter(c => c.section === 'heading').length > 0 && (
        <ComponentCard title="Main Heading">
          <div className="space-y-4">
            {contents.filter(c => c.section === 'heading').map((content) => (
              <div key={content.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key
                  </label>
                  <input
                    type="text"
                    value={content.key}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value (Heading Text)
                  </label>
                  <textarea
                    value={editingValues[content.key] || content.value}
                    onChange={(e) => setEditingValues(prev => ({ ...prev, [content.key]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${content.id}`}
                      checked={editingActive[content.key] !== undefined ? editingActive[content.key] : content.isActive}
                      onChange={(e) => setEditingActive(prev => ({ ...prev, [content.key]: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`active-${content.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateContent(content.key)}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}

      {/* Subtitle Section */}
      {contents.filter(c => c.section === 'subtitle').length > 0 && (
        <ComponentCard title="Subtitle">
          <div className="space-y-4">
            {contents.filter(c => c.section === 'subtitle').map((content) => (
              <div key={content.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Key
                  </label>
                  <input
                    type="text"
                    value={content.key}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value (Subtitle Text)
                  </label>
                  <textarea
                    value={editingValues[content.key] || content.value}
                    onChange={(e) => setEditingValues(prev => ({ ...prev, [content.key]: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${content.id}`}
                      checked={editingActive[content.key] !== undefined ? editingActive[content.key] : content.isActive}
                      onChange={(e) => setEditingActive(prev => ({ ...prev, [content.key]: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`active-${content.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateContent(content.key)}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}

      {/* Details Section */}
      {contents.filter(c => c.section === 'details').length > 0 && (
        <ComponentCard title="Payment Details">
          <div className="space-y-4">
            {contents.filter(c => c.section === 'details').map((content) => (
              <div key={content.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Key
                    </label>
                    <input
                      type="text"
                      value={content.key}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={editingValues[content.key] || content.value}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, [content.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${content.id}`}
                      checked={editingActive[content.key] !== undefined ? editingActive[content.key] : content.isActive}
                      onChange={(e) => setEditingActive(prev => ({ ...prev, [content.key]: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`active-${content.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateContent(content.key)}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
