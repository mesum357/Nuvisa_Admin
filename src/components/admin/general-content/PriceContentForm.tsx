"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { SiteContent } from '@/types';

const PRICE_SUBTITLE_ONE_KEY = 'price_subtitle_one';
const PRICE_SUBTITLE_TWO_KEY = 'price_subtitle_two';
const PRICE_SUBTITLE_THREE_KEY = 'price_subtitle_three';

const DEFAULT_PRICE_SUBTITLE_ONE = 'You save';
const DEFAULT_PRICE_SUBTITLE_TWO = 'Traditional fee';
const DEFAULT_PRICE_SUBTITLE_THREE = 'Traditional';

type ContentMap = Record<string, SiteContent>;

export default function PriceContentForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subtitleOne, setSubtitleOne] = useState(DEFAULT_PRICE_SUBTITLE_ONE);
  const [subtitleTwo, setSubtitleTwo] = useState(DEFAULT_PRICE_SUBTITLE_TWO);
  const [subtitleThree, setSubtitleThree] = useState(DEFAULT_PRICE_SUBTITLE_THREE);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchPriceContent();
  }, []);

  const fetchPriceContent = async () => {
    setLoading(true);

    const responsew= await apiClient.get('/public/slider-content')
    console.log("Slider content:", responsew.data);
    const response = await apiClient.get<SiteContent[]>('/content');

    if (response.success && Array.isArray(response.data)) {
      const byKey = response.data.reduce((acc: ContentMap, item) => {
        acc[item.key] = item;
        return acc;
      }, {});

      const subtitleOneContent = byKey[PRICE_SUBTITLE_ONE_KEY];
      const subtitleTwoContent = byKey[PRICE_SUBTITLE_TWO_KEY];
      const subtitleThreeContent = byKey[PRICE_SUBTITLE_THREE_KEY];

      setSubtitleOne(subtitleOneContent?.value || DEFAULT_PRICE_SUBTITLE_ONE);
      setSubtitleTwo(subtitleTwoContent?.value || DEFAULT_PRICE_SUBTITLE_TWO);
      setSubtitleThree(subtitleThreeContent?.value || DEFAULT_PRICE_SUBTITLE_THREE);

      const updatedTimes = [
        subtitleOneContent?.updatedAt,
        subtitleTwoContent?.updatedAt,
        subtitleThreeContent?.updatedAt,
      ]
        .filter(Boolean)
        .map((date) => new Date(date as Date).getTime());

      setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
    } else {
      setSubtitleOne(DEFAULT_PRICE_SUBTITLE_ONE);
      setSubtitleTwo(DEFAULT_PRICE_SUBTITLE_TWO);
      setSubtitleThree(DEFAULT_PRICE_SUBTITLE_THREE);
      setLastUpdated(null);
    }

    setLoading(false);
  };

  const saveContent = async (key: string, value: string) => {
    const postPayload = { key, value, type: 'text' };
    const response = await apiClient.post('/content', postPayload);
    return response.success;
  };

  const handleUpdate = async () => {
    setSaving(true);

    const results = await Promise.all([
      saveContent(PRICE_SUBTITLE_ONE_KEY, subtitleOne),
      saveContent(PRICE_SUBTITLE_TWO_KEY, subtitleTwo),
      saveContent(PRICE_SUBTITLE_THREE_KEY, subtitleThree),
    ]);

    if (results.every(Boolean)) {
      await fetchPriceContent();
    } else {
      alert('Failed to update price content');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading price content...</div>
      </div>
    );
  }

  return (
    <ComponentCard title="Price Content">
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
            placeholder="Enter first price subtitle"
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
            placeholder="Enter second price subtitle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subtitle Three
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={subtitleThree}
            onChange={(e) => setSubtitleThree(e.target.value)}
            placeholder="Enter third price subtitle"
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
