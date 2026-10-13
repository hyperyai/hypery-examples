'use client';

import { ModernAuthForm, SignedIn, SignedOut, UserProfile, useUser } from '@hyperyai/sdk';
import Link from 'next/link';
import { ArrowRight, Blocks, CreditCard, KeyRound, LayoutGrid, RefreshCw, ShieldCheck, Terminal } from 'lucide-react';
import { C, Card, CodeBlock, Page, Spinner, button } from '@/components/ui';

const SCOPES = ['read', 'write', 'ai:chat', 'ai:completions', 'ai:models', 'billing:read'];

const FEATURES = [
  { icon: ShieldCheck, title: 'OAuth 2.0 + PKCE', text: 'Standard, secret-free sign-in for public clients.' },
  { icon: RefreshCw, title: 'Auto token refresh', text: 'Sessions stay alive without you writing a line.' },
  { icon: Blocks, title: 'React-first', text: 'Hooks and drop-in components, themed with CSS variables.' },
];

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <SignedOutHome />
      </SignedOut>
      <SignedIn>
        <AuthenticatedContent />
      </SignedIn>
    </>
  );
}

function SignedOutHome() {
  return (
    <Page>
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-subtle px-3 py-1 text-xs font-medium text-primary-subtle-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            @hyperyai/sdk demo
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Sign-in, billing and AI for your app, in a few components.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            This app is built with the Hypery SDK. Sign in to try the hooks, protected routes and
            authenticated API calls, or browse every component first.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/examples" className={button.primary}>
              Browse components <ArrowRight />
            </Link>
            <a href="https://hypery.ai/docs" className={button.secondary} target="_blank" rel="noreferrer">
              Read the docs
            </a>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-card text-primary shadow-card">
                  <Icon className="size-4" />
                </span>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <ModernAuthForm branding={{ appName: 'the Hypery demo' }} showEmailPassword />
        </div>
      </div>
    </Page>
  );
}

function AuthenticatedContent() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-sm text-muted-foreground">
        <Spinner />
        Loading your account…
      </div>
    );
  }

  return (
    <Page>
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Signed in</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome, {user?.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Everything below is rendered with <C>@hyperyai/sdk</C> components and hooks.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserProfile showExtended />
        </div>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4 text-muted-foreground" /> Granted scopes
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SCOPES.map((scope) => (
              <li
                key={scope}
                className="inline-flex items-center gap-1.5 rounded-md bg-success-subtle px-2 py-1 font-mono text-xs text-success-foreground"
              >
                <span className="size-1.5 rounded-full bg-success" />
                {scope}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="mb-4 mt-12 text-xl font-semibold tracking-tight">Explore</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/examples', icon: LayoutGrid, title: 'Components', text: 'Every component and hook, live.' },
          { href: '/protected', icon: ShieldCheck, title: 'Protected page', text: 'Gate a route with <Protect>.' },
          { href: '/api-demo', icon: Terminal, title: 'API demo', text: 'Call Hypery with your token.' },
          { href: '/checkout', icon: CreditCard, title: 'Checkout', text: 'Buy and top up in one click.' },
        ].map(({ href, icon: Icon, title, text }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <Icon className="size-5 text-primary" />
            <p className="mt-4 flex items-center gap-1 font-semibold">
              {title}
              <ArrowRight className="size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-xl font-semibold tracking-tight">This page, in code</h2>
      <CodeBlock
        title="app/page.tsx"
        code={`import { SignedIn, SignedOut, ModernAuthForm, UserProfile } from '@hyperyai/sdk';
import '@hyperyai/sdk/styles.css';

export default function Home() {
  return (
    <>
      <SignedOut><ModernAuthForm showEmailPassword /></SignedOut>
      <SignedIn><UserProfile showExtended /></SignedIn>
    </>
  );
}`}
      />
    </Page>
  );
}
