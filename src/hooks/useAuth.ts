import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    role: (session?.user as any)?.role as UserRole | undefined,
  };
}

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, isLoading, isAuthenticated, role } = useAuth();

  const hasAccess = requiredRole ? role === requiredRole || role === 'SUPER_ADMIN' : isAuthenticated;

  return {
    user,
    isLoading,
    isAuthenticated,
    hasAccess,
    role,
  };
}

