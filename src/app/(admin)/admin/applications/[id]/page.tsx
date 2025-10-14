"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Application, ApplicationStatus } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import Button from '@/components/ui/button/Button';
import ComponentCard from '@/components/common/ComponentCard';
import { ArrowLeft } from 'lucide-react';

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [comment, setComment] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    const response = await apiClient.get<Application>(`/applications/${params.id}`);
    if (response.success && response.data) {
      const envelope: any = response.data as any;
      const d: any = envelope?.results ?? envelope; // unwrap backend { data: { results } } shape

      const mapBackendStatus = (s?: string): ApplicationStatus => {
        const v = (s || '').toLowerCase();
        if (v === 'new' || v === 'draft') return 'PENDING' as ApplicationStatus;
        if (v === 'submitted' || v === 'under_review' || v === 'processing') return 'UNDER_REVIEW' as ApplicationStatus;
        if (v === 'approved') return 'APPROVED' as ApplicationStatus;
        if (v === 'completed') return 'COMPLETED' as ApplicationStatus;
        if (v === 'rejected' || v === 'cancelled') return 'REJECTED' as ApplicationStatus;
        return (v as ApplicationStatus) || ('PENDING' as ApplicationStatus);
      };
      // Normalize if backend payload is returned directly
      const normalized: Application = {
        id: d.id || d.applicationId || String(params.id),
        applicationNo: d.applicationNo || d.code || d.orderId || d.id,
        status: mapBackendStatus(d.status || d.applicationStatus),
        totalAmount: Number(d.totalAmount ?? d.amountPaid ?? d.amountPaidTotal ?? 0),
        paidAmount: Number(d.paidAmount ?? d.amountPaid ?? d.amountPaidTotal ?? 0),
        submittedAt: d.submittedAt || d.createdAt || d.paymentDate || new Date().toISOString(),
        user: d.user || { id: d.email, name: d.email, email: d.email },
      } as any;
      // Attach additional backend fields for UI display
      (normalized as any).country = d.country;
      (normalized as any).travelStartDate = d.travelStartDate;
      (normalized as any).travelEndDate = d.travelEndDate;
      (normalized as any).paymentStatus = d.paymentStatus;
      (normalized as any).paymentMethod = d.paymentMethod;
      (normalized as any).visaTypeId = d.visaTypeId || d.selectedVisaType;
      (normalized as any).numberOfTravellers = d.numberOfTravellers;
      (normalized as any).insuranceDetails = d.insuranceDetails;
      (normalized as any).travelersData = d.travelersData;
      setApplication(normalized as any);
      setNewStatus(normalized.status);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleStatusUpdate = useCallback(async () => {
    if (!newStatus || newStatus === application?.status) return;

    setUpdating(true);
    const response = await apiClient.patch(`/applications/${params.id}`, {
      status: newStatus,
      note: comment,
      sendNotification,
    });

    if (response.success) {
      await fetchApplication();
      setComment('');
    }
    setUpdating(false);
  }, [newStatus, application?.status, params.id, comment, sendNotification, fetchApplication]);

  const handleAddComment = useCallback(async () => {
    if (!comment.trim()) return;

    const response = await apiClient.post(`/applications/${params.id}/comments`, {
      comment,
      isInternal: true,
    });

    if (response.success) {
      await fetchApplication();
      setComment('');
    }
  }, [comment, params.id, fetchApplication]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Application not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Application Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {application.applicationNo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ComponentCard title="Application Information">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Application Number</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {application.applicationNo}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(
                    application.status
                  )}`}
                >
                  {(application.status || '').replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {formatCurrency(application.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paid Amount</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {formatCurrency(application.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted At</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {formatDate(application.submittedAt, 'datetime')}
                </p>
              </div>
              {application.appointmentDate && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Appointment</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate(application.appointmentDate)} - {application.appointmentSlot}
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>

          <ComponentCard title="User Information">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {application.user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {application.user?.email}
                </p>
              </div>
              {application.user?.phone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {application.user.phone}
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>

          {application.comments && application.comments.length > 0 && (
            <ComponentCard title="Comments & Notes">
              <div className="space-y-4">
                {application.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-brand-500 pl-4 py-2">
                    <p className="text-sm text-gray-900 dark:text-white">{comment.comment}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(comment.createdAt, 'datetime')}
                    </p>
                  </div>
                ))}
              </div>
            </ComponentCard>
          )}
        </div>

        <div className="space-y-6">
          <ComponentCard title="Update Status">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note (optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a note about this status change..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendNotification"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="sendNotification" className="text-sm text-gray-700 dark:text-gray-300">
                  Send email notification to user
                </label>
              </div>

              <Button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === application.status}
                className="w-full"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Add Comment">
            <div className="space-y-4">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add an internal note..."
              />
              <Button onClick={handleAddComment} className="w-full" variant="outline">
                Add Comment
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}

