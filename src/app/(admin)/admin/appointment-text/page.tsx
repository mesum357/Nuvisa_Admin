"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import Button from "@/components/ui/button/Button";

type AppointmentText = {
  id: string;
  countryName: string;
  appointmentText: string;
  sectionTitle: string;
  sectionDescription: string;
  createdAt: string;
  updatedAt: string;
};

// Static list of countries from the frontend
const STATIC_COUNTRIES = [
  "Germany",
  "Netherlands", 
  "Belgium",
  "France",
  "Italy",
  "Bulgaria",
  "Estonia",
  "Hungary",
  "Portugal",
  "Iceland",
  "Poland",
  "NORWAY"
];

export default function AppointmentTextPage() {
  const [appointmentTexts, setAppointmentTexts] = useState<AppointmentText[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingCountry, setEditingCountry] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [sectionContent, setSectionContent] = useState({
    title: "Choose Your Country",
    description: "We support 20 countries over all the visa centres in the UK"
  });
  const [editingSection, setEditingSection] = useState<boolean>(false);

  const fetchAppointmentTexts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: AppointmentText[] }>("/appointment-text");
      if (res?.success && Array.isArray(res.data)) {
        setAppointmentTexts(res.data);
        
        // Initialize form data with existing values
        const initialFormData: { [key: string]: string } = {};
        res.data.forEach(item => {
          initialFormData[item.countryName] = item.appointmentText;
        });
        setFormData(initialFormData);
        
        // Get section content from first record (all should have same section content)
        if (res.data.length > 0) {
          setSectionContent({
            title: res.data[0].sectionTitle || "Choose Your Country",
            description: res.data[0].sectionDescription || "We support 20 countries over all the visa centres in the UK"
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch appointment texts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointmentTexts();
  }, []);

  const handleSave = async (countryName: string) => {
    const appointmentText = formData[countryName]?.trim();
    
    if (!appointmentText) {
      alert("Appointment text cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/appointment-text", {
        countryName,
        appointmentText,
      });
      
      await fetchAppointmentTexts();
      setEditingCountry(null);
    } catch (error) {
      console.error("Failed to save appointment text:", error);
      alert("Failed to save appointment text");
    }
    setSaving(false);
  };

  const handleDelete = async (countryName: string) => {
    if (!confirm(`Are you sure you want to delete the appointment text for ${countryName}?`)) {
      return;
    }

    setSaving(true);
    try {
      await apiClient.delete(`/appointment-text?countryName=${encodeURIComponent(countryName)}`);
      await fetchAppointmentTexts();
    } catch (error) {
      console.error("Failed to delete appointment text:", error);
      alert("Failed to delete appointment text");
    }
    setSaving(false);
  };

  const getAppointmentTextForCountry = (countryName: string): string => {
    const existing = appointmentTexts.find(item => item.countryName === countryName);
    return existing ? existing.appointmentText : "Appointment in 10 days or less";
  };

  const hasCustomText = (countryName: string): boolean => {
    return appointmentTexts.some(item => item.countryName === countryName);
  };

  const handleSaveSectionContent = async () => {
    if (!sectionContent.title.trim() || !sectionContent.description.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      await apiClient.patch("/appointment-text", {
        sectionTitle: sectionContent.title,
        sectionDescription: sectionContent.description,
      });
      
      await fetchAppointmentTexts();
      setEditingSection(false);
      alert("Section content updated successfully!");
    } catch (error) {
      console.error("Failed to save section content:", error);
      alert("Failed to save section content");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Text Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage appointment text for each country. Countries with custom text will override the default.
          </p>
        </div>
      </div>

      {/* Section Content Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Section Content</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage the title and description for the "Choose Your Country" section
            </p>
          </div>
          {!editingSection && (
            <Button onClick={() => setEditingSection(true)} disabled={saving}>
              Edit Section Content
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section Title
            </label>
            {editingSection ? (
              <input
                type="text"
                value={sectionContent.title}
                onChange={(e) => setSectionContent({ ...sectionContent, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter section title"
                disabled={saving}
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                {sectionContent.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section Description
            </label>
            {editingSection ? (
              <textarea
                value={sectionContent.description}
                onChange={(e) => setSectionContent({ ...sectionContent, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter section description"
                disabled={saving}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                {sectionContent.description}
              </p>
            )}
          </div>

          {editingSection && (
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={handleSaveSectionContent} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                onClick={() => setEditingSection(false)} 
                disabled={saving}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Countries Management */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Country Appointment Texts</h2>
        {loading ? (
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading appointment texts...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATIC_COUNTRIES.map((countryName) => {
            const isEditing = editingCountry === countryName;
            const currentText = getAppointmentTextForCountry(countryName);
            const hasCustom = hasCustomText(countryName);

            return (
              <div 
                key={countryName} 
                className={`rounded-lg border p-4 space-y-3 ${
                  hasCustom 
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{countryName}</h3>
                  {hasCustom && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                      Custom
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                      value={formData[countryName] || currentText}
                      onChange={(e) => setFormData(prev => ({ ...prev, [countryName]: e.target.value }))}
                      rows={3}
                      placeholder="Enter appointment text..."
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(countryName)} 
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingCountry(null)} 
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {currentText}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => setEditingCountry(countryName)} 
                        disabled={saving}
                      >
                        Edit
                      </Button>
                      {hasCustom && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(countryName)} 
                          disabled={saving}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Default Text</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Countries without custom appointment text will display: <strong>&quot;Appointment in 10 days or less&quot;</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
