"use client";

import React, { useEffect, useState } from 'react';
import { Edit2, Eye, EyeOff, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ExpertSectionType, CreateExpertSectionData } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

export default function ExpertSectionPage() {
  const [expertSections, setExpertSections] = useState<ExpertSectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ExpertSectionType | null>(null);
  const [formData, setFormData] = useState<CreateExpertSectionData>({
    titleLine1: 'Unlock Your Visa Success with',
    titleLine2: 'Unlimited Access to a',
    titleLine3: 'Accountability Expert',
    originalPrice: '£35/ Month',
    offerPrice: 'Free',
    offerDescription: 'with next 100 visa applications!',
    expertImage: '/image/expert.png',
    defaultSpotsLeft: 12,
    isActive: true,
  });

  useEffect(() => {
    fetchExpertSections();
  }, []);

  const fetchExpertSections = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<ExpertSectionType[]>('/expert-section?path=all');
      if (response.success && response.data) {
        setExpertSections(response.data);
      }
    } catch (error) {
      console.error('Error fetching expert sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post<ExpertSectionType>('/expert-section', formData);
      if (response.success && response.data) {
        setShowModal(false);
        resetForm();
        await fetchExpertSections();
      }
    } catch (error) {
      console.error('Error creating expert section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSection) return;

    setSaving(true);
    try {
      const response = await apiClient.patch<ExpertSectionType>(
        `/expert-section?id=${editingSection.id}`,
        formData
      );
      if (response.success && response.data) {
        setShowModal(false);
        setEditingSection(null);
        resetForm();
        await fetchExpertSections();
      }
    } catch (error) {
      console.error('Error updating expert section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setSaving(true);
    try {
      const response = await apiClient.patch<ExpertSectionType>(
        `/expert-section?id=${id}&action=toggle`
      );
      if (response.success && response.data) {
        await fetchExpertSections();
      }
    } catch (error) {
      console.error('Error toggling expert section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expert section?')) return;

    setSaving(true);
    try {
      const response = await apiClient.delete(`/expert-section?id=${id}`);
      if (response.success) {
        await fetchExpertSections();
      }
    } catch (error) {
      console.error('Error deleting expert section:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titleLine1: 'Unlock Your Visa Success with',
      titleLine2: 'Unlimited Access to a',
      titleLine3: 'Accountability Expert',
      originalPrice: '£35/ Month',
      offerPrice: 'Free',
      offerDescription: 'with next 100 visa applications!',
      expertImage: '/image/expert.png',
      defaultSpotsLeft: 12,
      isActive: true,
    });
  };

  const openEditModal = (section: ExpertSectionType) => {
    setEditingSection(section);
    setFormData({
      titleLine1: section.titleLine1,
      titleLine2: section.titleLine2,
      titleLine3: section.titleLine3,
      originalPrice: section.originalPrice,
      offerPrice: section.offerPrice,
      offerDescription: section.offerDescription,
      expertImage: section.expertImage,
      defaultSpotsLeft: section.defaultSpotsLeft,
      isActive: section.isActive,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingSection(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expert Section Management</h1>
        <Button onClick={openCreateModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      <ComponentCard title="All Expert Sections" desc="Manage the expert accountability coach section shown during checkout">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Pricing</th>
                <th className="px-6 py-3 font-semibold">Spots</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Last Updated</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expertSections.map((section) => (
                <tr key={section.id} className="bg-white hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="max-w-xs truncate">
                      {section.titleLine1} {section.titleLine2} {section.titleLine3}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="line-through text-gray-400 mr-2">{section.originalPrice}</span>
                    <span className="font-semibold text-green-600">{section.offerPrice}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {section.defaultSpotsLeft}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${section.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {section.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {section.updatedAt ? new Date(section.updatedAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleToggleActive(section.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 px-0"
                        title={section.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {section.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={() => openEditModal(section)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 px-0"
                        title="Edit"
                      >
                        <Edit2 color='black' className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(section.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 px-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {expertSections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                    No expert sections found. Click &quot;Create New&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ComponentCard>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="max-w-3xl p-8"
      >
        <div className="space-y-8 max-h-[calc(100vh-10rem)] overflow-y-auto overflow-x-hidden">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingSection ? 'Edit Expert Section' : 'Create Expert Section'}
          </h2>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Section Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">Control whether the expert section is visible during checkout</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${formData.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`}></div>
                </div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* Title Lines */}
          <div className="space-y-4 p-6 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full shadow-sm"></div>
              <h3 className="text-lg font-semibold text-gray-900">Title Lines</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">The title is displayed across three lines in the expert section</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Line 1</label>
                <input
                  type="text"
                  value={formData.titleLine1}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleLine1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="e.g. Unlock Your Visa Success with"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Line 2</label>
                <input
                  type="text"
                  value={formData.titleLine2}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleLine2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="e.g. Unlimited Access to a"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Line 3</label>
                <input
                  type="text"
                  value={formData.titleLine3}
                  onChange={(e) => setFormData(prev => ({ ...prev, titleLine3: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="e.g. Accountability Expert"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4 p-6 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
              <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Original Price (struck-through)</label>
                <input
                  type="text"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. £35/ Month"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Offer Price</label>
                <input
                  type="text"
                  value={formData.offerPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, offerPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. Free"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Offer Description</label>
                <input
                  type="text"
                  value={formData.offerDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, offerDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. with next 100 visa applications!"
                />
              </div>
            </div>
          </div>

          {/* Image & Spots */}
          <div className="space-y-4 p-6 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></div>
              <h3 className="text-lg font-semibold text-gray-900">Image & Availability</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Expert Image URL</label>
                <input
                  type="text"
                  value={formData.expertImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, expertImage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  placeholder="e.g. /image/expert.png"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Default Spots Left</label>
                <input
                  type="number"
                  min="1"
                  value={formData.defaultSpotsLeft}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultSpotsLeft: parseInt(e.target.value) || 12 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  placeholder="12"
                />
                <p className="text-xs text-gray-400 mt-1">The starting number of spots shown to users each day</p>
              </div>
            </div>
            {formData.expertImage && (
              <div className="mt-4 flex items-center gap-4">
                <div className="relative w-24 h-24 bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={formData.expertImage}
                    alt="Expert preview"
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="text-xs text-gray-400">Image preview</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowModal(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={editingSection ? handleUpdate : handleCreate}
              size="sm"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingSection ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
