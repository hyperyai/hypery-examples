'use client';

import { Protect, useHyperyAuth } from '@hyperyai/sdk';
import { Terminal, TriangleAlert } from 'lucide-react';
import { BackLink, C, Card, CodeBlock, Note, Page, PageHeader, button } from '@/components/ui';
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
    <Page narrow>
      <BackLink />
      <PageHeader
        icon={<Terminal />}
        title="API demo"
        description={<>Make authenticated requests with the token from <C>getAccessToken()</C>.</>}
      />
      <div className="space-y-6">
        <Card className="divide-y divide-border">
          {[
            { n: 1, label: 'Get access token', hint: 'Returns your current token, refreshed if it expired.', run: handleGetToken, primary: false },
            { n: 2, label: 'Make authenticated request', hint: 'Calls /api/user/me with a Bearer token.', run: handleMakeRequest, primary: true },
          ].map((step) => (
            <div key={step.n} className="flex flex-wrap items-center gap-4 p-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary-subtle-foreground">
                {step.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.hint}</p>
              </div>
              <button onClick={step.run} disabled={loading} className={step.primary ? button.primary : button.secondary}>
                {loading ? 'Loading…' : 'Run'}
              </button>
            </div>
          ))}
        </Card>

        {token && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Access token</h3>
            <div className="break-all rounded-xl bg-surface-sunken p-4 font-mono text-xs text-muted-foreground">{token}</div>
            <p className="mt-2 text-xs text-subtle-foreground">Send it in the <C>Authorization</C> header.</p>
          </div>
        )}

        {response && <CodeBlock title="Response" code={JSON.stringify(response, null, 2)} />}

        {error && (
          <Note tone="warning" icon={<TriangleAlert />} title="Request failed">
            {error}
          </Note>
        )}

        <CodeBlock
          title="Example"
          code={`import { useHyperyAuth } from '@hyperyai/sdk';

function MyComponent() {
  const { getAccessToken } = useHyperyAuth();

  const makeRequest = async () => {
    // Get valid token (auto-refreshes if needed)
    const token = await getAccessToken();

    const response = await fetch('/api/endpoint', {
      headers: { Authorization: \`Bearer \${token}\` },
    });
    return response.json();
  };
}`}
        />
      </div>
    </Page>
  );
}
