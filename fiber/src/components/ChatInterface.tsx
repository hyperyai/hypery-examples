'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useHyperyAuth, AuthModal, RestrictionModal, isAuthError, type RestrictionError } from '@hypery/auth';
import { Send, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  onModelUpdate: (instruction: string) => void;
}

export default function ChatInterface({ onModelUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [restrictionError, setRestrictionError] = useState<RestrictionError | null>(null);
  
  const { isAuthenticated, getAccessToken, user } = useHyperyAuth();
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/api/v1/chat/completions',
      async headers() {
        const token = await getAccessToken();
        console.log('🔑 Sending request with token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        console.log('🌐 API URL:', 'http://localhost:3001/api/v1/chat/completions');
        return {
          Authorization: token ? `Bearer ${token}` : '',
        };
      },
      body: {
        model: 'openai/gpt-4o',
      },
      async fetch(url, init) {
        console.log('📡 Fetch called:', url);
        console.log('📤 Headers:', init?.headers);
        console.log('📦 Body:', init?.body);
        const response = await window.fetch(url, init);
        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
        return response;
      },
    }),
    onError: (error) => {
      console.error('❌ Chat error:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Try to parse structured error
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error) {
          if (isAuthError(errorData)) {
            setShowAuthModal(true);
          } else {
            setRestrictionError(errorData.error as RestrictionError);
          }
          return;
        }
      } catch (e) {
        // Not a structured error
      }
      
      console.error('Unhandled chat error:', error);
    },
    async onFinish({ message }) {
      console.log('Message finished:', message);
      // Parse the response to extract model updates
      const textPart = message.parts.find((p: any) => p.type === 'text');
      if (textPart && 'text' in textPart) {
        onModelUpdate(textPart.text);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Check authentication before sending
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    sendMessage({ text: input });
    setInput('');
  };

  return (
    <>
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
        branding={{
          appName: '3D Model Generator',
        }}
      />

      {/* Restriction Modal */}
      {restrictionError && (
        <RestrictionModal
          error={restrictionError}
          appId={process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || ''}
          gatewayUrl={process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001'}
          getAccessToken={getAccessToken}
          onClose={() => setRestrictionError(null)}
        />
      )}

      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3D Model Generator</h2>
              {user && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {user.name || user.email}
                </p>
              )}
            </div>
            {!isAuthenticated && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
              <p className="text-lg font-medium mb-2">Start creating!</p>
              <p className="text-sm mb-4">Try these prompts:</p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
                  "Make a girl on a pony"
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
                  "Add a red sphere"
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
                  "Make the pony purple"
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.parts.map((part: any, i: number) => 
                    part.type === 'text' ? <span key={i}>{part.text}</span> : null
                  )}
                </p>
              </div>
            </div>
          ))}
          
          {status === 'submitted' && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your 3D model..."
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              disabled={status === 'submitted'}
            />
            <button
              type="submit"
              disabled={!input.trim() || status === 'submitted'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'submitted' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

