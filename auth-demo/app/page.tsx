'use client';

import { SignedIn, SignedOut, SignIn, UserButton, useUser } from '@hyperyai/sdk';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
              <h1 className="text-xl font-bold text-gray-900">Hypery Auth Demo</h1>
            </div>

            <SignedIn>
              <UserButton showUserInfo size="md" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SignedOut>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
                Welcome to Hypery
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Sign in to explore the authentication demo
              </p>

              <SignIn
                buttonText="Sign in with Hypery"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              />

              <p className="mt-4 text-xs text-gray-500 text-center">
                You'll be redirected to Hypery to authorize this application
              </p>
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    ✓
                  </span>
                  Secure OAuth 2.0
                </h3>
                <p className="text-sm text-gray-600 ml-11">
                  Industry-standard authentication with PKCE
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    🔄
                  </span>
                  Auto Token Refresh
                </h3>
                <p className="text-sm text-gray-600 ml-11">
                  Seamless session management
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-2 flex items-center text-gray-900">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    ⚛️
                  </span>
                  React-First
                </h3>
                <p className="text-sm text-gray-600 ml-11">
                  Hooks and components built for React
                </p>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <AuthenticatedContent />
        </SignedIn>
      </main>
    </div>
  );
}

function AuthenticatedContent() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-start space-x-4">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-1 text-gray-900">Welcome, {user?.name}!</h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500 mt-2">User ID: {user?.id}</p>
          </div>
        </div>
      </div>

      {/* Demo Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Component Showcase */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">📦 Component Showcase</h3>
          <div className="space-y-4 text-sm">
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-800">{`<SignedIn>`}</code>
              <p className="text-gray-600 mt-1">You're seeing this because you're authenticated</p>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-800">{`<UserButton>`}</code>
              <p className="text-gray-600 mt-1">Click your avatar in the top-right</p>
            </div>
            <div>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-800">{`useUser()`}</code>
              <p className="text-gray-600 mt-1">Hook providing your user data</p>
            </div>
          </div>
        </div>

        {/* Demo Pages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🚀 Explore Features</h3>
          <div className="space-y-2">
            <Link
              href="/examples"
              className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
            >
              View All Examples
            </Link>
            <Link
              href="/protected"
              className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Protected Page
            </Link>
            <Link
              href="/api-demo"
              className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
            >
              API Demo
            </Link>
            <Link
              href="/modals"
              className="block w-full text-center bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition"
            >
              Modals (chat + RestrictionModal)
            </Link>
          </div>
        </div>

        {/* Scopes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🔑 OAuth Scopes</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <code className="text-xs text-gray-800">read</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <code className="text-xs text-gray-800">write</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <code className="text-xs text-gray-800">ai:chat</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <code className="text-xs text-gray-800">ai:completions</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <code className="text-xs text-gray-800">ai:models</code>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <code className="text-xs text-gray-800">billing:read</code>
            </div>
          </div>
        </div>

        {/* Package Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">📚 Package Info</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong className="text-gray-900">Package:</strong> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-800">@hyperyai/sdk</code>
            </p>
            <p>
              <strong className="text-gray-900">Version:</strong> 0.1.0
            </p>
            <p>
              <strong className="text-gray-900">Storage:</strong> localStorage
            </p>
            <p className="pt-2">
              <a
                href="https://github.com/your-repo/packages/hypery-sdk"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
