"use client";

import React, { useEffect, useState } from 'react';
import { Edit2, Eye, EyeOff, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ComparisonSection, CreateComparisonSectionData, UpdateComparisonSectionData, ComparisonItem } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

export default function ComparisonSectionPage() {
  const [comparisonSections, setComparisonSections] = useState<ComparisonSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ComparisonSection | null>(null);
  const [formData, setFormData] = useState<CreateComparisonSectionData>({
    title: '',
    countryName: '',
    tooltip: "",
    leftSideTitle: '',
    rightSideTitle: '',
    leftSideImage: '',
    rightSideImage: '',
    leftSideItems: [{ feature: '', value: '', tooltip: '' }],
    rightSideItems: [{ feature: '', value: '', tooltip: '' }],
    detailSections: [{ title: 'DETAILS', items: [''] }],
    experienceType: 'IMAGES',
    experienceItems: { leftImage: '', rightImage: '' },
    experienceTitle: 'THE EXPERIENCE',
    comparisonColumns: ['Traditional Agency', 'NUvisa'],
    comparisonRows: [{ feature: '', values: ['', ''], tooltip: '' }],
    isActive: true,
  });

  useEffect(() => {
    fetchComparisonSections();
  }, []);

  const fetchComparisonSections = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<ComparisonSection[]>('/comparison-section?path=all');
      if (response.success && response.data) {
        setComparisonSections(response.data);
      }
    } catch (error) {
      console.error('Error fetching comparison sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post<ComparisonSection>('/comparison-section', formData);
      if (response.success && response.data) {
        setShowModal(false);
        resetForm();
        await fetchComparisonSections();
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
        setShowModal(false);
        setEditingSection(null);
        resetForm();
        await fetchComparisonSections();
      }
    } catch (error) {
      console.error('Error updating comparison section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setSaving(true);
    try {
      const response = await apiClient.patch<ComparisonSection>(
        `/comparison-section?id=${id}&action=toggle`
      );
      if (response.success && response.data) {
        await fetchComparisonSections();
      }
    } catch (error) {
      console.error('Error toggling comparison section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this comparison section?')) return;

    setSaving(true);
    try {
      const response = await apiClient.delete(`/comparison-section?id=${id}`);
      if (response.success) {
        await fetchComparisonSections();
      }
    } catch (error) {
      console.error('Error deleting comparison section:', error);
    } finally {
      setSaving(false);
    }
  };
  const resetForm = () => {
    setFormData({
      title: '',
      countryName: '',
      tooltip: '',
      leftSideTitle: '',
      rightSideTitle: '',
      leftSideImage: '',
      rightSideImage: '',
      leftSideItems: [{ feature: '', value: '', tooltip: '' }],
      rightSideItems: [{ feature: '', value: '', tooltip: '' }],
      detailSections: [{ title: 'DETAILS', items: [''] }],
      experienceType: 'IMAGES',
      experienceItems: { leftImage: '', rightImage: '' },
      experienceTitle: 'THE EXPERIENCE',
      comparisonColumns: ['Traditional Agency', 'NUvisa'],
      comparisonRows: [{ feature: '', values: ['', ''], tooltip: '' }],
      isActive: true,
    });
  };

  const normalizeItems = (items: (ComparisonItem | string)[]): ComparisonItem[] =>
    (items || []).map((item) =>
      typeof item === 'string' ? { feature: '', value: item, tooltip: '' } : { ...item, tooltip: item.tooltip || '' }
    );

  const openEditModal = (section: ComparisonSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      countryName: section.countryName || '',
      tooltip: section.tooltip || '',
      leftSideTitle: section.leftSideTitle,
      rightSideTitle: section.rightSideTitle,
      leftSideImage: section.leftSideImage || '',
      rightSideImage: section.rightSideImage || '',
      leftSideItems: normalizeItems(section.leftSideItems as (ComparisonItem | string)[]),
      rightSideItems: normalizeItems(section.rightSideItems as (ComparisonItem | string)[]),
      detailSections: section.detailSections || [{ title: 'DETAILS', items: [] }],
      experienceType: (section.experienceType as 'IMAGES' | 'TASKS') || 'IMAGES',
      experienceItems: section.experienceItems || (section.experienceType === 'TASKS' ? [] : { leftImage: '', rightImage: '' }),
      experienceTitle: section.experienceTitle || 'THE EXPERIENCE',
      comparisonColumns: section.comparisonColumns || ['Traditional Agency', 'NUvisa'],
      comparisonRows: section.comparisonRows || [{ feature: '', values: ['', ''], tooltip: '' }],
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
      leftSideItems: [...prev.leftSideItems as ComparisonItem[], { feature: '', value: '', tooltip: '' }],
      rightSideItems: [...prev.rightSideItems as ComparisonItem[], { feature: '', value: '', tooltip: '' }]
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      leftSideItems: (prev.leftSideItems as ComparisonItem[]).filter((_, i) => i !== index),
      rightSideItems: (prev.rightSideItems as ComparisonItem[]).filter((_, i) => i !== index)
    }));
  };

  const updateItemRow = (index: number, field: 'feature' | 'leftValue' | 'rightValue' | 'tooltip', value: string) => {
    setFormData(prev => {
      const newLeftItems = [...(prev.leftSideItems as ComparisonItem[])];
      const newRightItems = [...(prev.rightSideItems as ComparisonItem[])];

      if (!newLeftItems[index]) newLeftItems[index] = { feature: '', value: '', tooltip: '' };
      if (!newRightItems[index]) newRightItems[index] = { feature: '', value: '', tooltip: '' };

      if (field === 'feature') {
        newLeftItems[index].feature = value;
        newRightItems[index].feature = value;
      } else if (field === 'leftValue') {
        newLeftItems[index].value = value;
      } else if (field === 'rightValue') {
        newRightItems[index].value = value;
      } else if (field === 'tooltip') {
        newLeftItems[index].tooltip = value;
        newRightItems[index].tooltip = value;
      }

      return {
        ...prev,
        leftSideItems: newLeftItems,
        rightSideItems: newRightItems
      };
    });
  };

  // Multi-Column Methods
  const addComparisonColumn = () => {
    setFormData(prev => {
      const newColumns = [...(prev.comparisonColumns || [])];
      if (newColumns.length >= 6) return prev; // Limit to 6 columns
      newColumns.push(`Column ${newColumns.length + 1}`);

      const newRows = (prev.comparisonRows || []).map(row => ({
        ...row,
        values: [...row.values, '']
      }));

      return { ...prev, comparisonColumns: newColumns, comparisonRows: newRows };
    });
  };

  const removeComparisonColumn = (index: number) => {
    setFormData(prev => {
      const newColumns = (prev.comparisonColumns || []).filter((_, i) => i !== index);
      const newRows = (prev.comparisonRows || []).map(row => ({
        ...row,
        values: row.values.filter((_, i) => i !== index)
      }));
      return { ...prev, comparisonColumns: newColumns, comparisonRows: newRows };
    });
  };

  const updateComparisonColumn = (index: number, name: string) => {
    setFormData(prev => {
      const newColumns = [...(prev.comparisonColumns || [])];
      newColumns[index] = name;
      return { ...prev, comparisonColumns: newColumns };
    });
  };

  const addComparisonRow = () => {
    setFormData(prev => ({
      ...prev,
      comparisonRows: [
        ...(prev.comparisonRows || []),
        { feature: '', values: new Array((prev.comparisonColumns || []).length).fill(''), tooltip: '' }
      ]
    }));
  };

  const removeComparisonRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      comparisonRows: (prev.comparisonRows || []).filter((_, i) => i !== index)
    }));
  };

  const updateComparisonRow = (index: number, field: 'feature' | 'tooltip', value: string) => {
    setFormData(prev => {
      const newRows = [...(prev.comparisonRows || [])];
      newRows[index] = { ...newRows[index], [field]: value };
      return { ...prev, comparisonRows: newRows };
    });
  };

  const updateComparisonRowValue = (rowIndex: number, colIndex: number, value: string) => {
    setFormData(prev => {
      const newRows = [...(prev.comparisonRows || [])];
      const newValues = [...newRows[rowIndex].values];
      newValues[colIndex] = value;
      newRows[rowIndex] = { ...newRows[rowIndex], values: newValues };
      return { ...prev, comparisonRows: newRows };
    });
  };


  const addDetailSection = () => {
    setFormData(prev => ({
      ...prev,
      detailSections: [...(prev.detailSections || []), { title: '', items: [''] }]
    }));
  };

  const removeDetailSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detailSections: (prev.detailSections || []).filter((_, i) => i !== index)
    }));
  };

  const updateDetailSectionTitle = (index: number, title: string) => {
    setFormData(prev => {
      const newSections = [...(prev.detailSections || [])];
      newSections[index].title = title;
      return { ...prev, detailSections: newSections };
    });
  };

  const addDetailItem = (sectionIndex: number) => {
    setFormData(prev => {
      const newSections = [...(prev.detailSections || [])];
      newSections[sectionIndex].items = [...newSections[sectionIndex].items, ''];
      return { ...prev, detailSections: newSections };
    });
  };

  const removeDetailItem = (sectionIndex: number, itemIndex: number) => {
    setFormData(prev => {
      const newSections = [...(prev.detailSections || [])];
      newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
      return { ...prev, detailSections: newSections };
    });
  };

  const updateDetailItemValue = (sectionIndex: number, itemIndex: number, value: string) => {
    setFormData(prev => {
      const newSections = [...(prev.detailSections || [])];
      newSections[sectionIndex].items[itemIndex] = value;
      return { ...prev, detailSections: newSections };
    });
  };

  const handleExperienceTypeChange = (type: 'IMAGES' | 'TASKS') => {
    setFormData(prev => ({
      ...prev,
      experienceType: type,
      experienceItems: type === 'TASKS' ? [''] : { leftImage: prev.leftSideImage || '', rightImage: prev.rightSideImage || '' }
    }));
  };

  const addExperienceTask = () => {
    setFormData(prev => ({
      ...prev,
      experienceItems: [...(Array.isArray(prev.experienceItems) ? prev.experienceItems : []), '']
    }));
  };

  const removeExperienceTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experienceItems: (Array.isArray(prev.experienceItems) ? prev.experienceItems : []).filter((_, i) => i !== index)
    }));
  };

  const updateExperienceTaskValue = (index: number, value: string) => {
    setFormData(prev => {
      const newItems = [...(Array.isArray(prev.experienceItems) ? prev.experienceItems : [])];
      newItems[index] = value;
      return { ...prev, experienceItems: newItems };
    });
  };

  const updateExperienceImage = (side: 'left' | 'right', url: string) => {
    setFormData(prev => {
      const newItems = typeof prev.experienceItems === 'object' && !Array.isArray(prev.experienceItems)
        ? { ...prev.experienceItems }
        : { leftImage: '', rightImage: '' };

      if (side === 'left') {
        newItems.leftImage = url;
        return { ...prev, experienceItems: newItems, leftSideImage: url };
      } else {
        newItems.rightImage = url;
        return { ...prev, experienceItems: newItems, rightSideImage: url };
      }
    });
  };

  const updateExperienceTitle = (side: 'left' | 'right', title: string) => {
    setFormData(prev => ({
      ...prev,
      [side === 'left' ? 'leftSideTitle' : 'rightSideTitle']: title
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
        <h1 className="text-2xl font-bold text-gray-900">Comparison Sections Management</h1>
        <Button onClick={openCreateModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create New Section
        </Button>
      </div>

      <ComponentCard title="All Comparison Sections" desc="Manage country-specific comparison data">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Country</th>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Last Updated</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparisonSections.map((section) => (
                <tr key={section.id} className="bg-white hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {section.countryName || <span className="text-gray-400 italic">Default / General</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {section.title}
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
                  <td className=" text-right">
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
                        className="h-8 w-8 px-0  text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {comparisonSections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                    No comparison sections found. Click "Create New Section" to get started.
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
        className="max-w-6xl p-8"
      >
        <div className="space-y-8 h-[calc(100vh-10rem)] overflow-y-auto overflow-x-hidden">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingSection ? 'Edit Comparison Points' : 'Create Comparison Points'}
          </h2>
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
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
                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${formData.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`}></div>
                </div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* Section Titles */}
          <div className="space-y-4 p-6 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
              <h3 className="text-lg font-semibold text-gray-900">Section Titles</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Country Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.countryName}
                  onChange={(e) => setFormData(prev => ({ ...prev, countryName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g. France, Germany, or 'Default'"
                />
              </div>
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
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-blue-500 uppercase">Tooltip (Optional)</label>
                <input
                  type="text"
                  value={formData.tooltip || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tooltip: e.target.value }))}
                  className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Overall tooltip for the section..."
                />
              </div>
            </div>

          </div>

          {/* Multi-Column Comparison Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-sm"></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Multi-Column Comparison (New)</h3>
                  <p className="text-sm text-gray-600 italic">Use this for 4+ company comparisons like the reference image</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addComparisonColumn}
                  disabled={(formData.comparisonColumns?.length || 0) >= 6}
                  variant="outline"
                  size="sm"
                  className="bg-white text-indigo-600 border-indigo-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Column
                </Button>
                <Button
                  onClick={addComparisonRow}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-xl p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-3 text-left w-64 uppercase text-[10px] font-bold text-gray-500 tracking-wider">Feature / Company</th>
                    {(formData.comparisonColumns || []).map((col, cIdx) => (
                      <th key={cIdx} className="p-3 text-left min-w-[150px] relative group">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={col}
                            onChange={(e) => updateComparisonColumn(cIdx, e.target.value)}
                            className="bg-transparent border-none focus:ring-0 font-bold text-gray-900 w-full uppercase"
                            placeholder={`Company ${cIdx + 1}`}
                          />
                          {(formData.comparisonColumns || []).length > 1 && (
                            <button
                              onClick={() => removeComparisonColumn(cIdx)}
                              className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 w-48 uppercase text-[10px] font-bold text-gray-500 tracking-wider">Tooltip</th>
                    <th className="p-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(formData.comparisonRows || []).map((row, rIdx) => (
                    <tr key={rIdx} className="group hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.feature}
                          onChange={(e) => updateComparisonRow(rIdx, 'feature', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white font-medium"
                          placeholder="e.g. Price"
                        />
                      </td>
                      {row.values.map((val, cIdx) => (
                        <td key={cIdx} className="p-3">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => updateComparisonRowValue(rIdx, cIdx, e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                            placeholder="Value"
                          />
                        </td>
                      ))}
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.tooltip || ''}
                          onChange={(e) => updateComparisonRow(rIdx, 'tooltip', e.target.value)}
                          className="w-full p-2 border border-blue-100 rounded focus:ring-1 focus:ring-blue-500 bg-blue-50/50 text-xs italic"
                          placeholder="Tooltip info..."
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => removeComparisonRow(rIdx)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(formData.comparisonRows || []).length === 0 && (
                    <tr>
                      <td colSpan={(formData.comparisonColumns?.length || 0) + 3} className="p-10 text-center text-gray-400 bg-gray-50/50 italic">
                        No rows added yet. Click "Add Row" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Table will adapt automatically on frontend</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-8"></div>

          {/* Detail Sections Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full shadow-sm"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Detail Sections</h3>
                  <p className="text-sm text-gray-600">Add dynamic details, tips, or FAQ bullets</p>
                </div>
              </div>
              <Button
                onClick={addDetailSection}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Detail Section
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(formData.detailSections || []).map((section, sIndex) => (
                <div key={sIndex} className="relative p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
                  <Button
                    onClick={() => removeDetailSection(sIndex)}
                    variant="outline"
                    size="sm"
                    className="absolute -top-3 -right-3 rounded-full h-8 w-8 p-0 bg-white text-red-600 hover:text-red-700 border-red-200 shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Section Title</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateDetailSectionTitle(sIndex, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 font-bold"
                      placeholder="e.g. DETAILS or TIPS"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Bullet Points</label>
                      <Button
                        onClick={() => addDetailItem(sIndex)}
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] text-purple-600 hover:text-purple-700 border-none shadow-none"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Point
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item, iIndex) => (
                        <div key={iIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateDetailItemValue(sIndex, iIndex, e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Add detail point..."
                          />
                          <Button
                            onClick={() => removeDetailItem(sIndex, iIndex)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 border-none shadow-none"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Section Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Experience Section</h3>
                  <p className="text-sm text-gray-600">Choose between displaying comparison images or a task list</p>
                </div>
              </div>
              <div className="flex bg-gray-200 p-1 rounded-lg">
                <button
                  onClick={() => handleExperienceTypeChange('IMAGES')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${formData.experienceType === 'IMAGES' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Images
                </button>
                <button
                  onClick={() => handleExperienceTypeChange('TASKS')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${formData.experienceType === 'TASKS' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Task List
                </button>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Experience Section Title</label>
                <input
                  type="text"
                  value={formData.experienceTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  placeholder="e.g. THE EXPERIENCE"
                />
              </div>

              <div className="border-t border-gray-100 pt-6">
                {formData.experienceType === 'TASKS' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">Experience Tasks</h4>
                      <Button
                        onClick={addExperienceTask}
                        size="sm"
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <Plus className="h-4 w-4" /> Add Task
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Array.isArray(formData.experienceItems) ? formData.experienceItems : []).map((task, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={task}
                            onChange={(e) => updateExperienceTaskValue(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Experience task item..."
                          />
                          <Button
                            onClick={() => removeExperienceTask(index)}
                            variant="outline"
                            className="text-red-400 hover:text-red-600 border-none shadow-none"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Left Side Title</label>
                        <input
                          type="text"
                          value={formData.leftSideTitle}
                          onChange={(e) => updateExperienceTitle('left', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Traditional Agency"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Right Side Title</label>
                        <input
                          type="text"
                          value={formData.rightSideTitle}
                          onChange={(e) => updateExperienceTitle('right', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="NUvisa"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Left Side Image URL</label>
                        <input
                          type="text"
                          value={(formData.experienceItems as any)?.leftImage || ''}
                          onChange={(e) => updateExperienceImage('left', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Right Side Image URL</label>
                        <input
                          type="text"
                          value={(formData.experienceItems as any)?.rightImage || ''}
                          onChange={(e) => updateExperienceImage('right', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                )}
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
