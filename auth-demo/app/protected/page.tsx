'use client';

import { Protect, useUser } from '@hyperyai/sdk';
import { CircleCheck, Info, ShieldCheck } from 'lucide-react';
import { BackLink, C, Card, CodeBlock, Note, Page, PageHeader, Spinner } from '@/components/ui';

export default function ProtectedPage() {
  return (
    <Protect fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
      <ProtectedContent />
    </Protect>
  );
}

function ProtectedContent() {
  const { user } = useUser();

  return (
    <Page narrow>
      <BackLink />
      <PageHeader
        icon={<ShieldCheck />}
        title="Protected page"
        description={<>Only signed-in visitors see this. It is wrapped in <C>{'<Protect>'}</C>.</>}
      />
      <div className="space-y-6">
        <Note tone="success" icon={<CircleCheck />} title="Access granted">
          You can see this page because you're authenticated.
        </Note>
        <CodeBlock title="useUser().user" code={JSON.stringify(user, null, 2)} />
        <Card className="p-6">
          <h2 className="text-sm font-semibold">How protection works</h2>
          <dl className="mt-4 divide-y divide-border text-sm">
            {[
              ['<Protect>', 'Wraps content that requires authentication'],
              ['fallback', 'Shown while the session is checked'],
              ['redirect', 'Signed-out visitors are sent to sign in'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-4 py-3">
                <dt className="w-28 shrink-0"><C>{k}</C></dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Note tone="info" icon={<Info />} title="Try it">
          Sign out from the user menu, then open <C>/protected</C> directly: you'll be sent to sign in.
        </Note>
      </div>
    </Page>
  );
}
