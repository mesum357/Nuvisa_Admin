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
  const [basePriceGbp, setBasePriceGbp] = useState<string>("");
  const [basePriceKeyExists, setBasePriceKeyExists] = useState<boolean>(false);
  const [strikeOutPriceGbp, setStrikeOutPriceGbp] = useState<string>("");
  const [strikeOutPriceKeyExists, setStrikeOutPriceKeyExists] = useState<boolean>(false);

  const humanizeKey = (key: string) => {
    if (!key) return '';
    const spaced = key.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
  };

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

      // Initialize dedicated base price field from known keys if present
      const baseKeyOrder = [
        'visa_base_price_gbp',
        'base_fee_gbp',
        'visa_price_gbp',
        'visa_price',
        'base_fee',
      ];
      let foundKey: string | null = null;
      for (const k of baseKeyOrder) {
        if (values[k] !== undefined) {
          foundKey = k;
          break;
        }
      }
      if (foundKey) {
        setBasePriceGbp(values[foundKey] || "");
        setBasePriceKeyExists(foundKey === 'visa_base_price_gbp');
      } else {
        setBasePriceGbp("");
        setBasePriceKeyExists(false);
      }

      // Initialize dedicated strike-out price field from known keys if present
      const strikeOutKeyOrder = [
        'strike_out_price_gbp',
        'strike_out_price',
        'original_price_gbp',
        'original_price',
      ];
      let foundStrikeOutKey: string | null = null;
      for (const k of strikeOutKeyOrder) {
        if (values[k] !== undefined) {
          foundStrikeOutKey = k;
          break;
        }
      }
      if (foundStrikeOutKey) {
        setStrikeOutPriceGbp(values[foundStrikeOutKey] || "");
        setStrikeOutPriceKeyExists(foundStrikeOutKey === 'strike_out_price_gbp');
      } else {
        setStrikeOutPriceGbp("");
        setStrikeOutPriceKeyExists(false);
      }
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

  const handleSaveBasePrice = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const trimmed = (basePriceGbp || '').trim();
    if (!trimmed) {
      alert('Please enter a value for discount price');
      return;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) {
      alert('Please enter a valid positive number for price');
      return;
    }
    
    if (saving) {
      return; // Prevent double submission
    }
    
    setSaving(true);
    try {
      // Use POST with upsert - it will create if doesn't exist, or update if it does
      const response = await apiClient.post('/slider-content', {
        key: 'visa_base_price_gbp',
        value: String(num),
        type: 'number',
        section: 'pricing',
        order: 0,
        isActive: true,
      });
      
      if (response && response.success) {
        await fetchContents();
        alert('Discount price saved successfully!');
      } else {
        const errorMsg = response?.error || response?.details || 'Failed to save discount price. Please try again.';
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred while saving discount price. Please try again.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStrikeOutPrice = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const trimmed = (strikeOutPriceGbp || '').trim();
    if (!trimmed) {
      alert('Please enter a value for strike-out price');
      return;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) {
      alert('Please enter a valid positive number for strike-out price');
      return;
    }
    
    if (saving) {
      return; // Prevent double submission
    }
    
    setSaving(true);
    try {
      const payload = {
        key: 'strike_out_price_gbp',
        value: String(num),
        type: 'number',
        section: 'pricing',
        order: 1,
        isActive: true,
      };
      
      const response = await apiClient.post('/slider-content', payload);
      
      if (response && response.success) {
        // Refresh the contents to update the UI
        await fetchContents();
        // Show success message
        alert('Strike-out price saved successfully!');
      } else {
        const errorMsg = response?.error || response?.details || 'Failed to save strike-out price. Please try again.';
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred while saving strike-out price. Please try again.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
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
      <ComponentCard title="Discount Price (GBP)" desc="Controls the discounted visa fee shown on the homepage slider.">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Label</div>
            <div className="text-sm break-words">{humanizeKey('visa_base_price_gbp')}</div>
            <div className="text-[10px] text-gray-500 mt-1">Key: <span className="font-mono">visa_base_price_gbp</span></div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Value (GBP)</div>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="w-full border px-2 py-1 rounded"
              value={basePriceGbp}
              onChange={(e) => setBasePriceGbp(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <div className="text-xs text-gray-500">Type</div>
            <input className="w-full border px-2 py-1 rounded" value={'number'} readOnly />
          </div>
          <div className="md:col-span-1">
            <div className="text-xs text-gray-500">Section</div>
            <input className="w-full border px-2 py-1 rounded" value={'pricing'} readOnly />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button 
            type="button"
            disabled={saving || loading} 
            onClick={handleSaveBasePrice}
            className="px-3 py-1 text-dark border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {saving ? 'Saving...' : (basePriceKeyExists ? 'Save' : 'Create')}
          </button>
        </div>
      </ComponentCard>
      <ComponentCard title="Strike Out Price (GBP)" desc="Controls the original/strike-out price shown on the homepage slider. Default: 200 GBP per traveler.">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Label</div>
            <div className="text-sm break-words">{humanizeKey('strike_out_price_gbp')}</div>
            <div className="text-[10px] text-gray-500 mt-1">Key: <span className="font-mono">strike_out_price_gbp</span></div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Value (GBP)</div>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="w-full border px-2 py-1 rounded"
              value={strikeOutPriceGbp}
              onChange={(e) => setStrikeOutPriceGbp(e.target.value)}
              placeholder="200"
            />
          </div>
          <div className="md:col-span-1">
            <div className="text-xs text-gray-500">Type</div>
            <input className="w-full border px-2 py-1 rounded" value={'number'} readOnly />
          </div>
          <div className="md:col-span-1">
            <div className="text-xs text-gray-500">Section</div>
            <input className="w-full border px-2 py-1 rounded" value={'pricing'} readOnly />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button 
            type="button"
            disabled={saving || loading} 
            onClick={handleSaveStrikeOutPrice}
            className="px-3 py-1 text-dark border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {saving ? 'Saving...' : (strikeOutPriceKeyExists ? 'Save' : 'Create')}
          </button>
        </div>
      </ComponentCard>
      <ComponentCard title="Slider Content" desc="Manage homepage slider dynamic content.">
        <div className="mb-4">
          <button onClick={handleCreateContent} className="px-4 py-2 bg-primary text-white rounded">Add Content</button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {contents.map((item) => (
            <div key={item.id} className="p-4 border rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                <div className="md:col-span-1">
                  <div className="text-xs text-gray-500">Label</div>
                  <div className="text-sm break-words">{humanizeKey(item.key)}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Key: <span className="font-mono">{item.key}</span></div>
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


