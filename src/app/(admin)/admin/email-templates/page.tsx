"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { EmailTemplate } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [socialLinks, setSocialLinks] = useState({ twitter: '', facebook: '', instagram: '', linkedin: '' });
  const [footerSettings, setFooterSettings] = useState({
    logoUrl: '/image/logo.png',
    teamSignature: '— Team NUvisa',
    companyInfo: ['If you have any questions, please visit our Help Centre.'],
  });
  const [savingFooter, setSavingFooter] = useState(false);
  const [companyInfoText, setCompanyInfoText] = useState('If you have any questions, please visit our Help Centre.');
  const [editingValues, setEditingValues] = useState<Record<string, { name: string; subject: string; body: string; description: string; isActive: boolean }>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ key: '', name: '', subject: '', body: '', description: '' });
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchFooterSettings();
  }, []);

  const fetchSocialLinks = async () => {
    // Social links are now fetched as part of footer settings
    // This function is kept for backward compatibility but does nothing
  };

  const fetchFooterSettings = async () => {
    try {
      const response = await apiClient.get<{
        results: {
          logoUrl: string;
          teamSignature: string;
          companyInfo: string[];
          twitter: string;
          facebook: string;
          instagram: string;
          linkedin: string;
        };
        recordsCount: number;
      }>('/orders/email-footer-settings');
      if (response.success && response.data?.results) {
        const results = response.data.results;
        const companyInfo = results.companyInfo || ['If you have any questions, please visit our Help Centre.'];
        const companyInfoTextValue = Array.isArray(companyInfo) && companyInfo.length > 0 
          ? companyInfo.join('\n') 
          : 'If you have any questions, please visit our Help Centre.';
        
        setFooterSettings({
          logoUrl: results.logoUrl || '/image/logo.png',
          teamSignature: results.teamSignature || '— Team NUvisa',
          companyInfo: companyInfo,
        });
        setCompanyInfoText(companyInfoTextValue);
        setSocialLinks({
          twitter: results.twitter || '',
          facebook: results.facebook || '',
          instagram: results.instagram || '',
          linkedin: results.linkedin || ''
        });
      } else {
        // Set default values if API call fails
        const defaultCompanyInfo = 'If you have any questions, please visit our Help Centre.';
        setCompanyInfoText(defaultCompanyInfo);
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
      // Set default values on error
      const defaultCompanyInfo = 'If you have any questions, please visit our Help Centre.';
      setCompanyInfoText(defaultCompanyInfo);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };


  const handleSaveFooterSettings = async () => {
    setSavingFooter(true);
    try {
      const companyInfoArray = companyInfoText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const payload = {
        logoUrl: footerSettings.logoUrl || '/image/logo.png',
        teamSignature: footerSettings.teamSignature || '— Team NUvisa',
        companyInfo: companyInfoArray.length > 0 ? companyInfoArray : ['If you have any questions, please visit our Help Centre.'],
        twitter: socialLinks.twitter || '#',
        facebook: socialLinks.facebook || '#',
        instagram: socialLinks.instagram || '#',
        linkedin: socialLinks.linkedin || '#',
      };

      const response = await apiClient.patch('/orders/email-footer-settings', payload);

      if (response.success) {
        showNotification('success', 'Email footer settings updated successfully');
        // Refresh footer settings to get the latest values
        await fetchFooterSettings();
      } else {
        showNotification('error', response.error || 'Failed to update footer settings');
      }
    } catch (error: any) {
      console.error('Error saving footer settings:', error);
      showNotification('error', error.message || 'Failed to update footer settings');
    } finally {
      setSavingFooter(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    const response = await apiClient.get<EmailTemplate[]>('/orders/email-templates');
    if (response.success && response.data) {
      setTemplates(response.data);
      const values: Record<string, { name: string; subject: string; body: string; description: string; isActive: boolean }> = {};
      response.data.forEach((template) => {
        values[template.id] = {
          name: template.name,
          subject: template.subject,
          body: template.body,
          description: template.description || '',
          isActive: template.isActive,
        };
      });
      setEditingValues(values);
    }
    setLoading(false);
  };

  const handleUpdateTemplate = async (id: string) => {
    setSaving({ ...saving, [id]: true });
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    try {
      const response = await apiClient.patch(`/orders/email-templates?id=${id}`, {
        name: editingValues[id].name,
        subject: editingValues[id].subject,
        body: editingValues[id].body,
        description: editingValues[id].description,
        isActive: editingValues[id].isActive,
      });

      if (response.success) {
        showNotification('success', 'Template updated successfully');
        await fetchTemplates();
      } else {
        showNotification('error', 'Failed to update template');
      }
    } catch (error) {
      showNotification('error', 'Failed to update template');
    } finally {
      setSaving({ ...saving, [id]: false });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email template? This action cannot be undone.')) return;

    setSaving({ ...saving, [id]: true });
    try {
      const response = await apiClient.post(`/orders/email-templates/${id}`, {});

      if (response.success) {
        showNotification('success', 'Template deleted successfully');
        await fetchTemplates();
      } else {
        showNotification('error', 'Failed to delete template');
      }
    } catch (error) {
      showNotification('error', 'Failed to delete template');
    } finally {
      setSaving({ ...saving, [id]: false });
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.key || !newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setSaving({ ...saving, create: true });
    try {
      const response = await apiClient.post('/orders/email-templates', {
        key: newTemplate.key,
        name: newTemplate.name,
        subject: newTemplate.subject,
        body: newTemplate.body,
        description: newTemplate.description,
      });

      if (response.success) {
        showNotification('success', 'Template created successfully');
        setShowCreateModal(false);
        setNewTemplate({ key: '', name: '', subject: '', body: '', description: '' });
        await fetchTemplates();
      } else {
        showNotification('error', 'Failed to create template');
      }
    } catch (error) {
      showNotification('error', 'Failed to create template');
    } finally {
      setSaving({ ...saving, create: false });
    }
  };

  const toggleTemplateExpansion = (id: string) => {
    setExpandedTemplates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Template usage mapping - shows where each template is used in the backend
  const templateUsage: Record<string, string> = {
    otp_email: 'Used for OTP verification emails (Auth Service)',
    status_update: 'Used for application status change notifications (Admin Service)',
    application_submitted: 'Used when application is submitted',
    application_approved: 'Used when application is approved',
    application_rejected: 'Used when application is rejected',
  };

  const availableVariables = {
    otp_email: ['otp', 'email'],
    status_update: ['userName', 'status', 'oldStatus', 'message', 'notes'],
    application_submitted: ['userName', 'applicationNo'],
    application_approved: ['userName', 'applicationNo'],
    application_rejected: ['userName', 'applicationNo', 'status', 'notes'],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '✕'}</span>
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Templates Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage dynamic email templates used by the backend. Use {'${variableName}'} for dynamic content.
            <br />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Templates are synchronized with the backend database. Changes here affect emails sent to users.
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTemplates} 
            disabled={loading}
            size="sm"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </Button>
          <Button onClick={() => setShowCreateModal(true)} disabled={saving.create}>
            + Add New Template
          </Button>
        </div>
      </div>

      <ComponentCard title="Email Footer Configuration">
        <div className="space-y-6">
          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo URL
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              value={footerSettings.logoUrl}
              onChange={(e) => setFooterSettings({ ...footerSettings, logoUrl: e.target.value })}
              placeholder="/image/logo.png"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Path to logo image (relative or absolute URL)
            </p>
          </div>

          {/* Team Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Signature
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              value={footerSettings.teamSignature}
              onChange={(e) => setFooterSettings({ ...footerSettings, teamSignature: e.target.value })}
              placeholder="— Team NUvisa"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Text displayed before social media links
            </p>
          </div>

          {/* Company Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Information
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              rows={4}
              value={companyInfoText}
              onChange={(e) => setCompanyInfoText(e.target.value)}
              placeholder="Enter company information (one line per paragraph)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Each line will be a separate paragraph. HTML is supported.
            </p>
          </div>

          {/* Social Media Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Social Media Links
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Twitter URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  placeholder="https://twitter.com/nuvisa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  placeholder="https://facebook.com/nuvisa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  placeholder="https://instagram.com/nuvisa"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/nuvisa"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveFooterSettings}
              disabled={savingFooter}
            >
              {savingFooter ? 'Saving...' : 'Save Footer Settings'}
            </Button>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Email Templates">
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                These templates are synchronized with the backend database
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                The templates shown here are the exact same ones used by the backend to send emails. 
                When you edit a template, it updates the database and all future emails will use the new template. 
                Template keys must match exactly: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">otp_email</code>, 
                <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">status_update</code>, etc.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No email templates found. Templates are initialized automatically by the backend on first run.</p>
              <p className="text-xs mt-2">If templates are missing, restart the backend server to initialize them.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleTemplateExpansion(template.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          editingValues[template.id]?.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {editingValues[template.id]?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Key: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">{template.key}</code>
                        {template.description && (
                          <span className="ml-3">• {template.description}</span>
                        )}
                      </p>
                      {templateUsage[template.key] && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">🔗 Backend Usage:</span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{templateUsage[template.key]}</span>
                        </div>
                      )}
                      {availableVariables[template.key as keyof typeof availableVariables] && (
                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Available variables:</span>
                          {availableVariables[template.key as keyof typeof availableVariables].map((varName) => (
                            <code key={varName} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-mono">
                              {'${' + varName + '}'}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTemplateExpansion(template.id);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {expandedTemplates[template.id] ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedTemplates[template.id] && (
                  <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingValues[template.id]?.isActive || false}
                          onChange={(e) =>
                            setEditingValues((prev) => ({
                              ...prev,
                              [template.id]: {
                                ...prev[template.id],
                                isActive: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-gray-300 dark:border-gray-700"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    value={editingValues[template.id]?.name || ''}
                    onChange={(e) =>
                      setEditingValues((prev) => ({
                        ...prev,
                        [template.id]: {
                          ...prev[template.id],
                          name: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    value={editingValues[template.id]?.subject || ''}
                    onChange={(e) =>
                      setEditingValues((prev) => ({
                        ...prev,
                        [template.id]: {
                          ...prev[template.id],
                          subject: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Body (HTML)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    rows={10}
                    value={editingValues[template.id]?.body || ''}
                    onChange={(e) =>
                      setEditingValues((prev) => ({
                        ...prev,
                        [template.id]: {
                          ...prev[template.id],
                          body: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter email body in HTML format"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use {'${variableName}'} for dynamic content
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                    rows={3}
                    value={editingValues[template.id]?.description || ''}
                    onChange={(e) =>
                      setEditingValues((prev) => ({
                        ...prev,
                        [template.id]: {
                          ...prev[template.id],
                          description: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter description"
                  />
                </div>
              </div>

                    <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateTemplate(template.id)}
                        disabled={saving[template.id]}
                      >
                        {saving[template.id] ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate({
                          ...template,
                          subject: editingValues[template.id]?.subject || template.subject,
                          body: editingValues[template.id]?.body || template.body,
                        })}
                        disabled={saving[template.id]}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={saving[template.id]}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        Last updated: {new Date(template.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ComponentCard>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Email Template
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplate({ key: '', name: '', subject: '', body: '', description: '' });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  value={newTemplate.key}
                  onChange={(e) => setNewTemplate({ ...newTemplate, key: e.target.value })}
                  placeholder="e.g., welcome_email, payment_confirmation"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unique identifier for this template (lowercase, underscores only)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="e.g., Welcome to NUvisa"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use {'${variableName}'} for dynamic content
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Body (HTML) <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                  rows={12}
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  placeholder="<p>Hello ${userName},</p><p>Your message here...</p>"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use {'${variableName}'} for dynamic content. HTML is supported.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  rows={3}
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Brief description of when this template is used"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplate({ key: '', name: '', subject: '', body: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateTemplate}
                disabled={saving.create}
              >
                {saving.create ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Email Preview - {previewTemplate.name}
              </h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Subject:</strong> {previewTemplate.subject}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
              <div className="bg-white border border-gray-300 rounded-lg shadow-inner max-w-2xl mx-auto">
                 {/* Logo */}
                 <div className="text-center pt-10 pb-6">
                   <h1 className="text-3xl font-bold text-black">NUvisa</h1>
                 </div>
                
                {/* Email Content */}
                <div className="px-10 pb-10">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: renderEmailPreview(previewTemplate.body) 
                    }}
                  />
                </div>
                
                {/* Team Signature */}
                <div className="px-10 py-6 border-t border-gray-300">
                  <p className="text-sm text-black">— Team NUvisa</p>
                </div>
                
                {/* Social Media Icons */}
                <div className="px-10 py-5 text-center border-t border-gray-300">
                  <div className="flex justify-center gap-4">
                    <a href="#" className="w-6 h-6 bg-black rounded-full"></a>
                    <a href="#" className="w-6 h-6 bg-black rounded-full"></a>
                    <a href="#" className="w-6 h-6 bg-black rounded-full"></a>
                    <a href="#" className="w-6 h-6 bg-black rounded-full"></a>
                  </div>
                </div>
                
                {/* Copyright */}
                <div className="px-10 py-6 border-t border-gray-300">
                  <p className="text-sm text-black mb-4">
                    © {new Date().getFullYear()} NUvisa Ltd
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    If you would like to find out more about NUvisa, please reach out to us via support@nuvisa.co.uk. NUvisa Ltd (No. 08804411) is an independent visa assistance company. Registered address: 7 Westferry Circus, Canary Wharf, London, England, E14 4HD.
                  </p>
                </div>
                
                {/* Bottom Logo */}
                <div className="px-10 py-6 border-t border-gray-300 text-center">
                  <h2 className="text-sm font-normal text-gray-600">NUvisa</h2>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button onClick={() => setPreviewTemplate(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderEmailPreview(body: string): string {
  // Replace variables with sample data
  const sampleData: Record<string, string> = {
    userName: 'John Doe',
    status: 'Under Review',
    oldStatus: 'Pending',
    message: 'Your application is being processed by our team.',
    notes: 'All documents have been received and verified.',
    applicationNo: 'APP123456',
    otp: '123456',
    email: 'john.doe@example.com',
  };

  // Replace ${variableName} with sample values
  return body.replace(/\$\{(\w+)\}/g, (match, key) => {
    return sampleData[key] || match;
  });
}

