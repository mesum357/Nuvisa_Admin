"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import ComponentCard from '@/components/common/ComponentCard';
import { apiClient } from '@/lib/api-client';
import { User, Application } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor, canViewAmounts } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Utility function to process user names from various backend field formats
function processUserName(user: any): string {
  // Try different combinations of name fields
  const firstName = user.first_name || user.firstName || user.given_name || '';
  const lastName = user.last_name || user.lastName || user.family_name || '';
  const fullName = user.full_name || user.fullName || user.name || '';
  const userName = user.user_name || user.userName || '';
  
  // Priority order: first+last name, full name, user name, email
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }
  if (fullName) {
    return fullName.trim();
  }
  if (userName) {
    return userName.trim();
  }
  return user.email || 'Unknown User';
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const response = await apiClient.get<User>(`/backend/users/${params.id}`);
    if (response.success && response.data) {
      const d: any = response.data as any;
      const normalized: User = {
        id: d.id || d.userId || String(params.id),
        email: d.email,
        name: processUserName(d),
        phone: d.phone || d.phoneNumber || null,
        status: d.status || 'ACTIVE',
        isVerified: !!(d.isVerified ?? d.emailVerified ?? false),
        emailVerified: !!(d.emailVerified ?? d.isVerified ?? false),
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
      } as any;
      setUser(normalized);
    }
    setLoading(false);
  }, [params.id]);

  const fetchApplications = useCallback(async () => {
    if (!user?.email) return;
    
    setLoadingApplications(true);
    try {
      // Try multiple search strategies to find user applications
      const searchStrategies = [
        { search: user.email, limit: '50' },
        { search: user.id, limit: '50' },
        { search: user.name, limit: '50' }
      ];

      let applicationsFound = [];
      
      for (const strategy of searchStrategies) {
        try {
          const response = await apiClient.get('/backend/applications', strategy);
          if (response.success && response.data) {
            const data = (response.data as any).data || response.data;
            const list = Array.isArray(data) ? data : (data?.results || []);
            
            // Filter applications that actually belong to this user
            const userApps = list.filter((app: any) => 
              app?.user?.email === user.email || 
              app?.user?.id === user.id ||
              app?.email === user.email ||
              app?.userId === user.id
            );
            
            if (userApps.length > 0) {
              applicationsFound = userApps;
              break; // Stop at first successful search
            }
          }
        } catch (err) {
          console.warn('Search strategy failed:', strategy, err);
        }
      }
      
      setApplications(applicationsFound);
    } catch (error) {
      console.error('Error fetching user applications:', error);
      setApplications([]);
    }
    setLoadingApplications(false);
  }, [user?.email, user?.id, user?.name]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">User not found</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
        </div>
      </div>

      <ComponentCard title="Profile">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{user.email}</p>
          </div>
          {user.phone && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{user.phone}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{(user.status || '').replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verified</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{user.isVerified ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Applications">
        {loadingApplications ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading applications...</div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No applications found for this user</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Application No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  {canViewAmounts(session?.user) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {app.applicationNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(app as any).country || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {(app.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    {canViewAmounts(session?.user) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(app.totalAmount)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
