/**
 * Applicant-facing visa application status copy for admin notification emails.
 */

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Application submitted',
  submitted: 'Application submitted',
  under_review: 'Under review',
  processing: 'Under review',
  appointment_booked: 'Appointment booked',
  at_embassy: 'At Embassy',
  decision_made: 'Decision made, passport dispatched/ready',
  approved: 'Decision made, passport dispatched/ready',
  rejected: 'Decision made, passport dispatched/ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  payment_required: 'Payment required',
};

export const APPLICATION_STATUS_MESSAGES: Record<string, string> = {
  pending: 'Your application has been received',
  submitted: 'Your application has been received',
  under_review: 'Documents are being reviewed by our team',
  processing: 'Documents are being reviewed by our team',
  appointment_booked: 'Visa appointment has been successfully scheduled',
  at_embassy: 'Application is currently at the embassy',
  decision_made: 'A final decision has been made on your application',
  approved: 'A final decision has been made on your application',
  rejected: 'A final decision has been made on your application',
  completed: 'Your visa application has been completed successfully.',
  cancelled: 'Your visa application has been cancelled.',
  payment_required: 'Additional payment is required to continue your application.',
};

export function normalizeApplicationStatusKey(status?: string): string {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

export function getApplicationStatusLabel(status?: string): string {
  const key = normalizeApplicationStatusKey(status);
  return (
    APPLICATION_STATUS_LABELS[key] ||
    String(status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

export function getApplicationStatusMessage(status?: string): string {
  const key = normalizeApplicationStatusKey(status);
  return (
    APPLICATION_STATUS_MESSAGES[key] ||
    'Your application status has been updated.'
  );
}
