'use client';

/**
 * Live example: OAuth session + AuthModal + RestrictionModal
 * when /api/v1/chat/completions returns a structured { error: { ... } } body
 * (e.g. SPENDING_LIMIT_EXCEEDED, INSUFFICIENT_CREDITS).
 *
 * Run: from repo root, start apps/web on 3001 and this app on 3003 (see README).
 */

import {
  AuthModal,
  Protect,
  RestrictionModal,
  useHyperyAuth,
  type RestrictionError,
} from '@hypery/sdk';
import Link from 'next/link';
import { useState } from 'react';

const gatewayUrl = process.env.NEXT_PUBLIC_AUTH_URL ?? '';
const oauthClientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? '';

export default function ModalsDemoPage() {
  return (
    <Protect>
      <ModalsDemoContent />
    </Protect>
  );
}

function ModalsDemoContent() {
  const { getAccessToken } = useHyperyAuth();
  const [restrictionError, setRestrictionError] = useState<RestrictionError | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [lastRawBody, setLastRawBody] = useState<string | null>(null);

  async function sendChatCompletion() {
    setLoading(true);
    setAssistantReply(null);
    setLastRawBody(null);
    setRestrictionError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setLastRawBody('No access token — sign in again.');
        return;
      }

      const res = await fetch(`${gatewayUrl}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          provider: 'openrouter',
          messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        }),
      });

      const data = await res.json().catch(() => ({}));
      setLastRawBody(JSON.stringify(data, null, 2));

      if (!res.ok && data && typeof data === 'object' && 'error' in data && data.error) {
        setRestrictionError(data.error as RestrictionError);
        return;
      }

      if (!res.ok) {
        return;
      }

      const text =
        typeof data?.choices?.[0]?.message?.content === 'string'
          ? data.choices[0].message.content
          : null;
      setAssistantReply(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-8"
        >
          ← Back to home
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Modals demo</h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              Runnable code in{' '}
              <code className="bg-slate-100 px-1 rounded text-xs">apps/auth-demo/app/modals/page.tsx</code>
              . Calls your hub chat API; if the response includes a structured{' '}
              <code className="bg-slate-100 px-1 rounded text-xs">error</code> object,{' '}
              <code className="bg-slate-100 px-1 rounded text-xs">RestrictionModal</code> opens
              (credits, spending limits, etc.). Use{' '}
              <code className="bg-slate-100 px-1 rounded text-xs">AuthModal</code> for the sign-in
              dialog pattern.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sendChatCompletion}
              disabled={loading || !gatewayUrl}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Calling chat API…' : 'Call /api/v1/chat/completions'}
            </button>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open AuthModal
            </button>
          </div>

          {!gatewayUrl || !oauthClientId ? (
            <p className="text-amber-800 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Set <code className="text-xs">NEXT_PUBLIC_AUTH_URL</code> and{' '}
              <code className="text-xs">NEXT_PUBLIC_OAUTH_CLIENT_ID</code> in{' '}
              <code className="text-xs">.env.local</code> (see ENV.md).
            </p>
          ) : null}

          {assistantReply ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide mb-1">
                Assistant
              </p>
              <p className="text-emerald-950 whitespace-pre-wrap">{assistantReply}</p>
            </div>
          ) : null}

          {lastRawBody ? (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Last JSON body</p>
              <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto">
                {lastRawBody}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="signin"
        onSuccess={() => setAuthModalOpen(false)}
      />

      <RestrictionModal
        error={restrictionError}
        appId={oauthClientId}
        gatewayUrl={gatewayUrl}
        getAccessToken={getAccessToken}
        onClose={() => setRestrictionError(null)}
        onRetry={() => setRestrictionError(null)}
      />
    </div>
  );
}
