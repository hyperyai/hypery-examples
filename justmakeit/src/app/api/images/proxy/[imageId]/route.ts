/**
 * Image Proxy for JustMakeIt.AI
 * Proxies authenticated image requests to the Hypery to avoid CORS issues
 * 
 * Flow:
 * 1. Client (JustMakeIt.AI frontend) requests: /api/images/proxy/{imageId}
 * 2. This endpoint fetches from Hypery: localhost:3001/api/v1/images/serve/{imageId}
 * 3. Forwards the session cookie from client to Hypery
 * 4. Returns image to client
 * 
 * This avoids cross-origin credential issues!
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID required' },
        { status: 400 }
      );
    }

    // Get session cookie from client request
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('better-auth.session_token');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Construct Hypery URL
    const aiGatewayUrl = process.env.AI_GATEWAY_URL || 'http://localhost:3001';
    const imageUrl = `${aiGatewayUrl}/api/v1/images/serve/${imageId}`;

    console.log('🖼️ [IMAGE PROXY] Fetching image:', imageUrl);

    // Forward request to Hypery with session cookie
    const response = await fetch(imageUrl, {
      headers: {
        // Forward the session cookie
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    if (!response.ok) {
      console.error('❌ [IMAGE PROXY] Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/png';

    console.log('✅ [IMAGE PROXY] Image fetched successfully, size:', imageBuffer.byteLength);

    // Return image to client
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('❌ [IMAGE PROXY] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

