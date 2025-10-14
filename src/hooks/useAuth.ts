import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    role: (session?.user as any)?.role as UserRole | undefined,
    permissions: (session?.user as any)?.permissions as Record<string, any> | undefined,
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

export function useCan() {
  const { role, permissions } = useAuth();
  return (moduleKey: string, action: string = 'read'): boolean => {
    if (role === 'SUPER_ADMIN') return true;
    const modulePerm = (permissions as any)?.[moduleKey];
    if (!modulePerm) return false;
    return modulePerm[action] === true;
  };
}

