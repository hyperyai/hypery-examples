/**
 * JustMakeIt.AI - Landing Page
 * Authentication page with sign-in
 */

'use client';

import { SignedIn, SignedOut, SignInForm, Protect, useUser, useHyperyAuth } from '@hypery/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { login } = useHyperyAuth();

  // Redirect to IDE loader if already signed in (it will pick the workspace)
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/ide');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            🤖 JustMakeIt.AI
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <SignedOut>
          <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  AI-Powered Development Environment
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  Code with natural language. Build with AI. Powered by the Model Context Protocol.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    💬
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Chat as Control Center</h3>
                    <p className="text-gray-600 text-sm">
                      Use natural language to create, edit, and manage files
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    🛠️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">MCP Tools</h3>
                    <p className="text-gray-600 text-sm">
                      Standardized tools for file operations, UI control, and context queries
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Real-Time Updates</h3>
                    <p className="text-gray-600 text-sm">
                      See tool executions in real-time as the AI manipulates your files
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  Example: "Create a React component called Button with a click handler"
                </p>
              </div>
            </div>

            {/* Right Side - Sign In Form */}
            <div>
              <SignInForm
                showCard
                showTitle
                title="Sign in to JustMakeIt.AI"
                description="Use your Hypery account"
                showSocial
                showEmailPassword={false}
              />
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Redirecting to IDE...</p>
          </div>
        </SignedIn>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-gray-500">
        <p>
          Powered by{' '}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Model Context Protocol
          </a>
          {' '}and{' '}
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Hypery
          </a>
        </p>
      </footer>
    </div>
  );
}

