'use client';

import { useState } from 'react';
import { Key } from 'lucide-react';

interface Props {
  onSubmit: (apiKey: string) => void;
}

export function ApiKeyPrompt({ onSubmit }: Props) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSubmit(key.trim());
    }
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
            Enter your API key to get started
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk-..."
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!key.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Your API key is stored locally and never sent to our servers except to authenticate requests.
          </p>
        </div>
      </div>
    </div>
  );
}

