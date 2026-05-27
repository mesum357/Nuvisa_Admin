"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { useContentByKey, pickContentValue } from '@/context/GeneralContentContext';

const MORE_TO_LOVE_TITLE_ONE_KEY = 'more_to_love_title_one';
const MORE_TO_LOVE_TITLE_TWO_KEY = 'more_to_love_title_two';
const MORE_TO_LOVE_LEFT_TITLE_KEY = 'more_to_love_left_title';
const MORE_TO_LOVE_RIGHT_TITLE_KEY = 'more_to_love_right_title';
const MORE_TO_LOVE_LEFT_SUBTITLE_KEY = 'more_to_love_left_subtitle';
const MORE_TO_LOVE_RIGHT_SUBTITLE_KEY = 'more_to_love_right_subtitle';

export default function MoreToLoveContentForm() {
  const { rows, loading, refresh } = useContentByKey();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [leftTitle, setLeftTitle] = useState('');
  const [rightTitle, setRightTitle] = useState('');
  const [leftSubtitle, setLeftSubtitle] = useState('');
  const [rightSubtitle, setRightSubtitle] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (loading) return;
    setTitle(pickContentValue(rows, MORE_TO_LOVE_TITLE_ONE_KEY));
    setLeftTitle(pickContentValue(rows, MORE_TO_LOVE_LEFT_TITLE_KEY));
    setRightTitle(pickContentValue(rows, MORE_TO_LOVE_RIGHT_TITLE_KEY));
    setLeftSubtitle(pickContentValue(rows, MORE_TO_LOVE_LEFT_SUBTITLE_KEY));
    setRightSubtitle(pickContentValue(rows, MORE_TO_LOVE_RIGHT_SUBTITLE_KEY));
    const updatedTimes = [
      MORE_TO_LOVE_TITLE_ONE_KEY,
      MORE_TO_LOVE_LEFT_TITLE_KEY,
      MORE_TO_LOVE_RIGHT_TITLE_KEY,
      MORE_TO_LOVE_LEFT_SUBTITLE_KEY,
      MORE_TO_LOVE_RIGHT_SUBTITLE_KEY,
    ]
      .map((key) => rows.find((row) => row.key === key)?.updatedAt)
      .filter(Boolean)
      .map((value) => new Date(value as Date).getTime());
    setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
  }, [loading, rows]);

  const handleUpdate = async () => {
    setSaving(true);

    const responses = await Promise.all([
      apiClient.patch('/content', {
        key: MORE_TO_LOVE_TITLE_ONE_KEY,
        value: title,
      }),
      apiClient.patch('/content', {
        key: MORE_TO_LOVE_LEFT_TITLE_KEY,
        value: leftTitle,
      }),
      apiClient.patch('/content', {
        key: MORE_TO_LOVE_RIGHT_TITLE_KEY,
        value: rightTitle,
      }),
      apiClient.patch('/content', {
        key: MORE_TO_LOVE_LEFT_SUBTITLE_KEY,
        value: leftSubtitle,
      }),
      apiClient.patch('/content', {
        key: MORE_TO_LOVE_RIGHT_SUBTITLE_KEY,
        value: rightSubtitle,
      }),
    ]);

    if (responses.every((response) => response.success)) {
      await refresh({ silent: true });
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
            Section Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter section title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Left Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={leftTitle}
            onChange={(e) => setLeftTitle(e.target.value)}
            placeholder="Enter left title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Left Subtitle
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={leftSubtitle}
            onChange={(e) => setLeftSubtitle(e.target.value)}
            placeholder="Enter left subtitle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Right Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={rightTitle}
            onChange={(e) => setRightTitle(e.target.value)}
            placeholder="Enter right title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Right Subtitle
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={rightSubtitle}
            onChange={(e) => setRightSubtitle(e.target.value)}
            placeholder="Enter right subtitle"
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
