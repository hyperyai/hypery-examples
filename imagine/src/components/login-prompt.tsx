'use client';

import { Sparkles } from 'lucide-react';
import { generatePKCE, getAuthorizationUrl } from '../lib/oauth';

export function LoginPrompt() {
  const handleLogin = async () => {
    const coreAppUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';
    const clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    // Generate PKCE pair
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const state = Math.random().toString(36).substring(7);

    console.log('🔐 Generated PKCE:', { 
      verifier: codeVerifier.substring(0, 10) + '...', 
      challenge: codeChallenge.substring(0, 10) + '...'
    });

    // Store PKCE verifier and state for callback
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // Redirect to authorization endpoint
    const authUrl = getAuthorizationUrl(coreAppUrl, clientId, redirectUri, codeChallenge, state);
    console.log('🔗 Redirecting to:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Imagine
            </h1>
            <p className="text-gray-600">
              Generate stunning images with AI
            </p>
          </div>

          <div className="space-y-4 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Powered by Replicate</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>FLUX, Stable Diffusion & more</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Fast & high-quality results</span>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Connect with Hypery
          </button>

          <p className="text-xs text-gray-400">
            You'll be redirected to authenticate with Hypery
          </p>
        </div>
      </div>
    </div>
  );
}
