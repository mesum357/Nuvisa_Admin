#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import seedFAQs from './prisma/seeds/faq-seed';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting FAQ module setup...');

    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Run database migration
    console.log('🗄️ Running database migration...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    // Seed FAQ data
    console.log('🌱 Seeding FAQ data...');
    await seedFAQs();

    console.log('✅ FAQ module setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Start your admin panel: npm run dev');
    console.log('2. Navigate to /admin/faqs to manage FAQs');
    console.log('3. Update your frontend API URL to point to the admin panel');
    console.log('4. Test the FAQ functionality on your frontend');

  } catch (error) {
    console.error('❌ Error setting up FAQ module:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
