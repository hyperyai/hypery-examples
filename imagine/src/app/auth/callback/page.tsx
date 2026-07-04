'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';
import { exchangeCodeForToken } from '../../../lib/oauth';
import { Loader2 } from 'lucide-react';

// useSearchParams() requires a Suspense boundary at build time.
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hasRun = false; // Prevent React 18 StrictMode double execution
    
    const handleCallback = async () => {
      if (hasRun) {
        console.log('⏭️ [AUTH] Callback already processed, skipping');
        return;
      }
      hasRun = true;
      
      try {
        const code = searchParams?.get('code');
        const state = searchParams?.get('state');
        const error = searchParams?.get('error');

        console.log('🔐 [AUTH] Processing OAuth callback');
        console.log('   Code:', code?.substring(0, 10) + '...');

        if (error) {
          setError(`Authentication error: ${error}`);
          return;
        }

        if (!code || !state) {
          setError('Missing authorization code or state');
          return;
        }

        // Verify state
        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
          setError('Invalid state parameter');
          return;
        }

        // Get code verifier
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        if (!codeVerifier) {
          setError('Missing code verifier');
          return;
        }

        // Exchange code for tokens (call core API)
        console.log('🔄 [AUTH] Exchanging code for tokens...');
        const coreAppUrl = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:3001';
        const tokens = await exchangeCodeForToken(code, codeVerifier, coreAppUrl);
        
        console.log('✅ [AUTH] Token exchange successful');
        
        // Save tokens
        setTokens(tokens);

        // Clean up session storage
        sessionStorage.removeItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_state');

        console.log('🏠 [AUTH] Redirecting to home page');
        // Redirect to main page
        router.push('/');
      } catch (err) {
        console.error('❌ [AUTH] Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once - don't depend on searchParams to avoid re-runs

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-5xl">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}
