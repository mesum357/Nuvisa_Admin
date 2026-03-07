"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  visaPricingService,
  VisaPricingListResponse,
} from "@/lib/services/visa-pricing-service";
import {
  CreateVisaPricingData,
  UpdateVisaPricingData,
  VisaPricing,
} from "@/types";

type NotificationState = {
  type: "success" | "error";
  message: string;
} | null;

type FormErrors = {
  name?: string;
  basePrice?: string;
  strikeOutPrice?: string;
};

type VisaPricingFormState = {
  name: string;
  basePrice: string;
  strikeOutPrice: string;
  reason: string;
  showReason: boolean;
};

const defaultFormState: VisaPricingFormState = {
  name: "",
  basePrice: "",
  strikeOutPrice: "",
  reason: "",
  showReason: false,
};

const toNumber = (value: string): number => Number(value.trim());

function normalizeVisaPricing(item: unknown): VisaPricing {
  const raw = (item || {}) as Record<string, unknown>;
  return {
    id: String(raw.id || ""),
    name: String(raw.name || ""),
    basePrice: Number(raw.basePrice ?? raw.base_price ?? 0),
    strikeOutPrice: Number(raw.strikeOutPrice ?? raw.strike_out_price ?? 0),
    reason: (raw.reason as string | null | undefined) ?? null,
    showReason: Boolean(raw.showReason ?? raw.show_reason ?? false),
  };
}

function validateForm(formData: VisaPricingFormState): FormErrors {
  const errors: FormErrors = {};

  if (!formData.name.trim()) {
    errors.name = "Name is required";
  }

  if (formData.basePrice.trim() === "") {
    errors.basePrice = "Base price is required";
  } else if (Number.isNaN(toNumber(formData.basePrice)) || toNumber(formData.basePrice) < 0) {
    errors.basePrice = "Base price must be a non-negative number";
  }

  if (formData.strikeOutPrice.trim() === "") {
    errors.strikeOutPrice = "Strike-out price is required";
  } else if (
    Number.isNaN(toNumber(formData.strikeOutPrice)) ||
    toNumber(formData.strikeOutPrice) < 0
  ) {
    errors.strikeOutPrice = "Strike-out price must be a non-negative number";
  }

  return errors;
}

function buildCreatePayload(formData: VisaPricingFormState): CreateVisaPricingData {
  return {
    name: formData.name.trim(),
    basePrice: toNumber(formData.basePrice),
    strikeOutPrice: toNumber(formData.strikeOutPrice),
    reason: formData.reason.trim() || undefined,
    showReason: formData.showReason,
  };
}

function buildUpdatePayload(
  formData: VisaPricingFormState,
  initialData: VisaPricing
): UpdateVisaPricingData {
  const payload: UpdateVisaPricingData = {};

  const trimmedName = formData.name.trim();
  const trimmedReason = formData.reason.trim();
  const parsedBasePrice = toNumber(formData.basePrice);
  const parsedStrikeOutPrice = toNumber(formData.strikeOutPrice);

  if (trimmedName !== initialData.name) payload.name = trimmedName;
  if (parsedBasePrice !== initialData.basePrice) payload.basePrice = parsedBasePrice;
  if (parsedStrikeOutPrice !== initialData.strikeOutPrice) payload.strikeOutPrice = parsedStrikeOutPrice;
  if ((initialData.reason || "") !== trimmedReason) payload.reason = trimmedReason;
  if (Boolean(initialData.showReason) !== formData.showReason) payload.showReason = formData.showReason;

  return payload;
}

