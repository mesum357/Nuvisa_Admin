"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Edit2, Loader2, Plus, Save, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { VisaCountry, CreateVisaCountryData, UpdateVisaCountryData } from '@/types';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import Image from 'next/image';

export default function VisaCountriesPage() {
  const [countries, setCountries] = useState<VisaCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState("");
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<VisaCountry | null>(null);
  
  const [formData, setFormData] = useState<CreateVisaCountryData>({
    name: '',
    image: '',
    price_from: '',
    isActive: true,
  });

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<VisaCountry[]>('/visa-countries');
      if (response.success && response.data) {
        setCountries(response.data);
      }
    } catch (error) {
      console.error('Error fetching visa countries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleSave = async () => {
    if (!formData.name) {
      alert('Country name is required');
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editingCountry) {
        response = await apiClient.patch<VisaCountry>(`/visa-countries?id=${editingCountry.id}`, formData);
      } else {
        response = await apiClient.post<VisaCountry>('/visa-countries', formData);
      }

      if (response.success) {
        await fetchCountries();
        setShowModal(false);
        setEditingCountry(null);
        setFormData({ name: '', image: '', price_from: '', isActive: true });
      } else {
        alert(response.error || 'Failed to save country');
      }
    } catch (error: any) {
      console.error('Error saving country:', error);
      alert('Error saving country');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this country?')) return;
    
    try {
      const response = await apiClient.delete(`/visa-countries?id=${id}`);
      if (response.success) {
        await fetchCountries();
      } else {
        alert(response.error || 'Failed to delete country');
      }
    } catch (error) {
      console.error('Error deleting country:', error);
    }
  };

  const handleToggleStatus = async (country: VisaCountry) => {
    try {
      const response = await apiClient.patch<VisaCountry>(`/visa-countries?id=${country.id}`, {
        isActive: !country.isActive
      });
      if (response.success) {
        await fetchCountries();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleEdit = (country: VisaCountry) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      image: country.image || '',
      price_from: country.price_from || '',
      isActive: country.isActive,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('countryName', formData.name || 'unknown');

      const res = await apiClient.post<{ imagePath: string }>("/upload-country-image", uploadFormData);

      if (res?.success && res?.data) {
        setFormData(prev => ({ ...prev, image: (res.data as any).imagePath }));
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    }
  };

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searching.toLowerCase())
  );

  if (loading && countries.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visa Countries Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage the master list of countries available for visa services.
          </p>
        </div>
        <Button onClick={() => {
          setEditingCountry(null);
          setFormData({ name: '', image: '', price_from: '', isActive: true });
          setShowModal(true);
        }} size="sm">
          <Plus className="h-4 w-4" />
          Add Country
        </Button>
      </div>

      <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
        <Search className="h-5 w-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search countries..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
          value={searching}
          onChange={(e) => setSearching(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCountries.map((country) => (
          <div key={country.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative h-40 w-full bg-gray-100 dark:bg-gray-900">
              {country.image ? (
                <Image src={country.image} alt={country.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
              )}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${country.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {country.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{country.name}</h3>
              {country.price_from && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{country.price_from}</p>
              )}
              {!country.price_from && <div className="mb-4" />}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(country)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleToggleStatus(country)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    {country.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button onClick={() => handleDelete(country.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} className="max-w-md">
        <div className="space-y-6 p-5">
          <h2 className="text-xl font-bold">{editingCountry ? 'Edit Country' : 'Add New Country'}</h2>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Country Name</label>
              <input
                type="text"
                placeholder="e.g. Germany"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Country Image</label>
              <div className="flex flex-col gap-2">
                {formData.image && (
                  <div className="relative h-32 w-full rounded-md overflow-hidden border">
                    <Image src={formData.image} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Price From</label>
              <input
                type="text"
                placeholder="e.g. From £99"
                value={formData.price_from || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price_from: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 border-gray-300 rounded text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium">Active and visible on site</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button onClick={() => setShowModal(false)} variant="outline">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingCountry ? 'Update Country' : 'Create Country'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
