"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import ComponentCard from '@/components/common/ComponentCard';

interface CountryPricing {
  country: string;
  earlyDiscount: number | string;
  originalPrice: number | string;
  traditionalPrice: number | string;
  isHidden?: boolean;
  hiddenReason?: string;
  priceMode?: 'two' | 'three';
}

interface Occasion {
  title: string;
  subTitle: string;
  img: string;
  textColor: string;
  bgColor: string;
  arrivalDate: string;
  departureDate: string;
  countryPricing: CountryPricing[];
}

interface OccasionContent {
  id: string;
  title: string;
  description: string;
  occasions: Occasion[];
  isActive: boolean;
}

const DEFAULT_OCCASIONS: Occasion[] = [
  { title: "Best snow right now", subTitle: "LAST-MINUTE SKI HOLIDAYS", img: "/image/occ1.jpeg", textColor: "#2d3436", bgColor: "#ffffff", arrivalDate: "", departureDate: "", countryPricing: [] },
  { title: "April", subTitle: "APRIL SKI HOLIDAYS", img: "/image/occ2.jpeg", textColor: "#ccff00", bgColor: "#ffffff", arrivalDate: "", departureDate: "", countryPricing: [] },
  { title: "Easter", subTitle: "EASTER SKI HOLIDAYS", img: "/image/occ3.jpeg", textColor: "#5d3fd3", bgColor: "#ffffff", arrivalDate: "", departureDate: "", countryPricing: [] },
  { title: "Xmas 26", subTitle: "CHRISTMAS SKI HOLIDAYS", img: "/image/occ4.jpeg", textColor: "#ffffff", bgColor: "#ffffff", arrivalDate: "", departureDate: "", countryPricing: [] },
  { title: "New Year 26", subTitle: "NEW YEAR SKI HOLIDAYS", img: "/image/occ5.jpeg", textColor: "#00a8ff", bgColor: "#ffffff", arrivalDate: "", departureDate: "", countryPricing: [] },
  { title: "Half Term 27", subTitle: "HALF TERM SKI HOLIDAYS", img: "/image/occ6.jpeg", textColor: "#f1c40f", bgColor: "#ffffff", arrivalDate: "", departureDate: "", countryPricing: [] },
];

