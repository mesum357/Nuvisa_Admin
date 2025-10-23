import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_CONFIG, getBackendHeaders } from '@/lib/config';

const BACKEND_URL = BACKEND_CONFIG.BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'active';
    
    const response = await fetch(`${BACKEND_URL}/comparison-section/${path}`, {
      method: 'GET',
      headers: getBackendHeaders(),
    });
    
    const data = await response.json();
    
    // Handle the backend response structure
    if (data.status === 'success' && data.data) {
      // Check if there's actual data in the results
      if (data.data.results && Object.keys(data.data.results).length > 0) {
        return NextResponse.json(data.data.results);
      } else {
        return NextResponse.json(null);
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comparison section' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/comparison-section`, {
      method: 'POST',
      headers: getBackendHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Handle the backend response structure for POST requests
    if (data.status === 'success' && data.data) {
      return NextResponse.json({
        success: true,
        data: data.data.results || data.data
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comparison section' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const endpoint = action === 'toggle' 
      ? `${BACKEND_URL}/comparison-section/${id}/toggle`
      : `${BACKEND_URL}/comparison-section/${id}`;

    const body = action === 'toggle' ? {} : await request.json();
    
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: getBackendHeaders(),
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    // Handle the backend response structure for PATCH requests
    if (data.status === 'success' && data.data) {
      return NextResponse.json({
        success: true,
        data: data.data.results || data.data
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comparison section' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${BACKEND_URL}/comparison-section/${id}`, {
      method: 'DELETE',
      headers: getBackendHeaders(),
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting comparison section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comparison section' },
      { status: 500 }
    );
  }
}
