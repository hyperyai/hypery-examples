'use client';

import { Protect, useHyperyAuth } from '@hypery/auth';
import Link from 'next/link';
import { useState } from 'react';

export default function ApiDemoPage() {
  return (
    <Protect>
      <ApiDemoContent />
    </Protect>
  );
}

function ApiDemoContent() {
  const { getAccessToken } = useHyperyAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();
      setToken(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get token');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Example: Call Hypery API
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">API Demo</h1>
          </div>

          <p className="text-gray-600 mb-6">
            Test authenticated API requests using the <code className="bg-gray-100 px-2 py-1 rounded text-sm">getAccessToken()</code> hook.
          </p>

          {/* Actions */}
          <div className="space-y-4 mb-8">
            <div>
              <button
                onClick={handleGetToken}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Loading...' : '1. Get Access Token'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Retrieves your current access token (auto-refreshes if expired)
              </p>
            </div>

            <div>
              <button
                onClick={handleMakeRequest}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Loading...' : '2. Make Authenticated Request'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Calls <code className="bg-gray-100 px-1 rounded">/api/user/me</code> with Bearer token
              </p>
            </div>
          </div>

          {/* Token Display */}
          {token && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Access Token:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-xs break-all">{token}</code>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This token is automatically included in the <code>Authorization</code> header
              </p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Error:</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Code Example */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Example Code:</h3>
            <pre className="text-xs overflow-x-auto">
{`import { useHyperyAuth } from '@hypery/auth';

function MyComponent() {
  const { getAccessToken } = useHyperyAuth();

  const makeRequest = async () => {
    // Get valid token (auto-refreshes if needed)
    const token = await getAccessToken();
    
    // Make authenticated request
    const response = await fetch('/api/endpoint', {
      headers: {
        Authorization: \`Bearer \${token}\`,
      },
    });
    
    return response.json();
  };
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

