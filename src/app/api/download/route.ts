import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendFileUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const fileName = searchParams.get('name') || 'download';

    if (!rawUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    const fileUrl = resolveBackendFileUrl(rawUrl);
    if (!fileUrl) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    // Fetch the file from the external URL
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status });
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer();
    
    // Get the content type from the response or determine it from the file extension
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Determine content type from file extension if not provided
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (!response.headers.get('content-type')) {
      switch (fileExtension) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'doc':
          contentType = 'application/msword';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        default:
          contentType = 'application/octet-stream';
      }
    }

    // Return the file with proper headers to force download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
