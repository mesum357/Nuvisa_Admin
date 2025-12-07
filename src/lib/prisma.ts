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
      
      // Retry on connection errors (P1001, P1002, P1008, P1017)
      const isConnectionError = 
        error?.code === 'P1001' || // Can't reach database server
        error?.code === 'P1002' || // Database server closed the connection
        error?.code === 'P1008' || // Operations timed out
        error?.code === 'P1017';   // Server has closed the connection
      
      // If it's a connection error and not the last attempt, try to reconnect
      if (isConnectionError && attempt < maxRetries) {
        try {
          // Attempt to reconnect by disconnecting and reconnecting
          await prisma.$disconnect().catch(() => {});
          // Small delay before reconnecting
          await new Promise(resolve => setTimeout(resolve, 50));
          await prisma.$connect().catch(() => {});
        } catch (reconnectError) {
          // Ignore reconnect errors, will retry the operation
        }
      }
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff (longer for connection errors)
      const baseDelay = isConnectionError ? initialDelay * 2 : initialDelay;
      const delay = baseDelay * Math.pow(2, attempt);
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

// Ensure database connection is active, reconnect if needed
async function ensureConnection(prismaClient: PrismaClient): Promise<void> {
  try {
    // Quick health check
    await prismaClient.$queryRaw`SELECT 1`;
  } catch (error: any) {
    // If connection is broken, try to reconnect
    const isConnectionError = 
      error?.code === 'P1001' || 
      error?.code === 'P1002' || 
      error?.code === 'P1008' || 
      error?.code === 'P1017';
    
    if (isConnectionError) {
      try {
        // Disconnect and reconnect
        await prismaClient.$disconnect().catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 100));
        await prismaClient.$connect();
      } catch (reconnectError) {
        // If reconnect fails, throw original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

// Create Prisma client with proper configuration for serverless environments
// FIXED: Removed incorrect datasources parameter - Prisma reads DATABASE_URL from env automatically
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration is handled via DATABASE_URL query parameters
    // Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20&connect_timeout=10&pgbouncer=true
    // For Supabase pooler, ensure pgbouncer=true is in the connection string
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
    await ensureConnection(prisma);
    return retryWithBackoff(() => prisma.$queryRaw(...args));
  },
  $executeRaw: async (...args: Parameters<typeof prisma.$executeRaw>) => {
    await ensureConnection(prisma);
    return retryWithBackoff(() => prisma.$executeRaw(...args));
  },
  // Add health check method
  $checkHealth: () => checkConnectionHealth(prisma),
  // Add ensure connection method
  $ensureConnection: () => ensureConnection(prisma),
};

// Export retry utility for use in API routes
export { retryWithBackoff, checkConnectionHealth, ensureConnection };

export default prisma;

