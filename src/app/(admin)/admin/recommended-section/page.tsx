"use client";

import React, { useEffect, useState } from 'react';
import { Edit2, Loader2, Plus, Save, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { RecommendedSection, RecommendedSectionCard, CreateRecommendedSectionData } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

export default function RecommendedSectionPage() {
  const [section, setSection] = useState<RecommendedSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateRecommendedSectionData>({
    title: 'Recommended for you',
    description: '',
    cards: [],
    isActive: true,
  });

  const fetchSection = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<RecommendedSection>('/recommended-section');
      if (response.success && response.data) {
        setSection(response.data);
        setFormData({
          title: response.data.title,
          description: response.data.description || '',
          cards: response.data.cards || [],
          isActive: response.data.isActive,
        });
      }
    } catch (error) {
      console.error('Error fetching recommended section:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSection();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post<RecommendedSection>('/recommended-section', formData);
      if (response.success && response.data) {
        setSection(response.data);
        setShowModal(false);
        alert('Recommended section saved successfully!');
      } else {
        alert(response.error || 'Failed to save recommended section');
      }
    } catch (error: any) {
      console.error('Error saving recommended section:', error);
      alert('Error saving recommended section');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!section) return;
    setSaving(true);
    try {
      const response = await apiClient.patch<RecommendedSection>(`/recommended-section?id=${section.id}&action=toggle`);
      if (response.success && response.data) {
        setSection(response.data);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCard = () => {
    setFormData(prev => ({
      ...prev,
      cards: [...prev.cards, { title: '', description: '', image: '', price: '', strikeOutPrice: '' }]
    }));
  };

  const removeCard = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index)
    }));
  };

  const updateCard = (index: number, field: keyof RecommendedSectionCard, value: string) => {
    setFormData(prev => {
      const newCards = [...prev.cards];
      newCards[index] = { ...newCards[index], [field]: value };
      return { ...prev, cards: newCards };
    });
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      // Reusing country image upload for now as it's a generic image uploader
      uploadFormData.append('category', 'recommended');

      const res = await apiClient.post<{ imagePath: string }>("/upload-country-image", uploadFormData);

      if (res?.success && res.data) {
        updateCard(index, 'image', res.data.imagePath);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended Section</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage the "Recommended for you" section cards and content.
          </p>
        </div>
        <div className="flex gap-2">
          {section && (
            <Button
              onClick={handleToggleActive}
              disabled={saving}
              variant={section.isActive ? "outline" : "primary"}
              size="sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : section.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {section.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          <Button onClick={() => setShowModal(true)} size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Section
          </Button>
        </div>
      </div>

      {section ? (
        <div className="grid grid-cols-1 gap-6">
          <ComponentCard title="Section Overview" desc="Main heading and description">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</p>
              </div>
              {section.description && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                  <p className="text-gray-600 dark:text-gray-300">{section.description}</p>
                </div>
              )}
            </div>
          </ComponentCard>

          <ComponentCard title="Cards List" desc={`${section.cards?.length || 0} cards configured`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.cards?.map((card, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                  {card.image && (
                    <div className="h-40 w-full relative">
                      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                        {card.price && <span className="text-brand-600 font-bold">{card.price}</span>}
                        {card.strikeOutPrice && <span className="text-gray-400 line-through text-xs font-medium">{card.strikeOutPrice}</span>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ComponentCard>
        </div>
      ) : (
        <ComponentCard title="No Configuration Found">
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4 text-lg font-medium">No recommended section configured yet.</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> Create Section
            </Button>
          </div>
        </ComponentCard>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-5xl">
        <div className="space-y-6 p-6">
          <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700">
            <h2 className="text-xl font-bold">Edit Recommended Section</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
              <Trash2 className="h-5 w-5 rotate-45" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Recommended for you"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Section Description (Optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Recommended Cards</h3>
              <Button onClick={addCard} size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Add Card
              </Button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {formData.cards.map((card, idx) => (
                <div key={idx} className="p-5 border rounded-xl dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 relative group">
                  <button
                    onClick={() => removeCard(idx)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 bg-red-50 dark:bg-red-900/20 rounded-full transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-3 font-medium">
                      <label className="text-xs uppercase text-gray-500 tracking-wider">Card Image</label>
                      <div className="relative h-32 w-full bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center overflow-hidden">
                        {card.image ? (
                          <>
                            <img src={card.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer bg-white text-gray-900 px-3 py-1 text-xs rounded-full font-bold">
                                Change Image
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0])} />
                              </label>
                            </div>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2 p-4 text-center">
                            <Upload className="h-6 w-6 text-gray-400" />
                            <span className="text-xs text-gray-500">Upload Image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(idx, e.target.files[0])} />
                          </label>
                        )}
                      </div>
                      <input
                        type="text"
                        value={card.image}
                        onChange={(e) => updateCard(idx, 'image', e.target.value)}
                        placeholder="Or enter image URL"
                        className="w-full text-xs px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700"
                      />

                    </div>

                    <div className="md:col-span-8 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase text-gray-500 tracking-wider">Card Title</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateCard(idx, 'title', e.target.value)}
                          placeholder="e.g., Fast Processing"
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium uppercase text-gray-500 tracking-wider">Price</label>
                          <input
                            type="text"
                            value={card.price || ''}
                            onChange={(e) => updateCard(idx, 'price', e.target.value)}
                            placeholder="e.g., £129"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium uppercase text-gray-500 tracking-wider">Strikeout Price</label>
                          <input
                            type="text"
                            value={card.strikeOutPrice || ''}
                            onChange={(e) => updateCard(idx, 'strikeOutPrice', e.target.value)}
                            placeholder="e.g., £150"
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase text-gray-500 tracking-wider">Card Description</label>
                        <textarea
                          value={card.description}
                          onChange={(e) => updateCard(idx, 'description', e.target.value)}
                          placeholder="Short description..."
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {formData.cards.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="text-gray-500 mb-2">No cards added yet.</p>
                  <Button onClick={addCard} size="sm" variant="outline">
                    Add First Card
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
            <Button onClick={() => setShowModal(false)} variant="outline">Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
