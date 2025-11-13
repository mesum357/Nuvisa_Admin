import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const countryName = formData.get('countryName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!countryName) {
      return NextResponse.json({ error: 'Country name is required' }, { status: 400 });
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Create country images directory if it doesn't exist
    const countryImagesDir = join(process.cwd(), 'public', 'image', 'country');
    if (!existsSync(countryImagesDir)) {
      await mkdir(countryImagesDir, { recursive: true });
    }

    // Generate filename based on country name (sanitize the name)
    const sanitizedCountryName = countryName.replace(/[^a-zA-Z0-9]/g, '');
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${sanitizedCountryName}.${fileExtension}`;
    const filepath = join(countryImagesDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL path (relative to public directory)
    const imagePath = `/image/country/${filename}`;

    return NextResponse.json({
      success: true,
      data: { imagePath },
      message: 'Country image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading country image:', error);
    return NextResponse.json(
      { error: 'Failed to upload country image', details: error.message },
      { status: 500 }
    );
  }
}