export default function OccasionContentPage() {
  const [content, setContent] = useState<OccasionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCountryInputs, setNewCountryInputs] = useState<Record<number, string>>({});
  const [expandedPricing, setExpandedPricing] = useState<Record<number, boolean>>({});

  const normalizeCountryPricing = (pricing?: CountryPricing[]): CountryPricing[] => {
    return (pricing || []).map((item) => ({
      ...item,
      earlyDiscount: item.earlyDiscount ?? '',
      originalPrice: item.originalPrice ?? '',
      traditionalPrice: item.traditionalPrice ?? '',
      isHidden: item.isHidden ?? false,
      hiddenReason: item.hiddenReason ?? '',
      priceMode: item.priceMode ?? 'three',
    }));
  };

  const normalizeOccasions = (occasions?: Occasion[]): Occasion[] => {
    return (occasions || []).map((occ) => ({
      ...occ,
      arrivalDate: occ.arrivalDate || '',
      departureDate: occ.departureDate || '',
      countryPricing: normalizeCountryPricing(occ.countryPricing),
    }));
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<OccasionContent>('/occasion-content');
      
      if (response.success && response.data) {
        setContent({
          ...response.data,
          occasions: normalizeOccasions(response.data.occasions),
        });
      } else {
        // If API fails or returns no data, initialize with defaults
        setContent({
          id: '',
          title: 'Everyday Steals',
          description: 'Best deals on flights and hotels',
          occasions: normalizeOccasions(DEFAULT_OCCASIONS),
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

  const handleCountryPricingChange = (
    occIndex: number,
    country: string,
    field: keyof CountryPricing,
    value: string | boolean
  ) => {
    if (!content) return;
    const newOccasions = [...content.occasions];
    const occ = { ...newOccasions[occIndex] };
    const pricing = [...(occ.countryPricing || [])];
    const existingIdx = pricing.findIndex(p => p.country.toLowerCase() === country.toLowerCase());
    if (existingIdx >= 0) {
      pricing[existingIdx] = { ...pricing[existingIdx], [field]: value };
    } else {
      pricing.push({
        country,
        earlyDiscount: '',
        originalPrice: '',
        traditionalPrice: '',
        isHidden: false,
        hiddenReason: '',
        priceMode: 'three',
        [field]: value
      });
    }
    occ.countryPricing = pricing;
    newOccasions[occIndex] = occ;
    setContent({ ...content, occasions: newOccasions });
  };

  const handleAddCountryToOccasion = (occIndex: number) => {
    if (!content) return;

    const country = (newCountryInputs[occIndex] || '').trim();
    if (!country) return;

    const newOccasions = [...content.occasions];
    const occ = { ...newOccasions[occIndex] };
    const pricing = [...(occ.countryPricing || [])];

    const alreadyExists = pricing.some(
      (item) => item.country.trim().toLowerCase() === country.toLowerCase()
    );

    if (alreadyExists) {
      alert('Country already exists for this occasion');
      return;
    }

    pricing.push({
      country,
      earlyDiscount: '',
      originalPrice: '',
      traditionalPrice: '',
      isHidden: false,
      hiddenReason: '',
      priceMode: 'three',
    });

    occ.countryPricing = pricing;
    newOccasions[occIndex] = occ;
    setContent({ ...content, occasions: newOccasions });
    setNewCountryInputs((prev) => ({ ...prev, [occIndex]: '' }));
  };

  const handleRemoveCountryFromOccasion = (occIndex: number, country: string) => {
    if (!content) return;

    const newOccasions = [...content.occasions];
    const occ = { ...newOccasions[occIndex] };
    occ.countryPricing = (occ.countryPricing || []).filter(
      (item) => item.country.toLowerCase() !== country.toLowerCase()
    );
    newOccasions[occIndex] = occ;
    setContent({ ...content, occasions: newOccasions });
  };

  const handleAddOccasion = () => {
    if (!content) return;
    const newOccasion: Occasion = {
      title: "New Occasion",
      subTitle: "SUBTITLE HERE",
      img: "/image/occ1.jpeg",
      textColor: "#ffffff",
      bgColor: "#ffffff",
      arrivalDate: "",
      departureDate: "",
      countryPricing: []
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Background Color (Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={occ.bgColor}
                      onChange={(e) => handleOccasionChange(idx, 'bgColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <div
                      className="w-10 h-10 rounded border border-gray-300"
                      style={{ backgroundColor: occ.bgColor }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Arrival Date
                    </label>
                    <input
                      type="date"
                      value={occ.arrivalDate || ''}
                      onChange={(e) => handleOccasionChange(idx, 'arrivalDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={occ.departureDate || ''}
                      onChange={(e) => handleOccasionChange(idx, 'departureDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Country Pricing */}
                <div className="mt-4 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedPricing(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <span>Country Pricing ({(occ.countryPricing || []).length} countries)</span>
                    <span>{expandedPricing[idx] ? '▲' : '▼'}</span>
                  </button>
                  {expandedPricing[idx] && (
                    <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add country name"
                          value={newCountryInputs[idx] || ''}
                          onChange={(e) => setNewCountryInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCountryToOccasion(idx)}
                          className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
                        >
                          Add
                        </button>
                      </div>

                      {(occ.countryPricing || []).length > 0 ? (
                        (occ.countryPricing || []).map((cp) => {
                        return (
                          <div key={cp.country} className="space-y-2 border border-gray-200 dark:border-gray-600 rounded p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {cp.country}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCountryPricingChange(idx, cp.country, 'isHidden', !(cp.isHidden ?? false))}
                                  className="px-2 py-1 text-[11px] rounded bg-gray-600 hover:bg-gray-700 text-white"
                                >
                                  {cp.isHidden ? 'Show' : 'Hide'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCountryFromOccasion(idx, cp.country)}
                                  className="px-2 py-1 text-[11px] rounded bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                              <label className="text-[11px] text-gray-600 dark:text-gray-400">Pricing Mode</label>
                              <select
                                value={cp.priceMode || 'three'}
                                onChange={(e) => handleCountryPricingChange(idx, cp.country, 'priceMode', e.target.value as 'two' | 'three')}
                                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                <option value="two">2 Prices</option>
                                <option value="three">3 Prices</option>
                              </select>
                            </div>

                            {cp.isHidden && (
                              <input
                                type="text"
                                placeholder="Hidden reason"
                                value={cp.hiddenReason || ''}
                                onChange={(e) => handleCountryPricingChange(idx, cp.country, 'hiddenReason', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            )}

                            <div className={`grid ${cp.priceMode === 'two' ? 'grid-cols-2' : 'grid-cols-3'} gap-2 items-center`}>
                            <input
                              type="number"
                              placeholder="Early £"
                              value={cp?.earlyDiscount || ''}
                              onChange={(e) => handleCountryPricingChange(idx, cp.country, 'earlyDiscount', e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <input
                              type="number"
                              placeholder="Original £"
                              value={cp?.originalPrice || ''}
                              onChange={(e) => handleCountryPricingChange(idx, cp.country, 'originalPrice', e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            {cp.priceMode !== 'two' && (
                              <input
                                type="number"
                                placeholder="Traditional £"
                                value={cp?.traditionalPrice || ''}
                                onChange={(e) => handleCountryPricingChange(idx, cp.country, 'traditionalPrice', e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            )}
                            </div>
                          </div>
                        );
                        })
                      ) : (
                        <p className="text-xs text-gray-500">No countries added yet.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Live Preview:</p>
                  <div className="flex flex-col gap-1">
                    <div
                      className="h-24 rounded-xl flex items-center justify-center p-4 text-center overflow-hidden bg-cover bg-center shadow-inner"
                      style={{ backgroundColor: occ.bgColor }}
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