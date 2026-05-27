"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { useContentByKey, pickContentValue } from '@/context/GeneralContentContext';

const URGENT_DESCRIPTION_KEY = 'urgent_description';

export default function UrgentContentForm() {
  const { rows, loading, refresh } = useContentByKey();
  const [saving, setSaving] = useState(false);
  const [urgentDescription, setUrgentDescription] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (loading) return;
    const item = rows.find((content) => content.key === URGENT_DESCRIPTION_KEY);
    setUrgentDescription(pickContentValue(rows, URGENT_DESCRIPTION_KEY));
    setLastUpdated(item?.updatedAt ? new Date(item.updatedAt) : null);
  }, [loading, rows]);

  const handleUpdate = async () => {
    setSaving(true);

    const response = await apiClient.post('/content', {
      key: URGENT_DESCRIPTION_KEY,
      value: urgentDescription,
      type: 'text',
    });

    if (response.success) {
      await refresh({ silent: true });
    } else {
      alert('Failed to update urgent description');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading urgent content...</div>
      </div>
    );
  }

  return (
    <ComponentCard title="Urgent Content">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Urgent Description
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={urgentDescription}
            onChange={(e) => setUrgentDescription(e.target.value)}
            placeholder="Enter urgent description"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? 'Updating...' : 'Update'}
          </Button>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </ComponentCard>
  );
}
