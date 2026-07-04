/**
 * OAuth utilities for authenticating with the Hypery
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL!;

/**
 * Generate random string for PKCE verifier
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE challenge for secure OAuth flow
 */
export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(32);
  
  // Hash the verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(hash);
  
  return { verifier, challenge };
}

/**
 * Build OAuth authorization URL
 */
export async function getAuthorizationUrl(): Promise<string> {
  const { verifier, challenge } = await generatePKCE();
  
  // Store verifier in sessionStorage (will be used when exchanging code for token)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_verifier', verifier);
  }
  
  const state = generateRandomString(16);
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'read write ai:chat ai:completions ai:models billing:read',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  
  return `${AUTH_URL}/api/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const verifier = typeof window !== 'undefined' 
    ? sessionStorage.getItem('oauth_verifier')
    : null;
  
  if (!verifier) {
    throw new Error('OAuth verifier not found');
  }
  
  // Call core API directly - PKCE flow doesn't need client_secret
  const response = await fetch(`${AUTH_URL}/api/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      // No client_secret needed - PKCE handles security
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || 'Failed to exchange code for token');
  }
  
  // Clear verifier
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('oauth_verifier');
  }
  
  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  // Call our backend API route to refresh the token (keeps client_secret secure)
  const response = await fetch('/api/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || 'Failed to refresh token');
  }
  
  return response.json();
}

