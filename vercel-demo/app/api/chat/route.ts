/**
 * Chat API Endpoint
 * Proxies requests to Hypery with authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const AI_GATEWAY_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract token from cookie (set by HyperyProvider)
    const cookies = request.headers.get('cookie') || '';
    const tokenMatch = cookies.match(/auth_tokens=([^;]+)/);
    let accessToken = '';
    
    if (tokenMatch) {
      try {
        const authTokens = JSON.parse(decodeURIComponent(tokenMatch[1]));
        accessToken = authTokens.access_token;
      } catch (e) {
        console.error('Failed to parse auth tokens from cookie');
      }
    }
    
    // If no token in cookie, check Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Please sign in to continue',
            requiresAuth: true,
          }
        },
        { status: 401 }
      );
    }

    // Configure OpenAI client to use Hypery
    const aiGateway = createOpenAI({
      apiKey: accessToken,
      baseURL: `${AI_GATEWAY_URL}/api/v1`,
    });

    // Stream response back to client
    const result = streamText({
      model: aiGateway(body.model || 'openai/gpt-4o'),
      messages: body.messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Parse structured errors from Hypery
    if (error.response) {
      try {
        const errorData = await error.response.json();
        return NextResponse.json(
          { error: errorData.error || errorData },
          { status: error.response.status }
        );
      } catch (e) {
        // Failed to parse error response
      }
    }
    
    return NextResponse.json(
      { 
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
        }
      },
      { status: 500 }
    );
  }
}
