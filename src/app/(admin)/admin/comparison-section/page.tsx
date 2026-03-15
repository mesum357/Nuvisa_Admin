"use client";

import React, { useEffect, useState } from 'react';
import { Edit2, Eye, EyeOff, Loader2, Plus, Save, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ComparisonSection, CreateComparisonSectionData, UpdateComparisonSectionData, ComparisonItem } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

export default function ComparisonSectionPage() {
  const [comparisonSection, setComparisonSection] = useState<ComparisonSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ComparisonSection | null>(null);
  const [formData, setFormData] = useState<CreateComparisonSectionData>({
    title: '',
    leftSideTitle: '',
    rightSideTitle: '',
    leftSideImage: '',
    rightSideImage: '',
    leftSideItems: [{ feature: '', value: '' }],
    rightSideItems: [{ feature: '', value: '' }],
    isActive: true,
  });

  useEffect(() => {
    fetchComparisonSection();
  }, []);

  const fetchComparisonSection = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<ComparisonSection>('/comparison-section?path=active');
      if (response.success && response.data) {
        setComparisonSection(response.data);
      }
    } catch (error) {
      console.error('Error fetching comparison section:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post<ComparisonSection>('/comparison-section', formData);
      if (response.success && response.data) {
        setComparisonSection(response.data);
        setShowModal(false);
        resetForm();
        // Re-fetch to ensure we have the latest data
        await fetchComparisonSection();
      }
    } catch (error) {
      console.error('Error creating comparison section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSection) return;

    setSaving(true);
    try {
      const response = await apiClient.patch<ComparisonSection>(
        `/comparison-section?id=${editingSection.id}`,
        formData
      );
      if (response.success && response.data) {
        setComparisonSection(response.data);
        setShowModal(false);
        setEditingSection(null);
        resetForm();
        // Re-fetch to ensure we have the latest data
        await fetchComparisonSection();
      }
    } catch (error) {
      console.error('Error updating comparison section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!comparisonSection) return;

    setSaving(true);
    try {
      const response = await apiClient.patch<ComparisonSection>(
        `/comparison-section?id=${comparisonSection.id}&action=toggle`
      );
      if (response.success && response.data) {
        setComparisonSection(response.data);
        // Re-fetch to ensure we have the latest data
        await fetchComparisonSection();
      }
    } catch (error) {
      console.error('Error toggling comparison section:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      leftSideTitle: '',
      rightSideTitle: '',
      leftSideImage: '',
      rightSideImage: '',
      leftSideItems: [{ feature: '', value: '' }],
      rightSideItems: [{ feature: '', value: '' }],
      isActive: true,
    });
  };

  const normalizeItems = (items: (ComparisonItem | string)[]): ComparisonItem[] =>
    (items || []).map((item) =>
      typeof item === 'string' ? { feature: '', value: item } : item
    );

  const openEditModal = (section: ComparisonSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      leftSideTitle: section.leftSideTitle,
      rightSideTitle: section.rightSideTitle,
      leftSideImage: section.leftSideImage || '',
      rightSideImage: section.rightSideImage || '',
      leftSideItems: normalizeItems(section.leftSideItems as (ComparisonItem | string)[]),
      rightSideItems: normalizeItems(section.rightSideItems as (ComparisonItem | string)[]),
      isActive: section.isActive,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingSection(null);
    resetForm();
    setShowModal(true);
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      leftSideItems: [...prev.leftSideItems as ComparisonItem[], { feature: '', value: '' }],
      rightSideItems: [...prev.rightSideItems as ComparisonItem[], { feature: '', value: '' }]
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      leftSideItems: (prev.leftSideItems as ComparisonItem[]).filter((_, i) => i !== index),
      rightSideItems: (prev.rightSideItems as ComparisonItem[]).filter((_, i) => i !== index)
    }));
  };

  const updateItemRow = (index: number, field: 'feature' | 'leftValue' | 'rightValue', value: string) => {
    setFormData(prev => {
      const newLeftItems = [...(prev.leftSideItems as ComparisonItem[])];
      const newRightItems = [...(prev.rightSideItems as ComparisonItem[])];

      if (!newLeftItems[index]) newLeftItems[index] = { feature: '', value: '' };
      if (!newRightItems[index]) newRightItems[index] = { feature: '', value: '' };

      if (field === 'feature') {
        newLeftItems[index].feature = value;
        newRightItems[index].feature = value;
      } else if (field === 'leftValue') {
        newLeftItems[index].value = value;
      } else if (field === 'rightValue') {
        newRightItems[index].value = value;
      }

      return {
        ...prev,
        leftSideItems: newLeftItems,
        rightSideItems: newRightItems
      };
    });
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
        <h1 className="text-2xl font-bold text-gray-900">Comparison Points Management</h1>
        <div className="flex gap-2">
          {comparisonSection && (
            <Button
              onClick={handleToggleActive}
              disabled={saving}
              variant={comparisonSection.isActive ? "outline" : "primary"}
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : comparisonSection.isActive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {comparisonSection.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          <Button onClick={openCreateModal} size="sm">
            <Plus className="h-4 w-4" />
            {comparisonSection ? 'Edit Points' : 'Create Points'}
          </Button>
        </div>
      </div>

      {comparisonSection ? (
        <div className="space-y-6">
          {/* Status Header */}
          <ComponentCard title="Comparison Points Status" desc={`Last updated: ${comparisonSection.updatedAt ? new Date(comparisonSection.updatedAt).toLocaleDateString() : 'Unknown'}`}>
            <div className="flex justify-between items-center">
              <div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${comparisonSection.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {comparisonSection.isActive ? 'Active' : 'Inactive'}
                </span>
                <Button
                  onClick={() => openEditModal(comparisonSection)}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Points
                </Button>
              </div>
            </div>
          </ComponentCard>

          {/* Comparison Points Display */}
          <ComponentCard title="Comparison Points">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Feature</th>
                    <th className="px-6 py-3 font-semibold text-red-600 border-l">{comparisonSection.leftSideTitle}</th>
                    <th className="px-6 py-3 font-semibold text-green-600 border-l">{comparisonSection.rightSideTitle}</th>
                  </tr>
                </thead>
                <tbody>
                  {((comparisonSection.leftSideItems || []) as ComparisonItem[]).map((leftItem, index) => {
                    const rightItem = ((comparisonSection.rightSideItems || []) as ComparisonItem[])[index] || { value: '' };
                    return (
                      <tr key={index} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 border-r">{leftItem.feature || (typeof leftItem === 'string' ? 'Feature' : '')}</td>
                        <td className="px-6 py-4 text-red-700 border-r">{typeof leftItem === 'string' ? leftItem : leftItem.value}</td>
                        <td className="px-6 py-4 text-green-700">{typeof rightItem === 'string' ? rightItem : rightItem.value}</td>
                      </tr>
                    );
                  })}
                  {(!comparisonSection.leftSideItems || comparisonSection.leftSideItems.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No comparison points available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        </div>
      ) : (
        <ComponentCard title="No Comparison Section">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No comparison section found</p>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Create Comparison Section
            </Button>
          </div>
        </ComponentCard>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        className="max-w-6xl p-8"
      >
        <div className="space-y-8 h-[calc(100vh-10rem)] overflow-y-auto overflow-x-hidden">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingSection ? 'Edit Comparison Points' : 'Create Comparison Points'}
          </h2>
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Section Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">Control whether the comparison section is visible on the website</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${formData.isActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                </div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* Section Titles */}
          <div className="space-y-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
              <h3 className="text-lg font-semibold text-gray-900">Section Titles</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Main Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g. Why Choose NUvisa?"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-red-500 uppercase">Left Side Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.leftSideTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, leftSideTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-red-200 bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                  placeholder="e.g. Traditional Agents"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-green-500 uppercase">Right Side Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.rightSideTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, rightSideTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. NUvisa"
                />
              </div>
            </div>
          </div>

          {/* Comparison Rows Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full shadow-sm"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Features Comparison</h3>
                  <p className="text-sm text-gray-600">Add features and their values for both sides</p>
                </div>
              </div>
              <Button
                onClick={addItemRow}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Feature Row
              </Button>
            </div>

            <div className="space-y-4">
              {((formData.leftSideItems || []) as ComparisonItem[]).map((leftItem, index) => {
                const rightItem = ((formData.rightSideItems || []) as ComparisonItem[])[index] || { value: '' };
                const cLeftItem = typeof leftItem === 'string' ? { feature: '', value: leftItem } : leftItem;
                const cRightItem = typeof rightItem === 'string' ? { feature: '', value: rightItem } : rightItem;

                return (
                  <div key={index} className="group relative flex flex-col md:flex-row gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 shadow-sm transition-colors">
                    <Button
                      onClick={() => removeItemRow(index)}
                      variant="outline"
                      size="sm"
                      className="absolute -top-3 -right-3 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Feature Name</label>
                      <input
                        type="text"
                        value={cLeftItem.feature || ''}
                        onChange={(e) => updateItemRow(index, 'feature', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="e.g. Price"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-semibold text-red-500 uppercase">{formData.leftSideTitle || 'Traditional'}</label>
                      <input
                        type="text"
                        value={cLeftItem.value || ''}
                        onChange={(e) => updateItemRow(index, 'leftValue', e.target.value)}
                        className="w-full px-3 py-2 border border-red-200 bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                        placeholder="e.g. £300 + fees"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-semibold text-green-500 uppercase">{formData.rightSideTitle || 'NUvisa'}</label>
                      <input
                        type="text"
                        value={cRightItem.value || ''}
                        onChange={(e) => updateItemRow(index, 'rightValue', e.target.value)}
                        className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        placeholder="e.g. Flat £200"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {editingSection ? 'Update your comparison points' : 'Create new comparison points'}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={editingSection ? handleUpdate : handleCreate}
                disabled={saving}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {editingSection ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingSection ? 'Update Points' : 'Create Points'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
