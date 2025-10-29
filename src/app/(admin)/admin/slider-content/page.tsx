"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import ComponentCard from '@/components/common/ComponentCard';

type SliderItem = {
  id: string;
  key: string;
  value: string;
  type: string;
  section: string;
  order: number;
  isActive: boolean;
};

export default function SliderContentPage() {
  const [contents, setContents] = useState<SliderItem[]>([]);
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
    const response = await apiClient.get<SliderItem[]>('/slider-content');
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
    const response = await apiClient.patch('/slider-content', {
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
    const section = prompt('Enter section (badges, embassy_note, urgent_note, counters, slots, banner):') || 'general';
    const type = prompt('Enter type (text, number, json):') || 'text';
    const order = parseInt(prompt('Enter order (number):') || '0');
    setSaving(true);
    const response = await apiClient.post('/slider-content', {
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
    const response = await apiClient.delete(`/slider-content?id=${id}`);
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

  return (
    <div className="space-y-6">
      <ComponentCard title="Slider Content" desc="Manage homepage slider dynamic content.">
        <div className="mb-4">
          <button onClick={handleCreateContent} className="px-4 py-2 bg-primary text-white rounded">Add Content</button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {contents.map((item) => (
            <div key={item.id} className="p-4 border rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                <div className="md:col-span-1">
                  <div className="text-xs text-gray-500">Key</div>
                  <div className="font-mono text-sm break-all">{item.key}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-500">Value</div>
                  <input className="w-full border px-2 py-1 rounded" value={editingValues[item.key] || ''} onChange={(e) => setEditingValues((s) => ({ ...s, [item.key]: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Section</div>
                  <input className="w-full border px-2 py-1 rounded" value={editingSections[item.key] || ''} onChange={(e) => setEditingSections((s) => ({ ...s, [item.key]: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Type</div>
                  <input className="w-full border px-2 py-1 rounded" value={editingTypes[item.key] || ''} onChange={(e) => setEditingTypes((s) => ({ ...s, [item.key]: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Order</div>
                  <input type="number" className="w-full border px-2 py-1 rounded" value={editingOrders[item.key] ?? 0} onChange={(e) => setEditingOrders((s) => ({ ...s, [item.key]: parseInt(e.target.value || '0') }))} />
                </div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!editingActive[item.key]} onChange={(e) => setEditingActive((s) => ({ ...s, [item.key]: e.target.checked }))} />
                  <span>Active</span>
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button disabled={saving} onClick={() => handleUpdateContent(item.key)} className="px-3 py-1 text-dark border rounded">Save</button>
                <button disabled={saving} onClick={() => handleDeleteContent(item.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </ComponentCard>
    </div>
  );
}


