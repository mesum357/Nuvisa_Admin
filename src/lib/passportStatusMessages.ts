/**
 * Applicant-facing copy for passport final-stage statuses.
 */

export const PASSPORT_STATUS_LABELS = {
  decision_made: 'Decision Made',
  dispatched: 'Dispatched',
  ready: 'Ready',
} as const;

export const PASSPORT_STATUS_MESSAGES = {
  decision_made: 'Decision made, passport dispatched/ready',
  dispatched:
    'Your passport has been dispatched. Please allow 3–5 working days for delivery.',
  ready:
    'Your passport is ready for collection. Please visit us at your earliest convenience.',
} as const;

/** Admin UI values — all map to backend `decision_made`; do not change DB enum. */
export type PassportAdminStatusKey =
  | 'DECISION_MADE'
  | 'PASSPORT_DISPATCHED'
  | 'PASSPORT_READY';

const ADMIN_KEY_TO_VARIANT: Record<PassportAdminStatusKey, keyof typeof PASSPORT_STATUS_MESSAGES> = {
  DECISION_MADE: 'decision_made',
  PASSPORT_DISPATCHED: 'dispatched',
  PASSPORT_READY: 'ready',
};

export function resolvePassportVariant(
  statusOrKey?: string,
  statusDisplay?: string
): keyof typeof PASSPORT_STATUS_MESSAGES {
  const key = String(statusOrKey || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (key === 'PASSPORT_DISPATCHED') return 'dispatched';
  if (key === 'PASSPORT_READY') return 'ready';
  if (key === 'DECISION_MADE') return 'decision_made';

  const display = String(statusDisplay || statusOrKey || '').toLowerCase();
  if (display.includes('dispatch')) return 'dispatched';
  if (display.includes('ready') || display.includes('collection')) return 'ready';
  if (
    display.includes('decision') ||
    display === 'approved' ||
    display === 'rejected' ||
    display.includes('decision_made')
  ) {
    return 'decision_made';
  }

  return 'decision_made';
}

export function getPassportStatusLabel(
  statusOrKey?: string,
  statusDisplay?: string
): string {
  const variant = resolvePassportVariant(statusOrKey, statusDisplay);
  return PASSPORT_STATUS_LABELS[variant];
}

export function getPassportStatusMessage(
  statusOrKey?: string,
  statusDisplay?: string
): string {
  const variant = resolvePassportVariant(statusOrKey, statusDisplay);
  return PASSPORT_STATUS_MESSAGES[variant];
}

export function isPassportFinalStage(statusOrKey?: string): boolean {
  const v = String(statusOrKey || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const key = String(statusOrKey || '').toUpperCase();
  return (
    v === 'decision_made' ||
    v === 'approved' ||
    v === 'rejected' ||
    key === 'DECISION_MADE' ||
    key === 'PASSPORT_DISPATCHED' ||
    key === 'PASSPORT_READY'
  );
}

export function getPassportAdminStatusKeyFromBackend(
  status?: string,
  statusDisplay?: string
): PassportAdminStatusKey {
  const variant = resolvePassportVariant(status, statusDisplay);
  if (variant === 'dispatched') return 'PASSPORT_DISPATCHED';
  if (variant === 'ready') return 'PASSPORT_READY';
  return 'DECISION_MADE';
}

/** Prisma ApplicationStatus enum — passport variants collapse to DECISION_MADE. */
export function mapAdminStatusKeyToPrisma(status?: string): string {
  const key = String(status || '').toUpperCase();
  if (
    key === 'PASSPORT_DISPATCHED' ||
    key === 'PASSPORT_READY' ||
    key === 'APPROVED' ||
    key === 'REJECTED'
  ) {
    return 'DECISION_MADE';
  }
  return key || 'PENDING';
}

export function mapAdminStatusKeyToBackend(status?: string): string | undefined {
  if (!status) return undefined;
  const key = status.toUpperCase();
  if (
    key === 'DECISION_MADE' ||
    key === 'PASSPORT_DISPATCHED' ||
    key === 'PASSPORT_READY' ||
    key === 'APPROVED' ||
    key === 'REJECTED'
  ) {
    return 'decision_made';
  }
  const map: Record<string, string> = {
    PENDING: 'submitted',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    APPOINTMENT_BOOKED: 'appointment_booked',
    AT_EMBASSY: 'at_embassy',
    COMPLETED: 'completed',
  };
  return map[key] || status.toLowerCase();
}

export function getAdminStatusLabelForKey(key: PassportAdminStatusKey): string {
  const variant = ADMIN_KEY_TO_VARIANT[key];
  return PASSPORT_STATUS_LABELS[variant];
}
