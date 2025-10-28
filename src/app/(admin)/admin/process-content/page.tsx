"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { ProcessContent } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';

export default function ProcessContentPage() {
  const [contents, setContents] = useState<ProcessContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [editingActive, setEditingActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const response = await apiClient.get<ProcessContent[]>('/process-content');
    if (response.success && response.data) {
      setContents(response.data);
      const values: Record<string, string> = {};
      const active: Record<string, boolean> = {};
      
      response.data.forEach((content) => {
        values[content.key] = content.value;
        active[content.key] = content.isActive;
      });
      
      setEditingValues(values);
      setEditingActive(active);
    }
    setLoading(false);
  };

  const handleUpdateContent = async (key: string) => {
    const content = contents.find(c => c.key === key);
    if (!content) return;

    setSaving(true);
    const response = await apiClient.patch('/process-content', {
      key,
      value: editingValues[key],
      type: content.type,
      section: content.section,
      order: content.order,
      isActive: editingActive[key],
    });

    if (response.success) {
      await fetchContents();
    }
    setSaving(false);
  };

  const handleCreateDefaultContent = async () => {
    if (!confirm('This will create default Process content. Continue?')) return;

    setSaving(true);
    
    const defaultContents = [
      { key: 'process_heading', value: "We're process driven\nBuckle up", type: 'text', section: 'heading', order: 1 },
      { key: 'process_description', value: 'Benefit from document pre-checks, error-proof form filling, and personalized visa guidance, powered by AI with human oversight at critical checkpoints - all designed to prevent delays, mistakes, and rejections.', type: 'text', section: 'description', order: 2 },
      { key: 'step1_title', value: 'Checkout', type: 'text', section: 'step_title', order: 3 },
      { key: 'step1_description', value: 'Confirm the required documents and checkout to lay the foundation. Upload documents and complete your details for a tailored solution that prioritises your experience.', type: 'text', section: 'step_description', order: 4 },
      { key: 'step2_title', value: 'Build', type: 'text', section: 'step_title', order: 5 },
      { key: 'step2_description', value: 'Experienced professionals who know exactly what is needed and how to get it done right - review and create a complete application, allowing our customers to benefit from 99.6% approval rate.', type: 'text', section: 'step_description', order: 6 },
      { key: 'step3_title', value: 'Submit', type: 'text', section: 'step_title', order: 7 },
      { key: 'step3_description', value: 'NUvisa books your express appointment. Visit your appointment to submit all gathered documents. We will be with you every step of the way, providing ongoing support to maximise your success.', type: 'text', section: 'step_description', order: 8 },
      { key: 'step4_title', value: 'Approved', type: 'text', section: 'step_title', order: 9 },
      { key: 'step4_description', value: 'Once approved, you are eligible to travel.', type: 'text', section: 'step_description', order: 10 },
    ];

    try {
      for (const content of defaultContents) {
        await apiClient.post('/process-content', {
          ...content,
          isActive: true,
        });
      }
      await fetchContents();
      alert('Default content created successfully!');
    } catch {
      alert('Failed to create content');
    }
    
    setSaving(false);
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    setSaving(true);
    const response = await apiClient.delete(`/process-content?id=${id}`);

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

  if (contents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Process Content Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage the &quot;We&apos;re process driven&quot; section content
            </p>
          </div>
        </div>

        <ComponentCard title="No Content Yet">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              No process content has been set up yet. Click the button below to create default content.
            </p>
            <button
              onClick={handleCreateDefaultContent}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Creating...' : 'Create Default Content'}
            </button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  const headingContents = contents.filter(c => c.section === 'heading');
  const descriptionContents = contents.filter(c => c.section === 'description');
  const steps = contents.filter(c => c.section.startsWith('step_')).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Process Content Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage the &quot;We&apos;re process driven&quot; section content
          </p>
        </div>
      </div>

      {/* Heading Section */}
      {headingContents.length > 0 && (
        <ComponentCard title="Main Heading">
          {headingContents.map((content) => (
            <div key={content.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {content.key}
                </label>
                <textarea
                  value={editingValues[content.key] || content.value}
                  onChange={(e) => setEditingValues(prev => ({ ...prev, [content.key]: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`active-${content.id}`}
                    checked={editingActive[content.key] !== undefined ? editingActive[content.key] : content.isActive}
                    onChange={(e) => setEditingActive(prev => ({ ...prev, [content.key]: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`active-${content.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateContent(content.key)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleDeleteContent(content.id)}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </ComponentCard>
      )}

      {/* Description Section */}
      {descriptionContents.length > 0 && (
        <ComponentCard title="Description">
          {descriptionContents.map((content) => (
            <div key={content.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {content.key}
                </label>
                <textarea
                  value={editingValues[content.key] || content.value}
                  onChange={(e) => setEditingValues(prev => ({ ...prev, [content.key]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`active-${content.id}`}
                    checked={editingActive[content.key] !== undefined ? editingActive[content.key] : content.isActive}
                    onChange={(e) => setEditingActive(prev => ({ ...prev, [content.key]: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`active-${content.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateContent(content.key)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleDeleteContent(content.id)}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </ComponentCard>
      )}

      {/* Steps Section */}
      <ComponentCard title="Process Steps">
        <div className="space-y-4">
          {steps.map((content) => {
            const stepNumber = Math.floor((content.order - 3) / 2) + 1;
            const isTitle = content.section === 'step_title';
            
            return (
              <div key={content.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {stepNumber}
                  </span>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {content.key} ({isTitle ? 'Title' : 'Description'})
                    </label>
                    <textarea
                      value={editingValues[content.key] || content.value}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, [content.key]: e.target.value }))}
                      rows={isTitle ? 1 : 3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${content.id}`}
                      checked={editingActive[content.key] !== undefined ? editingActive[content.key] : content.isActive}
                      onChange={(e) => setEditingActive(prev => ({ ...prev, [content.key]: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`active-${content.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateContent(content.key)}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ComponentCard>
    </div>
  );
}

