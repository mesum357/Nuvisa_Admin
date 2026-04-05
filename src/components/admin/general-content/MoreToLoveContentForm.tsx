"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { SiteContent } from '@/types';

const MORE_TO_LOVE_TITLE_ONE_KEY = 'more_to_love_title_one';
const MORE_TO_LOVE_TITLE_TWO_KEY = 'more_to_love_title_two';

export default function MoreToLoveContentForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleOne, setTitleOne] = useState('');
  const [titleTwo, setTitleTwo] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMoreToLoveContent();
  }, []);

  const fetchMoreToLoveContent = async () => {
    setLoading(true);
    const response = await apiClient.get<SiteContent[]>('/content');

    if (response.success && Array.isArray(response.data)) {
      const one = response.data.find((item) => item.key === MORE_TO_LOVE_TITLE_ONE_KEY);
      const two = response.data.find((item) => item.key === MORE_TO_LOVE_TITLE_TWO_KEY);

      setTitleOne(one?.value || '');
      setTitleTwo(two?.value || '');

      const updatedTimes = [one?.updatedAt, two?.updatedAt]
        .filter(Boolean)
        .map((value) => new Date(value as Date).getTime());
      setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
    }

    setLoading(false);
  };

  const handleUpdate = async () => {
    setSaving(true);

    const [oneRes, twoRes] = await Promise.all([
      apiClient.post('/content', {
        key: MORE_TO_LOVE_TITLE_ONE_KEY,
        value: titleOne,
        type: 'text',
      }),
      apiClient.post('/content', {
        key: MORE_TO_LOVE_TITLE_TWO_KEY,
        value: titleTwo,
        type: 'text',
      }),
    ]);

    if (oneRes.success && twoRes.success) {
      await fetchMoreToLoveContent();
    } else {
      alert('Failed to update More to Love content');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading More to Love content...</div>
      </div>
    );
  }

  return (
    <ComponentCard title="More to Love">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title One
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={titleOne}
            onChange={(e) => setTitleOne(e.target.value)}
            placeholder="Enter first title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title Two
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={titleTwo}
            onChange={(e) => setTitleTwo(e.target.value)}
            placeholder="Enter second title"
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
