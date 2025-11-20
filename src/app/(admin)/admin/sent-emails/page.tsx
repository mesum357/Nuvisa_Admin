"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';

interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  body: string;
  htmlContent: string;
  templateKey: string | null;
  templateName: string | null;
  templateVariables: any;
  applicationId: string | null;
  userId: string | null;
  status: string;
  errorMessage: string | null;
  messageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SentEmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    templateKey: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchEmails();
  }, [pagination.page]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.templateKey && { templateKey: filters.templateKey }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await apiClient.get<{
        emails: EmailLog[];
        pagination: typeof pagination;
      }>(`/orders/email-logs?${params.toString()}`);

      if (response.success && response.data) {
        setEmails(response.data.emails);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (email: EmailLog) => {
    setSelectedEmail(email);
    setShowPreview(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <ComponentCard title="Sent Emails">
        <div className="mb-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by email, subject, name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPagination({ ...pagination, page: 1 });
                  fetchEmails();
                }
              }}
              className="px-4 py-2 border rounded"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="px-4 py-2 border rounded"
              placeholder="From Date"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="px-4 py-2 border rounded"
              placeholder="To Date"
            />
            <Button onClick={() => {
              setPagination({ ...pagination, page: 1 });
              fetchEmails();
            }}>Apply Filters</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No emails found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emails.map((email) => (
                    <tr key={email.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {email.recipientEmail}
                        </div>
                        {email.recipientName && (
                          <div className="text-sm text-gray-500">{email.recipientName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{email.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {email.templateName || email.templateKey || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(email.status)}
                        {email.errorMessage && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={email.errorMessage}>
                            {email.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(email.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handlePreview(email)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} emails
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const newPage = pagination.page - 1;
                    setPagination({ ...pagination, page: newPage });
                  }}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => {
                    const newPage = pagination.page + 1;
                    setPagination({ ...pagination, page: newPage });
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </ComponentCard>

      {/* Email Preview Modal */}
      {showPreview && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Email Preview</h2>
              <Button onClick={() => setShowPreview(false)}>Close</Button>
            </div>
            <div className="space-y-4">
              <div>
                <strong>To:</strong> {selectedEmail.recipientEmail}
                {selectedEmail.recipientName && ` (${selectedEmail.recipientName})`}
              </div>
              <div>
                <strong>Subject:</strong> {selectedEmail.subject}
              </div>
              <div>
                <strong>Status:</strong> {getStatusBadge(selectedEmail.status)}
              </div>
              <div>
                <strong>Sent At:</strong> {formatDate(selectedEmail.createdAt)}
              </div>
              {selectedEmail.templateName && (
                <div>
                  <strong>Template:</strong> {selectedEmail.templateName}
                </div>
              )}
              {selectedEmail.messageId && (
                <div>
                  <strong>Message ID:</strong> {selectedEmail.messageId}
                </div>
              )}
              {selectedEmail.errorMessage && (
                <div className="text-red-600">
                  <strong>Error:</strong> {selectedEmail.errorMessage}
                </div>
              )}
              <div className="border-t pt-4">
                <strong>Email Content:</strong>
                <div
                  className="mt-2 p-4 bg-gray-50 rounded border"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

