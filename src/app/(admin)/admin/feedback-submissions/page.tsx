"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

const FeedbackSubmissionsPage = () => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<any>("/admin/feedback", { page: 1, limit: 100 });
      if (!response.success) {
        setError(response.error || "Failed to load feedback submissions.");
        return;
      }
      setFeedback(Array.isArray(response.data?.items) ? response.data.items : response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "rating", label: "Rating" },
      { key: "message", label: "Message" },
      { key: "createdAt", label: "Submitted" },
    ],
    []
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Feedback Submissions</h1>
          <p className="text-sm text-slate-500">Review visitor feedback collected from the storefront.</p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          onClick={fetchFeedback}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                    Loading feedback...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : feedback.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                    No feedback submissions found.
                  </td>
                </tr>
              ) : (
                feedback.map((item: any) => (
                  <tr key={item.id || item._id || item.email || Math.random()} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-4">{item.name || "—"}</td>
                    <td className="px-4 py-4">{item.email || "—"}</td>
                    <td className="px-4 py-4">{item.rating ?? "—"}</td>
                    <td className="px-4 py-4 max-w-xl break-words">{item.message || "—"}</td>
                    <td className="px-4 py-4">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSubmissionsPage;
