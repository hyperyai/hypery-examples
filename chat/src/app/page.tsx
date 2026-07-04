'use client';

import { ChatLayout } from '@/components/chat-layout';
import { LoginPrompt } from '@/components/login-prompt';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ChatPage() {
  const { isAuthenticated, isLoading, accessToken, logout } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !accessToken) {
    return <LoginPrompt />;
  }
  
  return <ChatLayout apiKey={accessToken} onLogout={logout} />;
}
