# SMTP Configuration Guide for support@nuvisa.co.uk

## Overview
This guide will help you configure the system to send emails from `support@nuvisa.co.uk`.

## Steps to Configure

### 1. Get SMTP Credentials from Your Email Hosting Provider

Contact your email hosting provider (where `nuvisa.co.uk` emails are hosted) to get:
- **SMTP Server Address** (e.g., `mail.nuvisa.co.uk`, `smtp.nuvisa.co.uk`)
- **SMTP Port** (usually `587` for TLS or `465` for SSL)
- **Username** (usually `support@nuvisa.co.uk`)
- **Password** (your email password or app-specific password)

### 2. Common Hosting Providers

#### cPanel/WHM Hosting
- **SMTP Host**: `mail.yourdomain.co.uk` or check cPanel
- **Port**: `587` (recommended) or `465`
- **Username**: Full email address `support@nuvisa.co.uk`
- **Password**: Email account password

#### Microsoft 365 / Outlook
- **SMTP Host**: `smtp.office365.com`
- **Port**: `587`
- **Username**: `support@nuvisa.co.uk`
- **Password**: Email password or app password
- **Enable TLS**: Yes

#### Google Workspace (if using)
- **SMTP Host**: `smtp.gmail.com`
- **Port**: `587`
- **Username**: `support@nuvisa.co.uk`
- **Password**: App-specific password (create in Admin Console)
- **Enable TLS**: Yes

#### Other Hosting Providers
Contact your provider's support or check their documentation for SMTP settings.

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (copy from `.env.example`):

```bash
# Email Configuration
SMTP_HOST="mail.nuvisa.co.uk"
SMTP_PORT="587"
SMTP_USER="support@nuvisa.co.uk"
SMTP_PASS="your-secure-password"
EMAIL_FROM="support@nuvisa.co.uk"
```

### 4. Security Best Practices

1. **Use App-Specific Passwords**: If available, create app-specific passwords instead of using your main email password
2. **Enable 2FA**: Enable two-factor authentication on your email account
3. **Keep .env Secure**: Never commit `.env` or `.env.local` files to version control
4. **Test First**: Test with a personal email first to verify SMTP settings work

### 5. Testing SMTP Configuration

You can test your SMTP configuration by:

1. Start the development server:
```bash
npm run dev
```

2. Create a test user or update an application status
3. Check if the email is sent successfully
4. Check your email logs if emails aren't being received

### 6. Common Issues & Troubleshooting

#### Issue: "Connection refused" or "Connection timeout"
- **Solution**: Check if the SMTP host and port are correct
- **Solution**: Verify your hosting provider allows SMTP connections
- **Solution**: Check if your firewall is blocking the port

#### Issue: "Authentication failed"
- **Solution**: Verify your email and password are correct
- **Solution**: Some providers require app-specific passwords
- **Solution**: Check if your email account is active

#### Issue: Emails going to spam
- **Solution**: Set up SPF, DKIM, and DMARC records for your domain
- **Solution**: Contact your hosting provider for help with email authentication
- **Solution**: Use a professional SMTP service like SendGrid or AWS SES for production

### 7. Alternative SMTP Services (Production Recommended)

For production environments, consider using dedicated email services:

#### SendGrid
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="support@nuvisa.co.uk"
```

#### AWS SES
```env
SMTP_HOST="email-smtp.region.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-aws-smtp-username"
SMTP_PASS="your-aws-smtp-password"
EMAIL_FROM="support@nuvisa.co.uk"
```

#### Mailgun
```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@mg.yourdomain.com"
SMTP_PASS="your-mailgun-password"
EMAIL_FROM="support@nuvisa.co.uk"
```

These services offer:
- Better deliverability rates
- Email tracking and analytics
- Higher sending limits
- Professional support

## Next Steps

1. Get SMTP credentials from your hosting provider
2. Update `.env.local` with the credentials
3. Test email sending functionality
4. Monitor email delivery and adjust settings as needed

## Need Help?

If you're having trouble configuring SMTP, contact:
- Your email hosting provider's support
- Your domain registrar's support
- Or consider using a professional SMTP service for reliable email delivery

