'use client';

import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  SignInForm,
  UserButton,
  UserProfile,
  useAuth,
  useUser,
  AuthModal,
  AuthButton,
} from '@hyperyai/sdk';
import Link from 'next/link';
import { useState } from 'react';
import { CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Card, CodeBlock, Note, Page, PageHeader, Section, button, cx } from '@/components/ui';

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-muted-foreground">{children}</p>;
}

const SIGNED_IN_HINT = "You're already signed in. Sign out to try this.";

export default function ExamplesPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="@hyperyai/sdk"
        title="Components"
        description="Every component and hook in the SDK, live. Switch a card to Code to see how it's used, and flip the theme in the header to see dark mode."
      />

      <div className="space-y-14">
        <Section title="Modal components" description="Sign-in dialogs you can open from anywhere.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ExampleCard
              title="<AuthButton />"
              description="A button that opens the sign-in dialog."
              code={`<AuthButton
  variant="primary"
  mode="signin"
  onSuccess={() => router.push('/dashboard')}
>
  Sign In
</AuthButton>`}
            >
              <SignedOut>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <AuthButton variant="primary">Sign In</AuthButton>
                  <AuthButton variant="secondary" mode="signup">
                    Get Started
                  </AuthButton>
                  <AuthButton variant="outline" mode="signin">
                    Outline Style
                  </AuthButton>
                </div>
              </SignedOut>
              <SignedIn>
                <Hint>{SIGNED_IN_HINT}</Hint>
              </SignedIn>
            </ExampleCard>

            <ExampleCard
              title="<AuthModal />"
              description="The dialog on its own, for custom triggers."
              code={`const [isOpen, setIsOpen] = useState(false);

<AuthModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  initialMode="signin"
  showEmailPassword
  branding={{ appName: 'Acme' }}
/>`}
            >
              <SignedOut>
                <AuthModalExample />
              </SignedOut>
              <SignedIn>
                <Hint>{SIGNED_IN_HINT}</Hint>
              </SignedIn>
            </ExampleCard>
          </div>
        </Section>

        <Section title="Authentication components" description="Sign in, sign up, and the signed-in user.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ExampleCard
              title="<SignIn />"
              description="Starts the hosted sign-in flow."
              code={`<SignIn
  buttonText="Sign in"
  variant="primary"
/>`}
            >
              <SignedOut>
                <div className="flex justify-center">
                  <SignIn buttonText="Try Sign In" variant="primary" />
                </div>
              </SignedOut>
              <SignedIn>
                <Hint>{SIGNED_IN_HINT}</Hint>
              </SignedIn>
            </ExampleCard>

            <ExampleCard
              title="<SignUp />"
              description="Starts the hosted sign-up flow."
              code={`<SignUp
  buttonText="Get Started"
  variant="secondary"
/>`}
            >
              <SignedOut>
                <div className="flex justify-center">
                  <SignUp buttonText="Try Sign Up" variant="secondary" />
                </div>
              </SignedOut>
              <SignedIn>
                <Hint>{SIGNED_IN_HINT}</Hint>
              </SignedIn>
            </ExampleCard>

            <ExampleCard
              title="<SignInForm />"
              description="An embedded sign-in card."
              code={`<SignInForm
  showCard
  showTitle
  showEmailPassword
  onSuccess={() => console.log('Signed in!')}
/>`}
            >
              <SignedOut>
                <SignInForm showCard showEmailPassword title="Sign in to Acme" description="Use your Hypery account" />
              </SignedOut>
              <SignedIn>
                <Hint>{SIGNED_IN_HINT}</Hint>
              </SignedIn>
            </ExampleCard>

            <div className="grid gap-5">
              <ExampleCard
                title="<UserButton />"
                description="Avatar with a profile menu and sign out."
                code={`<UserButton
  showUserInfo
  size="md"
/>`}
              >
                <SignedIn>
                  <div className="flex justify-center">
                    <UserButton showUserInfo size="lg" />
                  </div>
                </SignedIn>
                <SignedOut>
                  <Hint>Sign in to see the user button.</Hint>
                </SignedOut>
              </ExampleCard>

              <ExampleCard
                title="<UserProfile />"
                description="The signed-in user as a card."
                code={`<UserProfile showExtended />`}
              >
                <SignedIn>
                  <UserProfile showExtended />
                </SignedIn>
                <SignedOut>
                  <Hint>Sign in to see your profile.</Hint>
                </SignedOut>
              </ExampleCard>
            </div>
          </div>
        </Section>

        <Section title="Control components" description="Render by authentication state.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ExampleCard
              title="<SignedIn />"
              description="Renders its children only when signed in."
              code={`<SignedIn>
  <p>You can see this!</p>
</SignedIn>`}
            >
              <SignedIn>
                <Note tone="success" icon={<CircleCheck />}>
                  You're signed in, so you can see this.
                </Note>
              </SignedIn>
              <SignedOut>
                <Note icon={<Info />}>You're signed out, so SignedIn renders nothing.</Note>
              </SignedOut>
            </ExampleCard>

            <ExampleCard
              title="<SignedOut />"
              description="Renders its children only when signed out."
              code={`<SignedOut>
  <SignIn />
</SignedOut>`}
            >
              <SignedOut>
                <div className="flex flex-col items-center gap-4">
                  <Note tone="success" icon={<CircleCheck />}>
                    You're signed out, so you can see this.
                  </Note>
                  <SignIn buttonText="Sign in here" variant="outline" />
                </div>
              </SignedOut>
              <SignedIn>
                <Note icon={<Info />}>You're signed in, so SignedOut renders nothing.</Note>
              </SignedIn>
            </ExampleCard>

            <ExampleCard
              title="<Protect />"
              description="Gates a page and redirects to sign-in."
              code={`<Protect fallback={<Loading />}>
  <ProtectedContent />
</Protect>`}
            >
              <Note tone="info" icon={<Info />}>
                See the{' '}
                <Link href="/protected" className="font-medium underline underline-offset-4">
                  protected page
                </Link>{' '}
                for a live example.
              </Note>
            </ExampleCard>

            <ExampleCard
              title="<RedirectToSignIn />"
              description="Sends the visitor straight to sign-in."
              code={`<RedirectToSignIn />`}
            >
              <SignedIn>
                <Hint>You're signed in, so it won't redirect.</Hint>
              </SignedIn>
              <SignedOut>
                <Note tone="warning" icon={<TriangleAlert />}>
                  Disabled on this page to avoid a redirect loop.
                </Note>
              </SignedOut>
            </ExampleCard>
          </div>
        </Section>

        <Section title="React hooks" description="Read authentication state and user data.">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ExampleCard
              title="useAuth()"
              description="The full authentication state."
              code={`const {
  isAuthenticated,
  isLoading,
  user,
  login,
  logout,
} = useAuth();`}
            >
              <UseAuthExample />
            </ExampleCard>

            <ExampleCard
              title="useUser()"
              description="Just the user."
              code={`const { user, isLoading } = useUser();

console.log(user.name);
console.log(user.email);`}
            >
              <UseUserExample />
            </ExampleCard>
          </div>
        </Section>

        <Section
          title="Customization"
          description="Variants, plus theming through --hy-* CSS variables."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {(['primary', 'secondary', 'outline'] as const).map((variant) => (
              <ExampleCard
                key={variant}
                title={`variant="${variant}"`}
                description={
                  variant === 'primary' ? 'The brand fill.' : variant === 'secondary' ? 'A quiet filled button.' : 'A hairline outline.'
                }
                code={`<SignIn variant="${variant}" />`}
              >
                <SignedOut>
                  <div className="flex justify-center">
                    <SignIn variant={variant} buttonText={variant[0].toUpperCase() + variant.slice(1)} />
                  </div>
                </SignedOut>
                <SignedIn>
                  <Hint>{SIGNED_IN_HINT}</Hint>
                </SignedIn>
              </ExampleCard>
            ))}
          </div>
          <CodeBlock
            className="mt-5"
            title="globals.css"
            code={`/* Rebrand every SDK component */
.hypery {
  --hy-primary: oklch(0.55 0.2 290);
  --hy-radius: 0.75rem;
}`}
          />
        </Section>
      </div>
    </Page>
  );
}

