"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import Button from "@/components/ui/button/Button";

type Country = {
  id: string;
  name: string;
  slug: string;
  image: string;
  landmark: string;
  visaFee: number;
  insuranceFee: number;
  appointmentText: string;
  isActive: boolean;
  displayOrder: number;
};

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState<Partial<Country>>({ isActive: true, displayOrder: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.name.localeCompare(b.name);
      }),
    [countries]
  );

  const fetchCountries = async () => {
    setLoading(true);
    const res = await apiClient.get<{ success: boolean; data: Country[] }>("/countries?includeInactive=true");
    if (res?.success && Array.isArray(res.data)) {
      setCountries(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const resetForm = () => {
    setForm({ isActive: true, displayOrder: 0 });
    setEditingId(null);
  };

  const handleEdit = (country: Country) => {
    setEditingId(country.id);
    setForm({ ...country });
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    setSaving(true);
    await apiClient.delete(`/countries?id=${id}`);
    await fetchCountries();
    setSaving(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name?.trim() ?? "",
      image: form.image?.trim() ?? "",
      landmark: form.landmark?.trim() ?? "",
      visaFee: Number(form.visaFee ?? 159),
      insuranceFee: Number(form.insuranceFee ?? 400),
      appointmentText: form.appointmentText?.trim() ?? "Appointment in 10 days or less",
      isActive: Boolean(form.isActive),
      displayOrder: Number(form.displayOrder ?? 0),
    };

    if (editingId) {
      await apiClient.patch("/countries", { id: editingId, ...payload });
    } else {
      await apiClient.post("/countries", payload);
    }

    await fetchCountries();
    setSaving(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Countries</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage destination cards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
          <h2 className="font-semibold">{editingId ? "Edit Country" : "Add Country"}</h2>

          <div className="space-y-1">
            <label className="text-sm">Name</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Image URL</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
              value={form.image ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Landmark</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
              value={form.landmark ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm">Visa Fee (£)</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
                value={form.visaFee ?? 159}
                onChange={(e) => setForm((f) => ({ ...f, visaFee: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Insurance Fee (£)</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
                value={form.insuranceFee ?? 400}
                onChange={(e) => setForm((f) => ({ ...f, insuranceFee: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Appointment Text</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
              value={form.appointmentText ?? "Appointment in 10 days or less"}
              onChange={(e) => setForm((f) => ({ ...f, appointmentText: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm">Display Order</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
                value={form.displayOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="isActive"
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(form.isActive)}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{editingId ? "Update" : "Create"}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          {loading ? (
            <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedCountries.map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="relative h-32 bg-gray-100 dark:bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{c.name}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-700">
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{c.landmark}</div>
                    <div className="text-sm">£{c.visaFee} visa, £{c.insuranceFee} insurance</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{c.appointmentText}</div>
                  </div>
                  <div className="p-3 flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(c)} disabled={saving}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(c.id)} disabled={saving}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


