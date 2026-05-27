"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { useGeneralContent, pickContentValue } from '@/context/GeneralContentContext';

const OCCASSION_TITLE_KEY = 'ocassion_title';
const OCCASSION_SUBTITLE_KEY = 'ocassion_subtitle';

export default function OccasionContentForm() {
  const { rows, loading: contentLoading, refresh: refreshSiteContent } = useGeneralContent();
  const [saving, setSaving] = useState(false);
  const [occasionTitle, setOccasionTitle] = useState('');
  const [occasionSubtitle, setOccasionSubtitle] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (contentLoading) return;
    const titleItem = rows.find((content) => content.key === OCCASSION_TITLE_KEY);
    const subtitleItem = rows.find((content) => content.key === OCCASSION_SUBTITLE_KEY);
    setOccasionTitle(pickContentValue(rows, OCCASSION_TITLE_KEY));
    setOccasionSubtitle(pickContentValue(rows, OCCASSION_SUBTITLE_KEY));

    const updatedTimes = [titleItem?.updatedAt, subtitleItem?.updatedAt]
      .filter(Boolean)
      .map((value) => new Date(value as Date).getTime());
    setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
  }, [contentLoading, rows]);

  const handleUpdate = async () => {
    setSaving(true);

    const responses = await Promise.all([
      apiClient.post('/content', {
        key: OCCASSION_TITLE_KEY,
        value: occasionTitle,
        type: 'text',
      }),
      apiClient.post('/content', {
        key: OCCASSION_SUBTITLE_KEY,
        value: occasionSubtitle,
        type: 'text',
      }),
    ]);

    if (responses.every((response) => response.success)) {
      await refreshSiteContent({ silent: true });
    } else {
      alert('Failed to update occasion content');
    }

    setSaving(false);
  };

  if (contentLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading occasion content...</div>
      </div>
    );
  }

  return (
    <ComponentCard title="Occasion Content">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ocassion Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={occasionTitle}
            onChange={(e) => setOccasionTitle(e.target.value)}
            placeholder="Enter ocassion title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ocassion Subtitle
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={occasionSubtitle}
            onChange={(e) => setOccasionSubtitle(e.target.value)}
            placeholder="Enter ocassion subtitle"
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
