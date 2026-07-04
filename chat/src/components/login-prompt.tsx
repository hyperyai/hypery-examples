'use client';

import { Key } from 'lucide-react';
import { getAuthorizationUrl } from '@/lib/oauth';

export function LoginPrompt() {
  const handleLogin = async () => {
    const authUrl = await getAuthorizationUrl();
    window.location.href = authUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Hypery Chat</h1>
          <p className="text-gray-600 text-center mb-6">
            Connect your Hypery account to start chatting
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Hypery
          </button>

          <p className="mt-4 text-xs text-gray-500 text-center">
            You'll be redirected to Hypery to authorize this application.
          </p>
        </div>
      </div>
    </div>
  );
}

