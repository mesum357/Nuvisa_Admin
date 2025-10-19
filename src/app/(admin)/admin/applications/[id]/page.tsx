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
        if (v === 'submitted') return 'PENDING' as ApplicationStatus;
        if (v === 'under_review' || v === 'processing') return 'UNDER_REVIEW' as ApplicationStatus;
        if (v === 'appointment_booked') return 'APPOINTMENT_BOOKED' as ApplicationStatus;
        if (v === 'at_embassy') return 'AT_EMBASSY' as ApplicationStatus;
        if (v === 'approved') return 'APPROVED' as ApplicationStatus;
        if (v === 'completed') return 'COMPLETED' as ApplicationStatus;
        if (v === 'rejected' || v === 'cancelled') return 'REJECTED' as ApplicationStatus;
        return (v as ApplicationStatus) || ('PENDING' as ApplicationStatus);
      };
      // Calculate total payment from all travelers
      const calculateTotalPayment = (travelers: any[]) => {
        if (!Array.isArray(travelers)) return 0;
        return travelers.reduce((total, traveler) => {
          const fullPaymentAmount = Number(traveler?.fullPayment?.paymentAmount || 0);
          const insuranceAmount = Number(traveler?.insurance?.paymentAmount || 0);
          return total + fullPaymentAmount + insuranceAmount;
        }, 0);
      };

      const travelers = Array.isArray(d.travelersData) ? d.travelersData : [];
      const totalPaymentFromTravelers = calculateTotalPayment(travelers);

      // Normalize if backend payload is returned directly
      const normalized: Application = {
        id: d.id || d.applicationId || String(params.id),
        // Use formatted application number from backend, with fallback to formatting logic
        applicationNo: d.formattedApplicationId || d.applicationNo || d.code || d.id?.slice(0, 8) || String(params.id).slice(0, 8),
        status: mapBackendStatus(d.status || d.applicationStatus),
        totalAmount: totalPaymentFromTravelers || Number(d.totalAmount ?? d.amountPaidTotal ?? d.amountPaid ?? 0),
        paidAmount: totalPaymentFromTravelers || Number(d.paidAmount ?? d.amountPaidTotal ?? d.amountPaid ?? 0),
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
      // Appointment preferences (top-level or first traveler fallback)
      (normalized as any).appointment = d.appointment || (Array.isArray(d.travelersData) && d.travelersData[0]?.appointment) || undefined;

      // Normalize documents from backend shape (travelersData[].documents.documents)
      try {
        const flattenedDocs: any[] = [];
        for (let travelerIndex = 0; travelerIndex < travelers.length; travelerIndex++) {
          const traveler = travelers[travelerIndex];
          const travelerName = `${traveler?.basicDetails?.firstName || 'Traveler'} ${traveler?.basicDetails?.lastName || travelerIndex + 1}`.trim();
          const travelerId = traveler?.id || `traveler-${travelerIndex}`;
          
          const docContainer = traveler?.documents?.documents || traveler?.documents;
          if (!docContainer || typeof docContainer !== 'object') continue;
          const docTypes = Object.keys(docContainer);
          for (const docType of docTypes) {
            const value = docContainer[docType];
            const pushDoc = (item: any, docIndex: number = 0) => {
              if (!item) return;
              const fileUrl = item.preview || item.fileUrl || item.url;
              const fileName = item.name || item.fileName || docType;
              const fileSize = Number(item.size || item.fileSize || 0);
              const uploadedAt = item.uploadedAt || traveler?.createdAt || d.updatedAt || d.createdAt || new Date().toISOString();
              flattenedDocs.push({
                id: `${travelerId}-${docType}-${docIndex}-${fileName}`,
                applicationId: String(normalized.id),
                documentType: docType,
                fileName,
                fileUrl,
                fileSize,
                uploadedAt,
                isVerified: Boolean(item.isVerified),
                travelerName,
                travelerId,
                travelerIndex: travelerIndex + 1,
              });
            };
            if (Array.isArray(value)) {
              value.forEach((item, idx) => pushDoc(item, idx));
            } else if (value && typeof value === 'object') {
              pushDoc(value, 0);
            }
          }
        }
        if (flattenedDocs.length > 0) {
          (normalized as any).documents = flattenedDocs;
        }
      } catch {}
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
              {(application as any).country && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Country</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {(application as any).country}
                  </p>
                </div>
              )}
              {(application as any).visaTypeId && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Visa Type ID</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {(application as any).visaTypeId}
                  </p>
                </div>
              )}
              {(application as any).numberOfTravellers && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Number of Travelers</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {(application as any).numberOfTravellers}
                  </p>
                </div>
              )}
              {(application as any).travelStartDate && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Travel Start Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate((application as any).travelStartDate)}
                  </p>
                </div>
              )}
              {(application as any).travelEndDate && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Travel End Date</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate((application as any).travelEndDate)}
                  </p>
                </div>
              )}
              {(application as any).paymentStatus && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Status</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {(application as any).paymentStatus}
                  </p>
                </div>
              )}
              {(application as any).paymentMethod && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                    {(application as any).paymentMethod}
                  </p>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Application-Level Insurance Information */}
          {((application as any).insuranceDetails || (application as any).insurance) && (
            <ComponentCard title="Application Insurance Information">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(() => {
                  // Parse the insurance JSON string if it exists
                  let appInsurance = (application as any).insuranceDetails;
                  if ((application as any).insurance && typeof (application as any).insurance === 'string') {
                    try {
                      appInsurance = { ...appInsurance, ...JSON.parse((application as any).insurance) };
                    } catch (e) {
                      console.error('Failed to parse insurance JSON:', e);
                    }
                  } else if ((application as any).insurance) {
                    appInsurance = { ...appInsurance, ...(application as any).insurance };
                  }
                  
                  return (
                    <>
                      {appInsurance?.paidInCheckout && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Paid in Checkout:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {appInsurance.paidInCheckout.noOfInsurance} insurance(s) - ${appInsurance.paidInCheckout.paymentAmount}
                          </span>
                        </div>
                      )}
                      {appInsurance?.certificateCount !== undefined && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Certificate Count:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{appInsurance.certificateCount}</span>
                        </div>
                      )}
                      {appInsurance?.paymentAmount && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Payment Amount:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">${appInsurance.paymentAmount}</span>
                        </div>
                      )}
                      {appInsurance?.orderId && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Order ID:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{appInsurance.orderId}</span>
                        </div>
                      )}
                      {appInsurance?.insurancePaymentCompleted !== undefined && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Payment Completed:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {appInsurance.insurancePaymentCompleted ? 'Yes' : 'No'}
                          </span>
                        </div>
                      )}
                      {appInsurance?.certificate && Array.isArray(appInsurance.certificate) && appInsurance.certificate.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Certificates:</span>
                          <div className="mt-1 space-y-2">
                            {appInsurance.certificate.map((cert: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-white text-sm">
                                  Certificate {index + 1}
                                </span>
                                {cert.url && (
                                  <a 
                                    href={cert.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                                  >
                                    View/Download
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </ComponentCard>
          )}

          {/* Appointment Preferences */}
          {(application as any).appointment && (
            <ComponentCard title="Appointment Preferences">
              {(() => {
                const appt: any = (application as any).appointment || {};
                const pref1: any = appt.preference1 || {};
                const pref2: any = appt.preference2 || {};
                const formatRange = (p: any) => {
                  if (p.dateRange) return p.dateRange;
                  const start = p.dateRangeStart ? new Date(p.dateRangeStart) : null;
                  const end = p.dateRangeEnd ? new Date(p.dateRangeEnd) : null;
                  const fmt = (d: Date | null) => (d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '');
                  if (!start && !end) return '';
                  return `${fmt(start)} - ${fmt(end)}`;
                };
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Preference 1 City</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{pref1.city || '-'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Preference 1 Date Range</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{formatRange(pref1) || '-'}</p>
                      {pref1.slot && (
                        <>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Preference 1 Slot</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{pref1.slot}</p>
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Preference 2 City</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{pref2.city || '-'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Preference 2 Date Range</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{formatRange(pref2) || '-'}</p>
                      {pref2.slot && (
                        <>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Preference 2 Slot</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{pref2.slot}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </ComponentCard>
          )}

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

          {/* Traveler Information */}
          {(application as any).travelersData && Array.isArray((application as any).travelersData) && (
            <ComponentCard title="Traveler Information">
              <div className="space-y-6">
                {(application as any).travelersData.map((traveler: any, index: number) => (
                  <div key={traveler.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Traveler {index + 1}
                    </h4>
                    
                    {/* Basic Details */}
                    {traveler.basicDetails && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Basic Details</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {traveler.basicDetails.firstName && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">First Name:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.firstName}</span>
                            </div>
                          )}
                          {traveler.basicDetails.lastName && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Last Name:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.lastName}</span>
                            </div>
                          )}
                          {traveler.basicDetails.passportNumber && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Passport Number:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.passportNumber}</span>
                            </div>
                          )}
                          {traveler.basicDetails.sex && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Sex:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.sex}</span>
                            </div>
                          )}
                          {traveler.basicDetails.dateOfBirth && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Date of Birth:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.dateOfBirth}</span>
                            </div>
                          )}
                          {traveler.basicDetails.placeOfBirth && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Place of Birth:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.placeOfBirth}</span>
                            </div>
                          )}
                          {traveler.basicDetails.passportIssuePlace && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Passport Issue Place:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.passportIssuePlace}</span>
                            </div>
                          )}
                          {traveler.basicDetails.passportIssueDate && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Passport Issue Date:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.passportIssueDate}</span>
                            </div>
                          )}
                          {traveler.basicDetails.passportExpiryDate && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Passport Expiry Date:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.passportExpiryDate}</span>
                            </div>
                          )}
                          {traveler.basicDetails.currentAddress1 && (
                            <div className="col-span-2">
                              <span className="text-gray-500 dark:text-gray-400">Address Line 1:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.currentAddress1}</span>
                            </div>
                          )}
                          {traveler.basicDetails.currentAddress2 && (
                            <div className="col-span-2">
                              <span className="text-gray-500 dark:text-gray-400">Address Line 2:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.currentAddress2}</span>
                            </div>
                          )}
                          {traveler.basicDetails.state && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">State:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.state}</span>
                            </div>
                          )}
                          {traveler.basicDetails.city && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">City:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.city}</span>
                            </div>
                          )}
                          {traveler.basicDetails.pincode && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Pincode:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.pincode}</span>
                            </div>
                          )}
                          {traveler.basicDetails.mobileNumber && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Mobile Number:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.basicDetails.mobileNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Visit Details */}
                    {traveler.visitDetails && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visit Details</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {traveler.visitDetails.firstCountryOfEntry && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">First Country of Entry:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.firstCountryOfEntry}</span>
                            </div>
                          )}
                          {traveler.visitDetails.hasSchengenVisa && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Has Schengen Visa:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.hasSchengenVisa}</span>
                            </div>
                          )}
                          {traveler.visitDetails.lastVisaStartDate && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Last Visa Start Date:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.lastVisaStartDate}</span>
                            </div>
                          )}
                          {traveler.visitDetails.lastVisaEndDate && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Last Visa End Date:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.lastVisaEndDate}</span>
                            </div>
                          )}
                          {traveler.visitDetails.hasDigitalFingerprints && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Has Digital Fingerprints:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.hasDigitalFingerprints}</span>
                            </div>
                          )}
                          {traveler.visitDetails.previousVisaNumber && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Previous Visa Number:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.previousVisaNumber}</span>
                            </div>
                          )}
                          {traveler.visitDetails.maritalStatus && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Marital Status:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.maritalStatus}</span>
                            </div>
                          )}
                          {traveler.visitDetails.partnerFullName && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Partner Full Name:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.partnerFullName}</span>
                            </div>
                          )}
                          {traveler.visitDetails.partnerDateOfBirth && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Partner Date of Birth:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.partnerDateOfBirth}</span>
                            </div>
                          )}
                          {traveler.visitDetails.employmentStatus && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Employment Status:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.employmentStatus}</span>
                            </div>
                          )}
                          {traveler.visitDetails.institutionName && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Institution Name:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.institutionName}</span>
                            </div>
                          )}
                          {traveler.visitDetails.instituteEmail && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Institute Email:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.instituteEmail}</span>
                            </div>
                          )}
                          {traveler.visitDetails.instituteAddress && (
                            <div className="col-span-2">
                              <span className="text-gray-500 dark:text-gray-400">Institute Address:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.instituteAddress}</span>
                            </div>
                          )}
                          {traveler.visitDetails.employerPhone && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Employer Phone:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.employerPhone}</span>
                            </div>
                          )}
                          {traveler.visitDetails.employerName && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Employer Name:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.employerName}</span>
                            </div>
                          )}
                          {traveler.visitDetails.employerEmail && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Employer Email:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.employerEmail}</span>
                            </div>
                          )}
                          {traveler.visitDetails.employerAddress && (
                            <div className="col-span-2">
                              <span className="text-gray-500 dark:text-gray-400">Employer Address:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.employerAddress}</span>
                            </div>
                          )}
                          {traveler.visitDetails.otherEmploymentStatus && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Other Employment Status:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.otherEmploymentStatus}</span>
                            </div>
                          )}
                          {traveler.visitDetails.willAnyonePayForVisit && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Will Anyone Pay for Visit:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.willAnyonePayForVisit}</span>
                            </div>
                          )}
                          {traveler.visitDetails.fundingPersonName && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Funding Person Name:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.fundingPersonName}</span>
                            </div>
                          )}
                          {traveler.visitDetails.tripFundedBy && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Trip Funded By:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.tripFundedBy}</span>
                            </div>
                          )}
                          {traveler.visitDetails.visitingOtherSchengenCountries && Array.isArray(traveler.visitDetails.visitingOtherSchengenCountries) && traveler.visitDetails.visitingOtherSchengenCountries.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-gray-500 dark:text-gray-400">Visiting Other Schengen Countries:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.visitDetails.visitingOtherSchengenCountries.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Information */}
                    {traveler.fullPayment && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Information</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {traveler.fullPayment.paymentStatus && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Payment Status:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.fullPayment.paymentStatus}</span>
                            </div>
                          )}
                          {traveler.fullPayment.paymentCompleted !== undefined && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Payment Completed:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.fullPayment.paymentCompleted ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          {traveler.fullPayment.paymentAmount && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Payment Amount:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">${traveler.fullPayment.paymentAmount}</span>
                            </div>
                          )}
                          {traveler.fullPayment.paymentDate && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Payment Date:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{formatDate(traveler.fullPayment.paymentDate, 'datetime')}</span>
                            </div>
                          )}
                          {traveler.fullPayment.paymentMethod && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Payment Method:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.fullPayment.paymentMethod}</span>
                            </div>
                          )}
                          {traveler.fullPayment.includeInsurance !== undefined && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Include Insurance:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.fullPayment.includeInsurance ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          {traveler.fullPayment.insuranceType && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Insurance Type:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.fullPayment.insuranceType}</span>
                            </div>
                          )}
                          {traveler.fullPayment.paidInCheckout !== undefined && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Paid in Checkout:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{traveler.fullPayment.paidInCheckout ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Insurance Information */}
                    {(traveler.insurance || traveler.insuranceDetails) && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Insurance Information</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {(() => {
                            const insuranceData = traveler.insurance?.insuranceDetails;
                            
                            return (
                              <>
                                {insuranceData?.certificateUploaded !== undefined && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Certificate Uploaded:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">
                                      {insuranceData.certificateUploaded ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                )}
                                {traveler.insurance?.insuranceCertificates && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500 dark:text-gray-400">Insurance Certificate:</span>
                                    <div className="mt-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-900 dark:text-white text-sm">
                                          Insurance Certificate
                                        </span>
                                        <a 
                                          href={traveler.insurance.insuranceCertificates} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                                        >
                                          View/Download
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {insuranceData?.file && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500 dark:text-gray-400">Insurance Certificate Details:</span>
                                    <div className="mt-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-900 dark:text-white text-sm">
                                          {insuranceData.file.name || 'Insurance Certificate'}
                                        </span>
                                        <a 
                                          href={insuranceData.file.preview || insuranceData.file.data} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                                        >
                                          View/Download
                                        </a>
                                      </div>
                                      {insuranceData.file.size && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Size: {(insuranceData.file.size / 1024).toFixed(1)} KB
                                        </div>
                                      )}
                                      {insuranceData.file.uploadedAt && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Uploaded: {new Date(insuranceData.file.uploadedAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {traveler.insurance?.paymentAmount && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Payment Amount:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">${traveler.insurance.paymentAmount}</span>
                                  </div>
                                )}
                                {traveler.insurance?.orderId && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Order ID:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{traveler.insurance.orderId}</span>
                                  </div>
                                )}
                                {traveler.insurance?.insurancePaymentCompleted !== undefined && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Payment Completed:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">
                                      {traveler.insurance.insurancePaymentCompleted ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                )}
                                {traveler.insurance?.insuranceType && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Insurance Type:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{traveler.insurance.insuranceType}</span>
                                  </div>
                                )}
                                {traveler.insurance?.insurance && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Insurance Selected:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">
                                      {traveler.insurance.insurance === 'own' ? 'Own Insurance' : 
                                       traveler.insurance.insurance === 'purchase' ? 'Purchase Insurance' :
                                       traveler.insurance.insurance === 'true' ? 'Yes' : 
                                       traveler.insurance.insurance}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Step Information */}
                    {traveler.completedSteps && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Completed Steps</h5>
                        <div className="flex flex-wrap gap-2">
                          {traveler.completedSteps.map((step: string, stepIndex: number) => (
                            <span key={stepIndex} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                              {step}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ComponentCard>
          )}

          <ComponentCard title="Documents">
            {!application.documents || application.documents.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded</p>
            ) : (
              <div className="space-y-6">
                {(() => {
                  // Group documents by traveler
                  const docsByTraveler: Record<string, any[]> = {};
                  application.documents.forEach((doc: any) => {
                    const travelerKey = doc.travelerId || 'unknown';
                    if (!docsByTraveler[travelerKey]) {
                      docsByTraveler[travelerKey] = [];
                    }
                    docsByTraveler[travelerKey].push(doc);
                  });

                  return Object.entries(docsByTraveler).map(([travelerId, docs]) => {
                    const travelerName = docs[0]?.travelerName || `Traveler ${docs[0]?.travelerIndex || ''}`;
                    return (
                      <div key={travelerId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{travelerName}</h4>
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                          {docs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {doc.fileName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {doc.documentType} • {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB • Uploaded {formatDate(doc.uploadedAt, 'datetime')}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {doc.isVerified ? (
                                  <span className="text-xs text-green-600 dark:text-green-400">Verified</span>
                                ) : (
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400">Pending</span>
                                )}
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                >
                                  View
                                </a>
                                <a
                                  href={doc.fileUrl}
                                  download
                                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
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
                  <option value="PENDING">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
                  <option value="AT_EMBASSY">At Embassy</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
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

