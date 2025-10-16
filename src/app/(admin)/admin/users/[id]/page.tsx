"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import ComponentCard from '@/components/common/ComponentCard';
import { apiClient } from '@/lib/api-client';
import { User } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const response = await apiClient.get<User>(`/backend/users/${params.id}`);
    if (response.success && response.data) {
      const d: any = response.data as any;
      const normalized: User = {
        id: d.id || d.userId || String(params.id),
        email: d.email,
        name: d.name || d.fullName || d.email,
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

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
            <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{String(user.status).replace('_', ' ')}</p>
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
    </div>
  );
}


