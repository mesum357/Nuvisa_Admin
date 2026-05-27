"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { useContentByKey } from '@/context/GeneralContentContext';

const SUBTITLE_ONE_KEY = 'subtitle_one';
const SUBTITLE_TWO_KEY = 'subtitle_two';

const DEFAULT_SUBTITLE_ONE = '99.3% Visa approval rate';
const DEFAULT_SUBTITLE_TWO = '100% Risk free - Get your visa or full refund';

export default function CheckoutContentForm() {
  const { byKey, rows, loading, refresh } = useContentByKey();
  const [saving, setSaving] = useState(false);
  const [subtitleOne, setSubtitleOne] = useState(DEFAULT_SUBTITLE_ONE);
  const [subtitleTwo, setSubtitleTwo] = useState(DEFAULT_SUBTITLE_TWO);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (loading) return;
    const subtitleOneContent = byKey[SUBTITLE_ONE_KEY];
    const subtitleTwoContent = byKey[SUBTITLE_TWO_KEY];
    setSubtitleOne(subtitleOneContent?.value || DEFAULT_SUBTITLE_ONE);
    setSubtitleTwo(subtitleTwoContent?.value || DEFAULT_SUBTITLE_TWO);
    const updatedTimes = [subtitleOneContent?.updatedAt, subtitleTwoContent?.updatedAt]
      .filter(Boolean)
      .map((date) => new Date(date as Date).getTime());
    setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
  }, [loading, rows]);

  const saveContent = async (key: string, value: string) => {
    const postPayload = { key, value, type: 'text' };
    const response = await apiClient.post('/content', postPayload);
    return response.success;
  };

  const handleUpdate = async () => {
    setSaving(true);

    const results = await Promise.all([
      saveContent(SUBTITLE_ONE_KEY, subtitleOne),
      saveContent(SUBTITLE_TWO_KEY, subtitleTwo),
    ]);

    if (results.every(Boolean)) {
      await refresh({ silent: true });
    } else {
      alert('Failed to update checkout content');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading checkout content...</div>
      </div>
    );
  }

  return (
    <ComponentCard title="Checkout Content">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subtitle One
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={subtitleOne}
            onChange={(e) => setSubtitleOne(e.target.value)}
            placeholder="Enter first subtitle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subtitle Two
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={subtitleTwo}
            onChange={(e) => setSubtitleTwo(e.target.value)}
            placeholder="Enter second subtitle"
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
