"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { EmailTemplate } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [socialLinks, setSocialLinks] = useState({ twitter: '', facebook: '', instagram: '', linkedin: '' });
  const [savingSocialLinks, setSavingSocialLinks] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<string, { name: string; subject: string; body: string; description: string; isActive: boolean }>>({});

  useEffect(() => {
    fetchTemplates();
    fetchLogo();
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const response = await apiClient.get('/social-links');
      if (response.success && response.data) {
        setSocialLinks({
          twitter: response.data.twitter || '',
          facebook: response.data.facebook || '',
          instagram: response.data.instagram || '',
          linkedin: response.data.linkedin || ''
        });
      }
    } catch (error) {
      console.error('Error fetching social links:', error);
    }
  };

  const handleSaveSocialLinks = async () => {
    setSavingSocialLinks(true);
    try {
      const response = await apiClient.post('/social-links', socialLinks);
      if (response.success) {
        alert('Social links updated successfully');
      } else {
        alert('Failed to update social links');
      }
    } catch (error) {
      console.error('Error updating social links:', error);
      alert('Failed to update social links');
    } finally {
      setSavingSocialLinks(false);
    }
  };

  const fetchLogo = async () => {
    try {
      const response = await apiClient.get<{ logoUrl: string }>('/upload-logo');
      if (response.success && response.data?.logoUrl) {
        setLogoUrl(response.data.logoUrl);
        setLogoPreview(response.data.logoUrl);
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data?.logoUrl) {
        setLogoUrl(result.data.logoUrl);
        setLogoPreview(result.data.logoUrl);
        alert('Logo uploaded successfully');
      } else {
        alert('Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
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
    setSaving(true);
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    const response = await apiClient.patch(`/orders/email-templates?id=${id}`, {
      name: editingValues[id].name,
      subject: editingValues[id].subject,
      body: editingValues[id].body,
      description: editingValues[id].description,
      isActive: editingValues[id].isActive,
    });

    if (response.success) {
      setEditingTemplate(null);
      await fetchTemplates();
    }
    setSaving(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;

    setSaving(true);
    const response = await apiClient.post(`/orders/email-templates/${id}`, {});

    if (response.success) {
      await fetchTemplates();
    }
    setSaving(false);
  };

  const handleCreateTemplate = async () => {
    const key = prompt('Enter template key (e.g., "status_update"):');
    if (!key) return;

    const name = prompt('Enter template name:');
    if (!name) return;

    const subject = prompt('Enter email subject:');
    if (!subject) return;

    const body = prompt('Enter email body (HTML):');
    if (!body) return;

    const description = prompt('Enter description (optional):') || '';

    setSaving(true);
    const response = await apiClient.post('/orders/email-templates', {
      key,
      name,
      subject,
      body,
      description,
    });

    if (response.success) {
      await fetchTemplates();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Templates Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage email templates with Revolut-style design
          </p>
        </div>
        <Button onClick={handleCreateTemplate} disabled={saving}>
          Add New Template
        </Button>
      </div>

      {/* Logo Configuration Section */}
      <ComponentCard title="Email Logo Configuration">
        <div className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Logo
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-gray-700 dark:file:text-gray-300
                    cursor-pointer disabled:opacity-50"
                />
                {uploadingLogo && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Upload a logo image (PNG, JPG, or WebP). Max size: 2MB
              </p>
            </div>

            {logoPreview && (
              <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  className="max-h-20 max-w-32 object-contain"
                  onError={() => setLogoPreview('')}
                />
              </div>
            )}
          </div>

          {logoUrl && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Logo URL:
              </p>
              <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                {logoUrl}
              </code>
            </div>
          )}
        </div>
      </ComponentCard>

      <ComponentCard title="Social Media Links Configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Twitter URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                placeholder="https://twitter.com/nuvisa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Facebook URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                placeholder="https://facebook.com/nuvisa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                placeholder="https://instagram.com/nuvisa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/nuvisa"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSocialLinks}
              disabled={savingSocialLinks}
            >
              {savingSocialLinks ? 'Saving...' : 'Save Social Links'}
            </Button>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Email Templates">
        <div className="space-y-6">
          {templates.map((template) => (
            <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Key: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{template.key}</code>
                  </p>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {template.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateTemplate(template.id)}
                  disabled={saving}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                  disabled={saving}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  disabled={saving}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  Last updated: {new Date(template.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ComponentCard>

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
                   {logoPreview ? (
                     <img 
                       src={logoPreview} 
                       alt="NUvisa" 
                       className="max-h-12 mx-auto object-contain"
                     />
                   ) : (
                     <h1 className="text-3xl font-bold text-black">NUvisa</h1>
                   )}
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
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="NUvisa" 
                      className="max-h-10 mx-auto opacity-70"
                    />
                  ) : (
                    <h2 className="text-sm font-normal text-gray-600">NUvisa</h2>
                  )}
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
  const sampleData = {
    userName: 'John Doe',
    status: 'Under Review',
    oldStatus: 'Pending',
    message: 'Your application is being processed by our team.',
    notes: 'All documents have been received and verified.',
    applicationNo: 'APP123456',
    otp: '123456',
  };

  // Replace ${variableName} with sample values
  return body.replace(/\$\{(\w+)\}/g, (match, key) => {
    return sampleData[key as keyof typeof sampleData] || match;
  });
}

