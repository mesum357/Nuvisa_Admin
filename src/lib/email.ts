import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Get port and determine connection type
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const useSSL = smtpPort === 465; // Port 465 uses SSL, port 587 uses STARTTLS

// Create transporter configuration
const transporterConfig: any = {
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: useSSL, // true for SSL (port 465), false for STARTTLS (port 587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Do not fail on invalid certificates (some SMTP servers use self-signed certs)
    rejectUnauthorized: false,
  },
};

// Only add requireTLS for STARTTLS connections (port 587)
if (!useSSL) {
  transporterConfig.requireTLS = true;
}

const transporter = nodemailer.createTransport(transporterConfig);

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const fromEmail = process.env.EMAIL_FROM || 'support@nuvisa.co.uk';
    await transporter.sendMail({
      from: `NUvisa Support <${fromEmail}>`,
      replyTo: fromEmail,
      to,
      subject,
      html,
      text: text || '',
    });
    return true;
  } catch (_error) {
    return false;
  }
}

export function getApplicationStatusEmailTemplate(
  userName: string,
  applicationNo: string,
  status: string,
  message?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9fafb; }
          .status { padding: 15px; margin: 20px 0; border-radius: 8px; font-weight: bold; }
          .status.approved { background-color: #d1fae5; color: #065f46; }
          .status.rejected { background-color: #fee2e2; color: #991b1b; }
          .status.under-review { background-color: #dbeafe; color: #1e40af; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Your application <strong>${applicationNo}</strong> status has been updated.</p>
            <div class="status ${(status || '').toLowerCase().replace('_', '-')}">
              Status: ${(status || '').replace('_', ' ')}
            </div>
            ${message ? `<p>${message}</p>` : ''}
            <p>You can log in to your account to view more details.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>© 2025 Nuvisa Admin. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getWelcomeEmailTemplate(userName: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Nuvisa!</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Welcome to Nuvisa Admin System! Your account has been successfully created.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p>You can now log in to your account and start managing your applications.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/signin" class="button">Log In</a>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 Nuvisa Admin. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

