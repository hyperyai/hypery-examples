/**
 * JustMakeIt.AI - Workspace Page
 * AI-powered IDE with specific workspace loaded from URL
 */

'use client';

import { Protect } from '@hypery/auth';
import dynamic from 'next/dynamic';
import { use } from 'react';

// Dynamically import IDEContent to avoid SSR issues
const IDEContent = dynamic(() => import('../../ide/IDEContent'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-[var(--text-primary)]">Loading workspace...</div>
    </div>
  ),
});

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <Protect>
      <IDEContent workspaceId={id} />
    </Protect>
  );
}

