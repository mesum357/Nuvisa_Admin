"use client";
import React, { useEffect, useState } from "react";
import { Trash } from 'lucide-react';
import axios from 'axios';

const PopupSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [popupContent, setPopupContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const response = await axios.get('/api/popup-content');
      if (response.data.success) {
        setPopupContent(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching popup content for headers:", error);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/popup-submissions?t=${new Date().getTime()}`, {
        cache: 'no-store'
      });
      if (response.data.success) {
        setSubmissions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    fetchSubmissions();
  }, []);

  const handleDeleteSubmission = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await axios.delete(`/api/popup-submissions/${id}`);
        alert('Submission deleted successfully.');
        fetchSubmissions(); // Refresh the list
      } catch (error) {
        alert('Error deleting submission.');
        console.error("Error deleting submission:", error);
      }
    }
  };

  const getQuestionTextById = (id: string) => {
    return popupContent?.questions?.find((q: any) => q.id === id)?.text || id;
  }

  const getQuestionIdByKeyword = (keyword: string) => {
    return popupContent?.questions?.find((q: any) => q.text.toLowerCase().includes(keyword))?.id;
  };

  // Define static headers, then dynamically add question headers
  const staticHeaders = [
    { key: 'phone', label: 'Phone' },
    { key: 'uk_status', label: 'UK Status' },
    { key: 'journey_purpose', label: 'Purpose' },
    { key: 'schengen_refused', label: 'Schengen Refused' },
  ];

  const dynamicQuestionHeaders = popupContent?.questions
    .filter((q: any) => 
      !q.text.toLowerCase().includes('phone') && 
      !q.text.toLowerCase().includes('status') &&
      !q.text.toLowerCase().includes('purpose') &&
      !q.text.toLowerCase().includes('schengen')
    )
    .map((q: any) => ({
      key: q.id, // Use question ID as key for dynamic answers
      label: q.text // Use question text as label
    })) || [];

  const allHeaders = [...staticHeaders, ...dynamicQuestionHeaders];

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Popup Submissions</h2>
        <button 
          onClick={fetchSubmissions}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-sm shadow-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-meta-4 text-left">
                {allHeaders.map(header => (
                  <th key={header.key} className="py-4 px-4 font-medium text-black dark:text-white">
                    {header.label}
                  </th>
                ))}
                <th className="py-4 px-4 font-medium text-black dark:text-white">JOINED</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={allHeaders.length + 2} className="text-center py-10">Loading Data...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={allHeaders.length + 2} className="text-center py-10 text-gray-500">No submissions yet.</td></tr>
              ) : submissions.map((item: any) => (
                <tr key={item.id} className="border-t border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-gray-800">
                  {allHeaders.map(header => {
                    let value = item[header.key]; // For static fields

                    // For dynamic question answers stored in dynamicAnswers JSON
                    if (!value && item.dynamicAnswers && item.dynamicAnswers[header.key]) {
                      value = item.dynamicAnswers[header.key];
                    }

                    // Special handling for boolean values if any
                    if (typeof value === 'boolean') {
                      value = value ? 'Yes' : 'No';
                    }
                    
                    return (
                      <td key={header.key} className="py-4 px-4 text-sm text-black dark:text-white">
                        {value || "N/A"}
                      </td>
                    );
                  })}
                  <td className="py-4 px-4 text-sm text-black dark:text-white">
                    {item.joined ? new Date(item.joined).toLocaleString() : "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    <button onClick={() => handleDeleteSubmission(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PopupSubmissions;