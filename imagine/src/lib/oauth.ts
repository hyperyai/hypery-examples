// OAuth utilities for authenticating with Hypery

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

// Generate PKCE code verifier and challenge
export async function generatePKCE(): Promise<PKCEPair> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Create SHA-256 hash of the verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return {
    codeVerifier,
    codeChallenge,
  };
}

// Build OAuth authorization URL
export function getAuthorizationUrl(
  coreAppUrl: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'read write ai:images',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  return `${coreAppUrl}/api/oauth/authorize?${params.toString()}`;
}

// Exchange authorization code for access token
// Calls the app's own backend which securely handles client_secret
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  coreAppUrl: string = 'http://localhost:3001'
): Promise<TokenResponse> {
  // Call OUR backend API route (not core directly) to keep client_secret secure
  const response = await fetch('/api/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Token exchange failed');
  }

  return response.json();
}

// Refresh access token
// Calls the app's own backend which securely handles client_secret
export async function refreshToken(
  refreshToken: string,
  coreAppUrl: string = 'http://localhost:3001'
): Promise<TokenResponse> {
  // Call OUR backend API route (not core directly) to keep client_secret secure
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
    throw new Error('Token refresh failed');
  }

  return response.json();
}
