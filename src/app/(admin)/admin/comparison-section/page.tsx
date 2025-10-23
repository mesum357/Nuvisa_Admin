"use client";

import React, { useEffect, useState } from 'react';
import { Edit2, Eye, EyeOff, Loader2, Plus, Save, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ComparisonSection, CreateComparisonSectionData, UpdateComparisonSectionData } from '@/types';
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
    leftSideItems: [''],
    rightSideItems: [''],
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
      leftSideItems: [''],
      rightSideItems: [''],
      isActive: true,
    });
  };

  const openEditModal = (section: ComparisonSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      leftSideTitle: section.leftSideTitle,
      rightSideTitle: section.rightSideTitle,
      leftSideImage: section.leftSideImage || '',
      rightSideImage: section.rightSideImage || '',
      leftSideItems: section.leftSideItems,
      rightSideItems: section.rightSideItems,
      isActive: section.isActive,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingSection(null);
    resetForm();
    setShowModal(true);
  };

  const addItem = (side: 'left' | 'right') => {
    const key = side === 'left' ? 'leftSideItems' : 'rightSideItems';
    setFormData(prev => ({
      ...prev,
      [key]: [...prev[key], '']
    }));
  };

  const removeItem = (side: 'left' | 'right', index: number) => {
    const key = side === 'left' ? 'leftSideItems' : 'rightSideItems';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const updateItem = (side: 'left' | 'right', index: number, value: string) => {
    const key = side === 'left' ? 'leftSideItems' : 'rightSideItems';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item)
    }));
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  comparisonSection.isActive 
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side Points */}
            <ComponentCard title={comparisonSection.leftSideTitle}>
              <div className="space-y-4">
                <div className="space-y-3">
                  {(comparisonSection.leftSideItems || []).length > 0 ? (
                    (comparisonSection.leftSideItems || []).map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                      No left side points available
                    </div>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* Right Side Points */}
            <ComponentCard title={comparisonSection.rightSideTitle}>
              <div className="space-y-4">
                <div className="space-y-3">
                  {(comparisonSection.rightSideItems || []).length > 0 ? (
                    (comparisonSection.rightSideItems || []).map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                      No right side points available
                    </div>
                  )}
                </div>
              </div>
            </ComponentCard>
          </div>
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
        <div className="space-y-8">
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
                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  formData.isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* Comparison Points Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Traditional Agency Points */}
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Traditional Agency</h3>
                    <p className="text-sm text-gray-600">Negative comparison points</p>
                  </div>
                </div>
                <Button
                  onClick={() => addItem('left')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Point
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.leftSideItems.map((item, index) => (
                  <div key={index} className="group flex gap-3 items-start p-4 bg-white border border-red-200 rounded-lg hover:border-red-300 transition-colors">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-2 shadow-sm"></div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem('left', index, e.target.value)}
                      className="flex-1 px-3 py-2 border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-400"
                      placeholder="Enter comparison point (e.g., £250-£300 + extra fees)"
                    />
                    <Button
                      onClick={() => removeItem('left', index)}
                      variant="outline"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - NUvisa Points */}
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">NUvisa</h3>
                    <p className="text-sm text-gray-600">Positive comparison points</p>
                  </div>
                </div>
                <Button
                  onClick={() => addItem('right')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Point
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.rightSideItems.map((item, index) => (
                  <div key={index} className="group flex gap-3 items-start p-4 bg-white border border-green-200 rounded-lg hover:border-green-300 transition-colors">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 mt-2 shadow-sm"></div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem('right', index, e.target.value)}
                      className="flex-1 px-3 py-2 border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-400"
                      placeholder="Enter comparison point (e.g., Flat £200 - no hidden fees)"
                    />
                    <Button
                      onClick={() => removeItem('right', index)}
                      variant="outline"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
