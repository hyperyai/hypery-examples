import { NextRequest, NextResponse } from 'next/server';

const CORE_APP_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';
const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grant_type, code, code_verifier, refresh_token } = body;

    const tokenEndpoint = `${CORE_APP_URL}/api/oauth/token`;

    let requestBody: any = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type,
    };

    if (grant_type === 'authorization_code') {
      requestBody.code = code;
      requestBody.code_verifier = code_verifier;
      requestBody.redirect_uri = REDIRECT_URI;
    } else if (grant_type === 'refresh_token') {
      requestBody.refresh_token = refresh_token;
    } else {
      return NextResponse.json(
        { error: 'Invalid grant_type' },
        { status: 400 }
      );
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Token exchange failed' },
      { status: 500 }
    );
  }
}
