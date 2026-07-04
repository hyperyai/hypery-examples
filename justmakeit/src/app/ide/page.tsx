/**
 * JustMakeIt.AI - Redirect Page
 * Redirects to the active workspace URL
 */

'use client';

import { Protect } from '@hypery/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export default function IDERedirectPage() {
  const router = useRouter();
  const { workspaces, activeWorkspace, isLoading } = useWorkspaces();

  useEffect(() => {
    if (!isLoading) {
      if (activeWorkspace) {
        // Redirect to active workspace
        console.log('📍 [REDIRECT] Redirecting to active workspace:', activeWorkspace.id);
        router.replace(`/workspace/${activeWorkspace.id}`);
      } else if (workspaces.length > 0) {
        // Redirect to first workspace
        console.log('📍 [REDIRECT] Redirecting to first workspace:', workspaces[0].id);
        router.replace(`/workspace/${workspaces[0].id}`);
      }
    }
  }, [workspaces, activeWorkspace, isLoading, router]);

  return (
    <Protect>
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-primary)]">Loading workspace...</div>
      </div>
    </Protect>
  );
}
