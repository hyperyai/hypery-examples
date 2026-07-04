import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;
const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, code_verifier, grant_type, refresh_token } = body;

    if (grant_type === 'authorization_code') {
      // Exchange authorization code for tokens
      if (!code || !code_verifier) {
        return NextResponse.json(
          { error: 'Missing required parameters' },
          { status: 400 }
        );
      }

      const response = await fetch(`${AUTH_URL}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code_verifier,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(error, { status: response.status });
      }

      const tokens = await response.json();
      return NextResponse.json(tokens);
    } else if (grant_type === 'refresh_token') {
      // Refresh access token
      if (!refresh_token) {
        return NextResponse.json(
          { error: 'Missing refresh token' },
          { status: 400 }
        );
      }

      const response = await fetch(`${AUTH_URL}/api/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(error, { status: response.status });
      }

      const tokens = await response.json();
      return NextResponse.json(tokens);
    } else {
      return NextResponse.json(
        { error: 'Invalid grant_type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

