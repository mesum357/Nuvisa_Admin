/**
 * Applicant status-update email copy (Prisma fallback path).
 */

export const STATUS_UPDATE_EMAIL_SUBJECT = (applicationNo: string) =>
  `Application ${applicationNo} Status Update`;

export function buildStatusUpdateEmailHtml(
  statusLabel: string,
  statusMessage: string,
  notes?: string | null,
): string {
  const noteBlock =
    notes && String(notes).trim()
      ? `<p><strong>Note:</strong> ${String(notes).trim()}</p>`
      : '';

  return (
    `<p>Hi Applicant,</p>` +
    `<p>Your visa application status has been updated:</p>` +
    `<p><strong>New Status:</strong> ${statusLabel}</p>` +
    `<p><strong>Message:</strong> ${statusMessage}</p>` +
    noteBlock
  );
}
