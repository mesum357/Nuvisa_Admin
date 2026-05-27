"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { useContentByKey } from '@/context/GeneralContentContext';

const VISA_SOLUTION_TITLE_KEY = 'visasolution_title';
const VISA_SOLUTION_SUBTITLE_KEY = 'visasolution_subtitle';
const VISA_SOLUTION_EVERYDAY_COUNTRIES_KEY = 'visasolution_everyday_countries';

const DEFAULT_VISA_SOLUTION_TITLE = 'Everyday Steals';
const DEFAULT_VISA_SOLUTION_SUBTITLE =
  "A curated edit of handpicked countries for travellers who are on budget and want to access Schengen countries.";

type EverydayStealsCountry = {
  name: string;
  bgColor: string;
  isHidden: boolean;
};

const DEFAULT_EVERYDAY_STEALS_COUNTRIES: EverydayStealsCountry[] = [
  { name: 'Lithuania', bgColor: '#5f9aff', isHidden: false },
  { name: 'Greece', bgColor: '#ff8e59', isHidden: false },
  { name: 'Malta', bgColor: '#daee69', isHidden: false },
  { name: 'Latvia', bgColor: '#fdfd55', isHidden: false },
  { name: 'Luxembourg', bgColor: '#ffb1ee', isHidden: false },
];

export default function VisaSolutionContentForm() {
  const { byKey, rows, loading, refresh } = useContentByKey();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(DEFAULT_VISA_SOLUTION_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_VISA_SOLUTION_SUBTITLE);
  const [countries, setCountries] = useState<EverydayStealsCountry[]>(DEFAULT_EVERYDAY_STEALS_COUNTRIES);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (loading) return;
    const titleContent = byKey[VISA_SOLUTION_TITLE_KEY];
    const subtitleContent = byKey[VISA_SOLUTION_SUBTITLE_KEY];
    const countriesContent = byKey[VISA_SOLUTION_EVERYDAY_COUNTRIES_KEY];
    setTitle(titleContent?.value || DEFAULT_VISA_SOLUTION_TITLE);
    setSubtitle(subtitleContent?.value || DEFAULT_VISA_SOLUTION_SUBTITLE);
    let parsedCountries: EverydayStealsCountry[] = [];
    if (countriesContent?.value) {
      try {
        const parsed = JSON.parse(countriesContent.value);
        if (Array.isArray(parsed)) {
          parsedCountries = parsed
            .map((item) => ({
              name: String(item?.name || '').trim(),
              bgColor: String(item?.bgColor || '').trim() || '#5f9aff',
              isHidden: Boolean(item?.isHidden),
            }))
            .filter((item) => item.name);
        }
      } catch {
        // Keep defaults if JSON is malformed.
      }
    }
    setCountries(
      parsedCountries.length > 0 ? parsedCountries : DEFAULT_EVERYDAY_STEALS_COUNTRIES,
    );
    const updatedTimes = [titleContent?.updatedAt, subtitleContent?.updatedAt, countriesContent?.updatedAt]
      .filter(Boolean)
      .map((date) => new Date(date as Date).getTime());
    setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
  }, [loading, rows]);

  const saveContent = async (key: string, value: string) => {
    const response = await apiClient.post('/content', { key, value, type: 'text' });
    return response.success;
  };

  const handleUpdate = async () => {
    setSaving(true);

    const results = await Promise.all([
      saveContent(VISA_SOLUTION_TITLE_KEY, title),
      saveContent(VISA_SOLUTION_SUBTITLE_KEY, subtitle),
      saveContent(VISA_SOLUTION_EVERYDAY_COUNTRIES_KEY, JSON.stringify(countries)),
    ]);

    if (results.every(Boolean)) {
      await refresh({ silent: true });
    } else {
      alert('Failed to update visa solution content');
    }

    setSaving(false);
  };

  const updateCountry = (index: number, patch: Partial<EverydayStealsCountry>) => {
    setCountries((prev) =>
      prev.map((country, i) => (i === index ? { ...country, ...patch } : country))
    );
  };

  const addCountry = () => {
    setCountries((prev) => [
      ...prev,
      { name: '', bgColor: '#5f9aff', isHidden: false },
    ]);
  };

  const removeCountry = (index: number) => {
    setCountries((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading visa solution content...
        </div>
      </div>
    );
  }

  return (
    <ComponentCard title="Visa Solution Content">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Visa Solution Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter visa solution title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Visa Solution Subtitle
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Enter visa solution subtitle"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Everyday Steals Countries
            </label>
            <Button onClick={addCountry} disabled={saving}>
              Add Country
            </Button>
          </div>

          {countries.map((country, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto_auto] gap-2 items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                value={country.name}
                onChange={(e) => updateCountry(index, { name: e.target.value })}
                placeholder="Country name"
              />

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  value={country.bgColor}
                  onChange={(e) => updateCountry(index, { bgColor: e.target.value })}
                  placeholder="#5f9aff"
                />
                <div
                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-700"
                  style={{ backgroundColor: country.bgColor || '#5f9aff' }}
                />
              </div>

              <button
                type="button"
                onClick={() => updateCountry(index, { isHidden: !country.isHidden })}
                className={`px-3 py-2 text-xs rounded-lg font-medium ${country.isHidden
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  }`}
              >
                {country.isHidden ? 'Hidden' : 'Visible'}
              </button>

              <button
                type="button"
                onClick={() => removeCountry(index)}
                className="px-3 py-2 text-xs rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Remove
              </button>
            </div>
          ))}
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