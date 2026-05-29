import { backendGet } from '@/lib/backend-client';
import {
  canAccessAssignedApplication,
  isSuperAdminUser,
  type SessionUser,
} from '@/lib/application-access';

export async function loadApplicationAssignment(applicationId: string) {
  const be = await backendGet(`/orders/application/${applicationId}`);
  if (!be.ok) return null;
  const payload: any = be.data?.data?.results ?? be.data?.data ?? be.data ?? {};
  return {
    assignedAdminId: payload.assignedAdminId ?? null,
    assignedAdminEmail: payload.assignedAdminEmail ?? null,
  };
}

export async function ensureApplicationAccess(
  user: SessionUser | null | undefined,
  applicationId: string
): Promise<{ allowed: boolean; status: number }> {
  if (!user) return { allowed: false, status: 401 };
  if (isSuperAdminUser(user)) return { allowed: true, status: 200 };

  const assignment = await loadApplicationAssignment(applicationId);
  if (!assignment) return { allowed: false, status: 404 };
  if (!canAccessAssignedApplication(user, assignment)) {
    return { allowed: false, status: 403 };
  }
  return { allowed: true, status: 200 };
}
