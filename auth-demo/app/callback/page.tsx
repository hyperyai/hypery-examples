'use client';

import { useEffect } from 'react';
import { useHyperyAuth } from '@hyperyai/sdk';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Spinner } from '@/components/ui';

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center shadow-card">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-danger-subtle text-danger-foreground">
              <X className="size-5" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Authentication failed</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <p className="mt-4 text-xs text-subtle-foreground">Redirecting back to home…</p>
          </>
        ) : (
          <>
            <Spinner className="mx-auto mb-4 block size-8" />
            <h2 className="text-xl font-semibold tracking-tight">Completing sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">One moment while we authenticate you…</p>
          </>
        )}
      </div>
    </div>
  );
}
