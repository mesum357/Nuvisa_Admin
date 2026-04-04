"use client";

import React, { useEffect, useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { apiClient } from '@/lib/api-client';
import { SiteContent } from '@/types';

const CONTACT_FIELDS = [
  { label: 'Contact Reduce', baseKey: 'contact_reduce' },
  { label: 'Contact Touch', baseKey: 'contact_touch' },
  { label: 'Contact Reporting', baseKey: 'contact_reporting' },
  { label: 'Contact Mind', baseKey: 'contact_mind' },
];

type FormState = Record<string, { title: string; description: string }>;

const createDefaultState = (): FormState => {
  return CONTACT_FIELDS.reduce((acc, field) => {
    acc[field.baseKey] = { title: '', description: '' };
    return acc;
  }, {} as FormState);
};

export default function ContactContentForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<FormState>(createDefaultState());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchContactContent();
  }, []);

  const fetchContactContent = async () => {
    setLoading(true);
    const response = await apiClient.get<SiteContent[]>('/content');

    if (response.success && Array.isArray(response.data)) {
      const byKey = response.data.reduce((acc: Record<string, SiteContent>, item) => {
        acc[item.key] = item;
        return acc;
      }, {});

      const nextState = createDefaultState();
      const updatedTimes: number[] = [];

      CONTACT_FIELDS.forEach((field) => {
        const titleKey = `${field.baseKey}_title`;
        const descriptionKey = `${field.baseKey}_description`;

        nextState[field.baseKey] = {
          title: byKey[titleKey]?.value || '',
          description: byKey[descriptionKey]?.value || '',
        };

        if (byKey[titleKey]?.updatedAt) updatedTimes.push(new Date(byKey[titleKey].updatedAt).getTime());
        if (byKey[descriptionKey]?.updatedAt) updatedTimes.push(new Date(byKey[descriptionKey].updatedAt).getTime());
      });

      setFormState(nextState);
      setLastUpdated(updatedTimes.length ? new Date(Math.max(...updatedTimes)) : null);
    }

    setLoading(false);
  };

  const handleUpdate = async () => {
    setSaving(true);

    const requests = CONTACT_FIELDS.flatMap((field) => {
      const titleKey = `${field.baseKey}_title`;
      const descriptionKey = `${field.baseKey}_description`;
      const values = formState[field.baseKey];

      return [
        apiClient.post('/content', {
          key: titleKey,
          value: values.title,
          type: 'contact',
        }),
        apiClient.post('/content', {
          key: descriptionKey,
          value: values.description,
          type: 'contact',
        }),
      ];
    });

    const results = await Promise.all(requests);

    if (results.every((result) => result.success)) {
      await fetchContactContent();
    } else {
      alert('Failed to update contact content');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading contact content...</div>
      </div>
    );
  }

  return (
    <ComponentCard title="Contact Content">
      <div className="space-y-5">
        {CONTACT_FIELDS.map((field) => (
          <div key={field.baseKey} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label} Title
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                value={formState[field.baseKey]?.title || ''}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    [field.baseKey]: {
                      ...prev[field.baseKey],
                      title: e.target.value,
                    },
                  }))
                }
                placeholder={`Enter ${field.label.toLowerCase()} title`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label} Description
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                value={formState[field.baseKey]?.description || ''}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    [field.baseKey]: {
                      ...prev[field.baseKey],
                      description: e.target.value,
                    },
                  }))
                }
                placeholder={`Enter ${field.label.toLowerCase()} description`}
              />
            </div>
          </div>
        ))}

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
