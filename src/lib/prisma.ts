import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (
        error?.code === 'P2002' || // Unique constraint violation
        error?.code === 'P2025' || // Record not found
        error?.code === 'P2014'    // Required relation violation
      ) {
        throw error;
      }
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Check database connection health
async function checkConnectionHealth(prismaClient: PrismaClient): Promise<boolean> {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection health check failed:', error);
    return false;
  }
}

// Create Prisma client with proper configuration for serverless environments
// FIXED: Removed incorrect datasources parameter - Prisma reads DATABASE_URL from env automatically
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration is handled via DATABASE_URL query parameters
    // Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20&connect_timeout=10
  });

// CRITICAL FIX: In serverless environments (like Vercel), we MUST ensure singleton pattern works in production
// This prevents multiple PrismaClient instances which would exhaust database connections
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
  
  // Perform initial connection health check
  checkConnectionHealth(prisma).catch((error) => {
    console.error('Initial database connection check failed:', error);
  });
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

// Enhanced Prisma client with retry logic
export const prismaWithRetry = {
  ...prisma,
  // Wrap common operations with retry logic
  $queryRaw: async (...args: Parameters<typeof prisma.$queryRaw>) => {
    return retryWithBackoff(() => prisma.$queryRaw(...args));
  },
  $executeRaw: async (...args: Parameters<typeof prisma.$executeRaw>) => {
    return retryWithBackoff(() => prisma.$executeRaw(...args));
  },
  // Add health check method
  $checkHealth: () => checkConnectionHealth(prisma),
};

// Export retry utility for use in API routes
export { retryWithBackoff, checkConnectionHealth };

export default prisma;

