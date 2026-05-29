export type SessionUser = {
  id?: string;
  email?: string;
  role?: string;
};

export function isSuperAdminUser(user: SessionUser | null | undefined): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export function canAccessAssignedApplication(
  user: SessionUser | null | undefined,
  application: {
    assignedAdminId?: string | null;
    assignedAdminEmail?: string | null;
  } | null | undefined
): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  if (!application) return false;

  const userEmail = String(user.email || '').trim().toLowerCase();
  const userId = String(user.id || '').trim();
  const assignedEmail = String(application.assignedAdminEmail || '')
    .trim()
    .toLowerCase();
  const assignedId = String(application.assignedAdminId || '').trim();

  if (assignedId && userId && assignedId === userId) return true;
  if (assignedEmail && userEmail && assignedEmail === userEmail) return true;
  return false;
}
