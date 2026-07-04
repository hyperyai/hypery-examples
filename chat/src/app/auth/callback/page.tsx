'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken } from '@/lib/oauth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// useSearchParams() requires a Suspense boundary at build time.
export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <OAuthCallback />
    </Suspense>
  );
}

function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setError(errorDescription || error);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        console.log('🔄 Exchanging authorization code for token...');
        const tokens = await exchangeCodeForToken(code);
        console.log('✅ Token exchange successful:', { 
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in 
        });
        
        // Store tokens in localStorage
        localStorage.setItem('auth_tokens', JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        }));

        console.log('✅ Tokens stored, redirecting to home...');
        // Redirect to home
        router.push('/');
      } catch (err) {
        console.error('❌ OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to authenticate');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
}

