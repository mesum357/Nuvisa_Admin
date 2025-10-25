"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { FAQ, CreateFAQData, UpdateFAQData } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<CreateFAQData>({
    question: '',
    answer: '',
    category: '',
    order: undefined, // Let the API assign the order automatically
    isActive: true,
  });

  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter;

      const response = await apiClient.get<FAQ[]>('/faqs', params);
      if (response.success && response.data) {
        setFaqs(response.data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleCreateFAQ = async () => {
    if (!formData.question || !formData.answer) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post('/faqs', formData);
      if (response.success) {
        await fetchFAQs();
        setShowModal(false);
        resetForm();
        console.log('FAQ created successfully');
      } else {
        alert('Failed to create FAQ: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating FAQ:', error);
      alert('Failed to create FAQ. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFAQ = async () => {
    if (!editingFAQ || !formData.question || !formData.answer) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.patch(`/faqs/${editingFAQ.id}`, formData);
      if (response.success) {
        await fetchFAQs();
        setShowModal(false);
        setEditingFAQ(null);
        resetForm();
        console.log('FAQ updated successfully');
      } else {
        alert('Failed to update FAQ: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      alert('Failed to update FAQ. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`delete-${id}`]: true }));
    try {
      const response = await apiClient.delete(`/faqs/${id}`);
      if (response.success) {
        await fetchFAQs();
        // Show success message (you could add a toast notification here)
        console.log('FAQ deleted successfully');
      } else {
        alert('Failed to delete FAQ: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete-${id}`]: false }));
    }
  };

  const handleToggleStatus = async (faq: FAQ) => {
    setLoadingStates(prev => ({ ...prev, [`toggle-${faq.id}`]: true }));
    try {
      const response = await apiClient.patch(`/faqs/${faq.id}`, {
        isActive: !faq.isActive,
      });
      if (response.success) {
        await fetchFAQs();
        console.log(`FAQ ${faq.isActive ? 'deactivated' : 'activated'} successfully`);
      } else {
        alert('Failed to update FAQ status: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error toggling FAQ status:', error);
      alert('Failed to update FAQ status. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`toggle-${faq.id}`]: false }));
    }
  };

  const handleReorder = async (faq: FAQ, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const targetFAQ = faqs[targetIndex];
    const loadingKey = `reorder-${faq.id}-${direction}`;
    
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    try {
      // Swap orders
      const responses = await Promise.all([
        apiClient.patch(`/faqs/${faq.id}`, { order: targetFAQ.order }),
        apiClient.patch(`/faqs/${targetFAQ.id}`, { order: faq.order }),
      ]);
      
      if (responses.every(r => r.success)) {
        await fetchFAQs();
        console.log(`FAQ moved ${direction} successfully`);
      } else {
        alert('Failed to reorder FAQs: ' + responses.find(r => !r.success)?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error reordering FAQs:', error);
      alert('Failed to reorder FAQs. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      order: undefined, // Let the API assign the order automatically
      isActive: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingFAQ(null);
    setShowModal(true);
  };

  const openEditModal = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      order: faq.order,
      isActive: faq.isActive,
    });
    setEditingFAQ(faq);
    setShowModal(true);
  };

  const categories = Array.from(new Set(faqs.map(faq => faq.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading FAQs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            FAQ Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage frequently asked questions and answers
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add New FAQ
        </Button>
      </div>

      {/* Filters */}
      <ComponentCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="Search questions or answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category || ""}>
                  {category || "Uncategorized"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={fetchFAQs} variant="outline">
            Apply Filters
          </Button>
        </div>
      </ComponentCard>

      {/* FAQs List */}
      <ComponentCard title={`FAQs (${faqs.length})`}>
        <div className="space-y-4">
          {faqs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No FAQs found. Create your first FAQ to get started.
            </div>
          ) : (
            faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      {faq.category && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                          {faq.category}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          faq.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {faq.answer}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Order: {faq.order} • Updated: {new Date(faq.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(faq, 'up')}
                      disabled={index === 0 || loadingStates[`reorder-${faq.id}-up`]}
                      title="Move up"
                    >
                      {loadingStates[`reorder-${faq.id}-up`] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(faq, 'down')}
                      disabled={index === faqs.length - 1 || loadingStates[`reorder-${faq.id}-down`]}
                      title="Move down"
                    >
                      {loadingStates[`reorder-${faq.id}-down`] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(faq)}
                      disabled={loadingStates[`toggle-${faq.id}`]}
                      title={faq.isActive ? "Hide FAQ" : "Show FAQ"}
                    >
                      {loadingStates[`toggle-${faq.id}`] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : faq.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(faq)}
                      title="Edit FAQ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFAQ(faq.id)}
                      disabled={loadingStates[`delete-${faq.id}`]}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete FAQ"
                    >
                      {loadingStates[`delete-${faq.id}`] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ComponentCard>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingFAQ(null);
          resetForm();
        }}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}
          </h2>
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="Enter the question..."
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Answer *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              rows={5}
              placeholder="Enter the answer..."
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              placeholder="e.g., General, Documents, Payment"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              className="mr-2"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingFAQ(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingFAQ ? handleUpdateFAQ : handleCreateFAQ}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingFAQ ? 'Update FAQ' : 'Create FAQ'
              )}
            </Button>
          </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
