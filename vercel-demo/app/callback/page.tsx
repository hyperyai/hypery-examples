'use client';

import { useEffect, Suspense } from 'react';
import { useHyperyAuth } from '@hyperyai/sdk';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const { isAuthenticated, isLoading, error } = useHyperyAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');
    
    if (oauthError) {
      console.error('OAuth error:', oauthError);
      return;
    }
    
    if (code) {
      console.log('Callback received code, context will handle it...');
    }
    
    // Wait for auth to complete
    if (!isLoading && !code) {
      // No code in URL anymore, check auth state
      if (isAuthenticated) {
        console.log('✅ Authenticated! Redirecting to home...');
        setTimeout(() => router.push('/'), 100);
      } else if (error) {
        console.error('❌ Auth error:', error);
        router.push('/?error=auth_failed');
      }
    }
  }, [isAuthenticated, isLoading, error, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
            <p className="text-gray-600">{error}</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Completing Sign In</h2>
            <p className="text-gray-600">Please wait...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

