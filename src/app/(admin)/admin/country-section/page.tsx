"use client";

import React, { useEffect, useState } from 'react';
import { Edit2, Loader2, Plus, Save, X, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { CountrySection, CountrySectionCountry, CreateCountrySectionData, UpdateCountrySectionData } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

export default function CountrySectionPage() {
  const [section, setSection] = useState<CountrySection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateCountrySectionData>({
    title: 'Choose Your Country',
    description: 'We support 20 countries over all the visa centres in the UK',
    countries: [],
    isActive: true,
  });

  const fetchSection = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<CountrySection>('/country-section');
      if (response.success && response.data) {
        setSection(response.data);
        setFormData({
          title: response.data.title,
          description: response.data.description,
          countries: response.data.countries || [],
          isActive: response.data.isActive,
        });
      }
    } catch (error) {
      console.error('Error fetching country section:', error);
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
      const response = await apiClient.post<CountrySection>('/country-section', formData);
      if (response.success && response.data) {
        setSection(response.data);
        setShowModal(false);
        alert('Country section saved successfully!');
      } else {
        alert(response.error || 'Failed to save country section');
      }
    } catch (error: any) {
      console.error('Error saving country section:', error);
      alert('Error saving country section');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!section) return;
    setSaving(true);
    try {
      const response = await apiClient.patch<CountrySection>(`/country-section?id=${section.id}&action=toggle`);
      if (response.success && response.data) {
        setSection(response.data);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCountry = () => {
    setFormData(prev => ({
      ...prev,
      countries: [...prev.countries, { name: '', image: '', landmark: '', appointmentText: '' }]
    }));
  };

  const removeCountry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.filter((_, i) => i !== index)
    }));
  };

  const updateCountry = (index: number, field: keyof CountrySectionCountry, value: string) => {
    setFormData(prev => {
      const newCountries = [...prev.countries];
      newCountries[index] = { ...newCountries[index], [field]: value };
      return { ...prev, countries: newCountries };
    });
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('countryName', formData.countries[index].name || 'unknown');

      const res = await apiClient.post<{ imagePath: string }>("/upload-country-image", uploadFormData);

      if (res?.success && res.data) {
        updateCountry(index, 'image', res.data.imagePath);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Country Section Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage the title, description, and list of countries displayed in the Country Cards section.
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
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                <p className="text-gray-600 dark:text-gray-300">{section.description}</p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Countries List" desc={`${section.countries?.length || 0} countries configured`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.countries?.map((country, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="font-bold text-gray-900 dark:text-white">{country.name}</h3>
                </div>
              ))}
            </div>
          </ComponentCard>
        </div>
      ) : (
        <ComponentCard title="No Section Configured">
          <div className="text-center py-8 text-gray-500">
            Click &quot;Edit Section&quot; to create the dynamic country section.
          </div>
        </ComponentCard>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-5xl">
        <div className="space-y-6 p-5">
          <h2 className="text-xl font-bold">Edit Country Section</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Countries</h3>
              <Button onClick={addCountry} size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Add Country
              </Button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
              {formData.countries.map((country, idx) => (
                <div key={idx} className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 relative group">
                  <button
                    onClick={() => removeCountry(idx)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase text-gray-500">Name</label>
                      <input
                        type="text"
                        value={country.name}
                        onChange={(e) => updateCountry(idx, 'name', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
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
