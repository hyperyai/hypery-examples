'use client';

import { Protect, useUser } from '@hypery/sdk';
import Link from 'next/link';

export default function ProtectedPage() {
  return (
    <Protect fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>}>
      <ProtectedContent />
    </Protect>
  );
}

function ProtectedContent() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">Protected Page</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-900 mb-2">
                ✓ Access Granted
              </h2>
              <p className="text-sm text-green-800">
                You can see this page because you're authenticated. This is protected by the <code className="bg-green-100 px-1 py-0.5 rounded">{`<Protect>`}</code> component.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Your User Data:</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <pre>{JSON.stringify(user, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">How Protection Works:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs mt-0.5">{`<Protect>`}</span>
                  <p>Wraps content that requires authentication</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs mt-0.5">fallback</span>
                  <p>Shows loading state while checking auth</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs mt-0.5">redirect</span>
                  <p>Automatically redirects to login if not authenticated</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Try it:</h3>
              <p className="text-sm text-blue-800 mb-3">
                Sign out from the user menu, then try visiting this page directly. You'll be automatically redirected to sign in!
              </p>
              <code className="text-xs bg-blue-100 px-2 py-1 rounded block">
                http://localhost:3003/protected
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

