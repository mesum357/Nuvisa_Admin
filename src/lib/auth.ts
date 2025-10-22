import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
          include: { customRole: true },
        });

        if (!admin || !admin.isActive) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          roleId: admin.roleId,
          permissions: (admin as any).customRole?.permissions || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        (token as any).roleId = (user as any).roleId ?? null;
        (token as any).permissions = (user as any).permissions ?? null;
        return token;
      }
      // Refresh permissions on subsequent requests so role assignment applies after reload
      // Only refresh if we don't already have a role or if it's been more than 5 minutes
      try {
        const id = (token as any).id as string | undefined;
        const lastRefresh = (token as any).lastRefresh as number | undefined;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (id && (!token.role || !lastRefresh || (now - lastRefresh) > fiveMinutes)) {
          const admin = await prisma.admin.findUnique({ 
            where: { id, isActive: true }, 
            include: { customRole: true } 
          });
          
          if (admin && admin.role) {
            // Only update if we have a valid role and it's not being downgraded from SUPER_ADMIN
            if (admin.role === 'SUPER_ADMIN' || token.role !== 'SUPER_ADMIN') {
              token.role = admin.role;
              (token as any).roleId = admin.roleId ?? null;
              (token as any).permissions = (admin as any).customRole?.permissions ?? null;
              (token as any).lastRefresh = now;
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing admin role:', error);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).roleId = (token as any).roleId ?? null;
        (session.user as any).permissions = (token as any).permissions ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    signOut: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

