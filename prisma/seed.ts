import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedComparisonSection } from './seeds/comparison-seed';
import { seedHeroContent } from './seeds/hero-content';
import { seedSliderContent } from './seeds/slider-content';
import { seedOccasionContent } from './seeds/occasion-seed';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  // Ensure a default Manager role with conservative permissions exists
  const managerRole = await prisma.adminRole.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Can view applications and users; limited write access',
      isSystem: true,
      permissions: {
        applications: { read: true, write: true, export: true },
        users: { read: true, write: false },
        notifications: { read: true, write: true },
        siteContent: { read: true, write: false },
        roles: { read: true, write: false },
      },
    },
  });

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@nuvisa.com' },
    update: {},
    create: {
      email: 'admin@nuvisa.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      roleId: managerRole.id,
      isActive: true,
    },
  });

  await prisma.siteContent.createMany({
    data: [
      {
        key: 'site_name',
        value: 'Nuvisa Admin',
        type: 'text',
      },
      {
        key: 'site_description',
        value: 'Comprehensive admin system for managing applications and users',
        type: 'text',
      },
      {
        key: 'contact_email',
        value: 'contact@nuvisa.com',
        type: 'text',
      },
      {
        key: 'contact_phone',
        value: '+1 (555) 123-4567',
        type: 'text',
      },
      {
        key: 'total_customers_applied',
        value: '0',
        type: 'text',
      },
      {
        key: 'appointment_slots_per_day',
        value: '10',
        type: 'text',
      },
      {
        key: 'application_fee',
        value: '100',
        type: 'text',
      },
      {
        key: 'homepage_notice',
        value: 'Welcome to Nuvisa Admin System',
        type: 'text',
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        type: 'text',
      },
      {
        key: 'urgent_alert',
        value: '',
        type: 'text',
      },
    ],
    skipDuplicates: true,
  });

  // Seed comparison section
  await seedComparisonSection();

  // Seed hero content
  await seedHeroContent();

  // Seed slider content
  await seedSliderContent();

  // Seed occasion content
  await seedOccasionContent();

  // Seed default email templates
  const emailTemplatesData = [
    {
      key: 'otp_email',
      name: 'OTP Email',
      subject: 'Your OTP Code',
      body: '<p>Hi,</p><p>Your One-Time Password (OTP) code is:</p><p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000000; background: #f5f5f5; padding: 20px; display: inline-block; border-radius: 8px; margin: 20px 0;">${otp}</p><p>This code will expire in <strong>10 minutes</strong>.</p><p>If you did not request this code, please ignore this email.</p>',
      description: 'Email template for OTP verification',
      isActive: true,
    },
    {
      key: 'status_update',
      name: 'Application Status Update',
      subject: 'Visa Application Status Update - ${status}',
      body: '<p>Hi ${userName},</p><p>Your visa application status has been updated:</p><p><strong>Previous Status:</strong> ${oldStatus || "Unknown"}</p><p><strong>New Status:</strong> ${status}</p><p><strong>Additional Notes:</strong> ${notes}</p>',
      description: 'Email template for application status updates',
      isActive: true,
    },
    {
      key: 'application_submitted',
      name: 'Application Submitted',
      subject: 'Visa Application Submitted Successfully',
      body: '<p>Hi ${userName},</p><p>Your visa application has been submitted successfully.</p><p><strong>Application Number:</strong> ${applicationNo}</p><p>We will review your application and update you on the status.</p>',
      description: 'Email template for successful application submission',
      isActive: true,
    },
    {
      key: 'application_approved',
      name: 'Application Approved',
      subject: 'Congratulations! Your Visa Application Has Been Approved',
      body: '<p>Hi ${userName},</p><p>Congratulations! Your visa application has been approved.</p><p><strong>Application Number:</strong> ${applicationNo}</p><p>Please check your account for further instructions.</p>',
      description: 'Email template for approved applications',
      isActive: true,
    },
    {
      key: 'application_rejected',
      name: 'Application Rejected',
      subject: 'Visa Application Update',
      body: '<p>Hi ${userName},</p><p>Your visa application status has been updated.</p><p><strong>Application Number:</strong> ${applicationNo}</p><p><strong>Status:</strong> ${status}</p><p><strong>Notes:</strong> ${notes}</p><p>Please contact us if you have any questions.</p>',
      description: 'Email template for rejected applications',
      isActive: true,
    },
  ];

  for (const template of emailTemplatesData) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: {},
      create: {
        ...template,
        updatedBy: admin.id,
      },
    });
  }

  // Seed default header content
  const headerContentData = [
    // Banner content (from original components)
    { key: 'banner_offer_text', value: '❤️ NEW CUSTOMER OFFER - £149 fee for your first visa with us, then £200', type: 'text', section: 'banner', order: 1 },
    { key: 'banner_button_text', value: 'Get now', type: 'text', section: 'banner', order: 2 },
    { key: 'banner_button_link', value: '/get-the-visa', type: 'url', section: 'banner', order: 3 },
    
    // Navigation content (from original components)
    { key: 'nav_tagline', value: 'Schengen visa for Indians from the UK', type: 'text', section: 'navigation', order: 1 },
    { key: 'nav_holiday_packages_text', value: 'Holiday Packages', type: 'text', section: 'navigation', order: 2 },
    { key: 'nav_holiday_packages_link', value: '#', type: 'url', section: 'navigation', order: 3 },
    { key: 'nav_get_visa_text', value: 'GET THE VISA', type: 'text', section: 'navigation', order: 4 },
    { key: 'nav_get_visa_link', value: '/get-the-visa', type: 'url', section: 'navigation', order: 5 },
    { key: 'nav_login_text', value: 'Login', type: 'text', section: 'navigation', order: 6 },
    { key: 'nav_login_link', value: '/login', type: 'url', section: 'navigation', order: 7 },
    
    // Contact content (from original components)
    { key: 'contact_phone', value: '+44 7825528764', type: 'phone', section: 'contact', order: 1 },
    { key: 'contact_email', value: 'support@nuvisa.co.uk', type: 'email', section: 'contact', order: 2 },
    
    // Additional header content from original components
    { key: 'help_text', value: 'Help', type: 'text', section: 'navigation', order: 8 },
    { key: 'whatsapp_text', value: 'Chat', type: 'text', section: 'contact', order: 3 },
    { key: 'whatsapp_number', value: '9417251840', type: 'phone', section: 'contact', order: 4 },
    { key: 'call_text', value: 'Call', type: 'text', section: 'contact', order: 5 },
    { key: 'call_number', value: '9417251840', type: 'phone', section: 'contact', order: 6 },
    { key: 'my_applications_text', value: 'My Applications', type: 'text', section: 'navigation', order: 9 },
    { key: 'my_profile_text', value: 'My Profile', type: 'text', section: 'navigation', order: 10 },
    { key: 'help_support_text', value: 'Help & Support', type: 'text', section: 'navigation', order: 11 },
    { key: 'sign_out_text', value: 'Sign Out', type: 'text', section: 'navigation', order: 12 },
  ];

  for (const content of headerContentData) {
    await prisma.headerContent.upsert({
      where: { key: content.key },
      update: {},
      create: {
        ...content,
        updatedBy: admin.id,
      },
    });
  }

  // Seed default footer content
  const footerContentData = [
    // Social media links (from original components)
    { key: 'social_twitter_url', value: '#', type: 'url', section: 'social', order: 1 },
    { key: 'social_facebook_url', value: '#', type: 'url', section: 'social', order: 2 },
    { key: 'social_instagram_url', value: '#', type: 'url', section: 'social', order: 3 },
    
    // Policy links (from original components)
    { key: 'policy_terms_text', value: 'Terms of service', type: 'text', section: 'links', order: 1 },
    { key: 'policy_terms_url', value: '#', type: 'url', section: 'links', order: 2 },
    { key: 'policy_refund_text', value: 'Refund Policy', type: 'text', section: 'links', order: 3 },
    { key: 'policy_refund_url', value: '#', type: 'url', section: 'links', order: 4 },
    { key: 'policy_privacy_text', value: 'Privacy policy', type: 'text', section: 'links', order: 5 },
    { key: 'policy_privacy_url', value: '#', type: 'url', section: 'links', order: 6 },
    
    // Company information (from original components)
    { key: 'company_copyright', value: 'Copyright © 2025 Nuvisa. - All Rights Reserved.', type: 'text', section: 'company_info', order: 1 },
    { key: 'company_description', value: 'NuVisa is an independent company that offers efficient and professional assistance in obtaining visas and other travel products online fast. The company and site are not associated with any governmental agency. VAT registration no: 412344437 | D‑U‑N‑S Number: 227538057 7. | ICO registration number: ZB732764. Registered Office: 2 Brunel Way, The Future Works, Slough, Greater London, England, SL1 1FQ | support@nuvisa.co.uk | +44 7825528764', type: 'text', section: 'company_info', order: 2 },
    
    // Additional footer content from original components
    { key: 'company_logo_alt', value: 'Icon', type: 'text', section: 'company_info', order: 3 },
    { key: 'company_logo_width', value: '130', type: 'text', section: 'company_info', order: 4 },
    { key: 'company_logo_height', value: '20', type: 'text', section: 'company_info', order: 5 },
  ];

  for (const content of footerContentData) {
    await prisma.footerContent.upsert({
      where: { key: content.key },
      update: {},
      create: {
        ...content,
        updatedBy: admin.id,
      },
    });
  }

  console.log('Database seeded successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

