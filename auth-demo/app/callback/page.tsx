'use client';

import { useEffect } from 'react';
import { useHyperyAuth } from '@hypery/auth';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const { isAuthenticated, isLoading, error } = useHyperyAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Check for redirect path
        const redirectTo =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('hypery_redirect_after_login')
            : null;

        if (redirectTo) {
          sessionStorage.removeItem('hypery_redirect_after_login');
          router.push(redirectTo);
        } else {
          router.push('/');
        }
      } else if (error) {
        // Redirect to home with error
        router.push('/?error=auth_failed');
      }
    }
  }, [isAuthenticated, isLoading, error, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting back to home...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Completing Sign In</h2>
            <p className="text-gray-600">Please wait while we authenticate you...</p>
          </>
        )}
      </div>
    </div>
  );
}

