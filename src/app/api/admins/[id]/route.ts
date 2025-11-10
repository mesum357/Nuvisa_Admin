import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, email, password, isActive, roleId } = body || {};
    const { id } = await params;
    const currentUserId = (session.user as any)?.id;
    const currentUserRole = (session.user as any)?.role;
    const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
    const isEditingSelf = currentUserId === id;

    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    
    // Allow Super Admin to edit their own details
    if (isSuperAdmin && isEditingSelf && target.role === 'SUPER_ADMIN') {
      const updateData: any = {};
      
      if (typeof name === 'string' && name.trim()) {
        updateData.name = name.trim();
      }
      
      if (typeof email === 'string' && email.trim()) {
        // Check if email is already taken by another admin
        const existingAdmin = await prisma.admin.findUnique({ where: { email: email.trim() } });
        if (existingAdmin && existingAdmin.id !== id) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }
        updateData.email = email.trim();
      }

      if (typeof password === 'string' && password.trim()) {
        // Hash the new password
        updateData.password = await hashPassword(password);
      }

      const updated = await prisma.admin.update({
        where: { id },
        data: updateData,
        include: { customRole: true },
      });

      return NextResponse.json({ success: true, data: updated });
    }
    
    // Prevent disabling SUPER_ADMIN accounts
    if (target.role === 'SUPER_ADMIN' && isActive === false) {
      return NextResponse.json({ error: 'Cannot disable SUPER_ADMIN account' }, { status: 400 });
    }
    
    // Prevent modifying SUPER_ADMIN role assignments
    if (target.role === 'SUPER_ADMIN' && roleId !== undefined) {
      return NextResponse.json({ error: 'Cannot modify SUPER_ADMIN role' }, { status: 400 });
    }

    if (roleId) {
      const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
      if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: {
        name: typeof name === 'string' ? name : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        roleId: typeof roleId === 'string' ? roleId : roleId === null ? null : undefined,
      },
      include: { customRole: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update admin' }, { status: 500 });
  }
}


