"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import ComponentCard from '@/components/common/ComponentCard';

interface Occasion {
  title: string;
  subTitle: string;
  img: string;
  textColor: string;
}

interface OccasionContent {
  id: string;
  title: string;
  description: string;
  occasions: Occasion[];
  isActive: boolean;
}

const DEFAULT_OCCASIONS: Occasion[] = [
  { title: "Best snow right now", subTitle: "LAST-MINUTE SKI HOLIDAYS", img: "/image/occ1.jpeg", textColor: "#2d3436" },
  { title: "April", subTitle: "APRIL SKI HOLIDAYS", img: "/image/occ2.jpeg", textColor: "#ccff00" },
  { title: "Easter", subTitle: "EASTER SKI HOLIDAYS", img: "/image/occ3.jpeg", textColor: "#5d3fd3" },
  { title: "Xmas 26", subTitle: "CHRISTMAS SKI HOLIDAYS", img: "/image/occ4.jpeg", textColor: "#ffffff" },
  { title: "New Year 26", subTitle: "NEW YEAR SKI HOLIDAYS", img: "/image/occ5.jpeg", textColor: "#00a8ff" },
  { title: "Half Term 27", subTitle: "HALF TERM SKI HOLIDAYS", img: "/image/occ6.jpeg", textColor: "#f1c40f" },
];

export default function OccasionContentPage() {
  const [content, setContent] = useState<OccasionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<OccasionContent>('/occasion-content');
      
      if (response.success && response.data) {
        setContent(response.data);
      } else {
        // If API fails or returns no data, initialize with defaults
        setContent({
          id: '',
          title: 'Everyday Steals',
          description: 'Best deals on flights and hotels',
          occasions: DEFAULT_OCCASIONS,
          isActive: true
        });
      }
    } catch (err) {
      console.error("Error fetching occasion content:", err);
      setError("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const response = await apiClient.post('/occasion-content', content);
      if (response.success) {
        alert('Occasion content updated successfully');
        fetchContent();
      } else {
        alert('Failed to update: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleOccasionChange = (index: number, field: keyof Occasion, value: string) => {
    if (!content) return;
    const newOccasions = [...content.occasions];
    newOccasions[index] = { ...newOccasions[index], [field]: value };
    setContent({ ...content, occasions: newOccasions });
  };

  const handleAddOccasion = () => {
    if (!content) return;
    const newOccasion: Occasion = {
      title: "New Occasion",
      subTitle: "SUBTITLE HERE",
      img: "/image/occ1.jpeg",
      textColor: "#ffffff"
    };
    setContent({
      ...content,
      occasions: [...content.occasions, newOccasion]
    });
  };

  const handleDeleteOccasion = (index: number) => {
    if (!content) return;
    if (!confirm('Are you sure you want to delete this occasion?')) return;
    const newOccasions = content.occasions.filter((_, i) => i !== index);
    setContent({ ...content, occasions: newOccasions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-red-500">{error}</div>
        <button 
          onClick={fetchContent}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Occasion Content Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage the "Everyday Steals" occasions section
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddOccasion}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add New Occasion
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <ComponentCard title="Section Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Section Title (Everyday Steals)
            </label>
            <input
              type="text"
              value={content?.title || ''}
              onChange={(e) => setContent(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Section Description
            </label>
            <input
              type="text"
              value={content?.description || ''}
              onChange={(e) => setContent(prev => prev ? { ...prev, description: e.target.value } : null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </ComponentCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content?.occasions && content.occasions.length > 0 ? (
          content.occasions.map((occ, idx) => (
            <ComponentCard 
              key={idx} 
              title={`Box ${idx + 1}`}
            >
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteOccasion(idx)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete Box
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Main Title (White/Bold text)
                  </label>
                  <input
                    type="text"
                    value={occ.title}
                    onChange={(e) => handleOccasionChange(idx, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sub Title (Blue text below box)
                  </label>
                  <input
                    type="text"
                    value={occ.subTitle}
                    onChange={(e) => handleOccasionChange(idx, 'subTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={occ.img}
                    onChange={(e) => handleOccasionChange(idx, 'img', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Inside Text Color (Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={occ.textColor}
                      onChange={(e) => handleOccasionChange(idx, 'textColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <div 
                      className="w-10 h-10 rounded border border-gray-300"
                      style={{ backgroundColor: occ.textColor }}
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Live Preview:</p>
                  <div className="flex flex-col gap-1">
                    <div 
                      className="h-24 rounded-xl flex items-center justify-center p-4 text-center overflow-hidden bg-cover bg-center shadow-inner"
                      style={{ backgroundImage: `url(${occ.img})` }}
                    >
                      <h4 style={{ color: occ.textColor }} className="text-sm font-bold uppercase drop-shadow-md">
                        {occ.title}
                      </h4>
                    </div>
                    <p className="text-[10px] font-bold text-[#4a90e2] uppercase">
                      {occ.subTitle}
                    </p>
                  </div>
                </div>
              </div>
            </ComponentCard>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500">
            No boxes found. Click "Add New Occasion" to start.
          </div>
        )}
      </div>
    </div>
  );
}
