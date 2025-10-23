import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedComparisonSection } from './seeds/comparison-seed';

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