function ExampleCard({
  title,
  description,
  code,
  children,
}: {
  title: string;
  description: string;
  code: string;
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
        <div className="min-w-0">
          <h3 className="font-mono text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 rounded-lg bg-muted p-0.5" role="tablist">
          {(['preview', 'code'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cx(
                'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                tab === t ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2">
        {tab === 'code' ? (
          <CodeBlock code={code} className="flex-1" />
        ) : (
          <div className="flex min-h-36 flex-1 items-center justify-center rounded-xl bg-surface-sunken p-6">
            <div className="w-full">{children}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: 'success' | 'danger' | 'muted' }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-muted-foreground">{k}</span>
      <span
        className={cx(
          'rounded-md px-1.5 py-0.5',
          tone === 'success' && 'bg-success-subtle text-success-foreground',
          tone === 'danger' && 'bg-danger-subtle text-danger-foreground',
          (!tone || tone === 'muted') && 'bg-muted text-foreground',
        )}
      >
        {v}
      </span>
    </div>
  );
}

function UseAuthExample() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <div className="divide-y divide-border rounded-xl bg-card px-4 font-mono text-xs shadow-xs">
      <Row k="isAuthenticated" v={String(isAuthenticated)} tone={isAuthenticated ? 'success' : 'danger'} />
      <Row k="isLoading" v={String(isLoading)} />
      <Row k="user" v={user ? 'object' : 'null'} />
      <Row k="methods" v="login() · logout()" />
    </div>
  );
}

function UseUserExample() {
  const { user, isLoading } = useUser();

  if (isLoading) return <Hint>Loading…</Hint>;
  if (!user) return <Hint>Not signed in, so user is null.</Hint>;

  return (
    <div className="divide-y divide-border rounded-xl bg-card px-4 font-mono text-xs shadow-xs">
      <Row k="user.name" v={user.name} />
      <Row k="user.email" v={user.email} />
      <div className="flex items-center justify-between gap-4 py-2">
        <span className="text-muted-foreground">user.id</span>
        <span className="truncate">{user.id}</span>
      </div>
    </div>
  );
}

function AuthModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-center">
      <button type="button" onClick={() => setIsOpen(true)} className={button.primary}>
        Open Auth Modal
      </button>

      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode="signin"
        showEmailPassword
        onSuccess={() => {
          setIsOpen(false);
          alert('Successfully signed in!');
        }}
        branding={{
          appName: 'Hypery',
        }}
      />
    </div>
  );
}