export default function VisaPricingPage() {
  const [records, setRecords] = useState<VisaPricing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [notification, setNotification] = useState<NotificationState>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<VisaPricing | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<VisaPricing | null>(null);

  const [formData, setFormData] = useState<VisaPricingFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await visaPricingService.list();

    if (response.success && response.data) {
      const payload = response.data as VisaPricingListResponse;
      const rows = Array.isArray(payload.results) ? payload.results : [];
      setRecords(rows.map(normalizeVisaPricing));
    } else {
      setError(response.error || "Failed to load visa pricing records");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) => record.name.toLowerCase().includes(query));
  }, [records, search]);

  const resetForm = () => {
    setFormData(defaultFormState);
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [`edit-${id}`]: true }));
    try {
      const response = await visaPricingService.getById(id);
      if (!response.success || !response.data) {
        showNotification("error", response.error || "Failed to load visa pricing details");
        return;
      }

      const normalized = normalizeVisaPricing(response.data);
      setEditingRecord(normalized);
      setFormData({
        name: normalized.name,
        basePrice: String(normalized.basePrice),
        strikeOutPrice: String(normalized.strikeOutPrice),
        reason: normalized.reason || "",
        showReason: Boolean(normalized.showReason),
      });
      setFormErrors({});
      setIsFormModalOpen(true);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`edit-${id}`]: false }));
    }
  };

  const handleSubmitForm = async () => {
    if (submitting) return;

    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification("error", "Please fix form validation errors");
      return;
    }

    setSubmitting(true);
    try {
      if (editingRecord) {
        const updatePayload = buildUpdatePayload(formData, editingRecord);
        if (Object.keys(updatePayload).length === 0) {
          showNotification("success", "No changes detected");
          setIsFormModalOpen(false);
          return;
        }

        const response = await visaPricingService.update(editingRecord.id, updatePayload);
        if (!response.success) {
          showNotification("error", response.error || "Failed to update visa pricing");
          return;
        }

        showNotification("success", "Visa pricing updated successfully");
      } else {
        const response = await visaPricingService.create(buildCreatePayload(formData));
        if (!response.success) {
          showNotification("error", response.error || "Failed to create visa pricing");
          return;
        }

        showNotification("success", "Visa pricing created successfully");
      }

      setIsFormModalOpen(false);
      resetForm();
      await fetchRecords();
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (record: VisaPricing) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete || deletingId) return;

    setDeletingId(recordToDelete.id);
    const response = await visaPricingService.remove(recordToDelete.id);

    if (!response.success) {
      showNotification("error", response.error || "Failed to delete visa pricing");
      setDeletingId("");
      return;
    }

    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
    setDeletingId("");
    showNotification("success", "Visa pricing deleted successfully");
    await fetchRecords();
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-white shadow-lg ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visa Pricing</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage visa pricing records and display settings.
          </p>
        </div>
        <Button onClick={openCreateModal} startIcon={<Plus className="h-4 w-4" />}>
          Add Visa Pricing
        </Button>
      </div>

      <ComponentCard title="Visa Pricing Records">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Base Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Strike-out Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Show Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading visa pricing records...
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No visa pricing records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {record.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{record.basePrice}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {record.strikeOutPrice}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {record.reason || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {record.showReason ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
                            onClick={() => openEditModal(record.id)}
                            disabled={actionLoading[`edit-${record.id}`]}
                            title="Edit"
                          >
                            {actionLoading[`edit-${record.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="text-red-600 transition hover:text-red-700 dark:text-red-400"
                            onClick={() => openDeleteModal(record)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsFormModalOpen(false);
          }
        }}
        className="mx-4 max-w-2xl p-6 lg:p-8"
      >
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          {editingRecord ? "Edit Visa Pricing" : "Create Visa Pricing"}
        </h2>

        {editingRecord && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <span className="font-semibold">ID:</span> {editingRecord.id}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Base Price *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.basePrice}
              onChange={(event) => setFormData((prev) => ({ ...prev, basePrice: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {formErrors.basePrice && (
              <p className="mt-1 text-xs text-red-500">{formErrors.basePrice}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Strike-out Price *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.strikeOutPrice}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, strikeOutPrice: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {formErrors.strikeOutPrice && (
              <p className="mt-1 text-xs text-red-500">{formErrors.strikeOutPrice}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.showReason}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, showReason: event.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Show reason
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsFormModalOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmitForm} disabled={submitting}>
            {submitting ? "Saving..." : editingRecord ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deletingId) {
            setIsDeleteModalOpen(false);
            setRecordToDelete(null);
          }
        }}
        className="mx-4 max-w-lg p-6 lg:p-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Visa Pricing</h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{recordToDelete?.name || "this record"}</span>? This action
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setRecordToDelete(null);
            }}
            disabled={Boolean(deletingId)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={Boolean(deletingId)}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
          >
            {deletingId ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
