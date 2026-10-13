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
} from '@hyperyai/sdk';
import { MessageSquare, TriangleAlert } from 'lucide-react';
import { BackLink, C, CodeBlock, Note, Page, PageHeader, button } from '@/components/ui';
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
    <Page narrow>
      <BackLink />
      <PageHeader
        icon={<MessageSquare />}
        title="Modals"
        description={
          <>
            Calls the chat API. If the response carries a structured <C>error</C>,{' '}
            <C>RestrictionModal</C> opens (credits, spending limits, cards). <C>AuthModal</C> is the sign-in dialog.
          </>
        }
      />
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={sendChatCompletion} disabled={loading || !gatewayUrl} className={button.primary}>
            {loading ? 'Calling chat API…' : 'Call /api/v1/chat/completions'}
          </button>
          <button type="button" onClick={() => setAuthModalOpen(true)} className={button.secondary}>
            Open AuthModal
          </button>
        </div>

        {!gatewayUrl || !oauthClientId ? (
          <Note tone="warning" icon={<TriangleAlert />}>
            Set <C>NEXT_PUBLIC_AUTH_URL</C> and <C>NEXT_PUBLIC_OAUTH_CLIENT_ID</C> in <C>.env.local</C> (see ENV.md).
          </Note>
        ) : null}

        {assistantReply ? (
          <Note tone="success" title="Assistant">
            <span className="whitespace-pre-wrap">{assistantReply}</span>
          </Note>
        ) : null}

        {lastRawBody ? <CodeBlock title="Last JSON body" code={lastRawBody} /> : null}
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
    </Page>
  );
}
