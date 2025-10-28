import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const socialLinks = await prisma.siteContent.findMany({
      where: {
        key: {
          in: ['social_twitter', 'social_facebook', 'social_instagram', 'social_linkedin']
        }
      }
    });

    const linksMap: Record<string, string> = {};
    socialLinks.forEach(link => {
      const key = link.key.replace('social_', ''); // Remove 'social_' prefix
      linksMap[key] = link.value;
    });

    return NextResponse.json({ success: true, data: linksMap });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json({ error: 'Failed to fetch social links' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { twitter, facebook, instagram, linkedin } = body;

    // Update or create social links
    const updates = [];
    
    if (twitter !== undefined) {
      updates.push(
        prisma.siteContent.upsert({
          where: { key: 'social_twitter' },
          update: { value: twitter, updatedBy: (session.user as any).id },
          create: { key: 'social_twitter', value: twitter, type: 'url', updatedBy: (session.user as any).id }
        })
      );
    }

    if (facebook !== undefined) {
      updates.push(
        prisma.siteContent.upsert({
          where: { key: 'social_facebook' },
          update: { value: facebook, updatedBy: (session.user as any).id },
          create: { key: 'social_facebook', value: facebook, type: 'url', updatedBy: (session.user as any).id }
        })
      );
    }

    if (instagram !== undefined) {
      updates.push(
        prisma.siteContent.upsert({
          where: { key: 'social_instagram' },
          update: { value: instagram, updatedBy: (session.user as any).id },
          create: { key: 'social_instagram', value: instagram, type: 'url', updatedBy: (session.user as any).id }
        })
      );
    }

    if (linkedin !== undefined) {
      updates.push(
        prisma.siteContent.upsert({
          where: { key: 'social_linkedin' },
          update: { value: linkedin, updatedBy: (session.user as any).id },
          create: { key: 'social_linkedin', value: linkedin, type: 'url', updatedBy: (session.user as any).id }
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true, message: 'Social links updated successfully' });
  } catch (error) {
    console.error('Error updating social links:', error);
    return NextResponse.json({ error: 'Failed to update social links' }, { status: 500 });
  }
}

