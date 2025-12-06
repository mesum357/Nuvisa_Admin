import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with proper configuration for serverless environments
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// CRITICAL FIX: In serverless environments (like Vercel), we MUST ensure singleton pattern works in production
// The original code only created the singleton in non-production, causing connection pool exhaustion
// This prevents multiple PrismaClient instances which would exhaust database connections
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Gracefully disconnect on process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default prisma;

