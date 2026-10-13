'use client';

/**
 * Every SDK component in its own frame, for screenshots (scripts/screenshots.mjs)
 * and for eyeballing the whole kit at once.
 *
 *   /gallery                       all components
 *   /gallery?theme=dark            dark theme
 *   /gallery?shot=auth-modal       one component, on a transparent page
 *
 * Auth state comes from HyperyTestProvider (@hyperyai/sdk/testing), and the two
 * gateway calls the components make are answered with sample data below, so no
 * Hypery account or network is needed.
 */

import {
  AuthButton,
  AuthModal,
  BuyButton,
  ErrorBoundary,
  InsufficientCreditsAlert,
  ModernAuthForm,
  RestrictionModal,
  SignIn,
  SignInForm,
  SignUp,
  SpendingLimitAlert,
  SubscribeButton,
  UserButton,
  UserProfile,
  WorkspaceSwitcher,
  parseError,
} from '@hyperyai/sdk';
import { HyperyTestProvider } from '@hyperyai/sdk/testing';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const GATEWAY = 'https://hypery.test';

const ADA = { id: 'usr_8f3k2m9q1x', name: 'Ada Lovelace', email: 'ada@analytical.engine' };

const MEMBERSHIPS = {
  activeOrganizationId: 'team_personal',
  activeWorkspaceId: 'ws_research',
  memberships: [
    {
      team: { id: 'team_personal', name: "Ada's Workspace", slug: 'ada', isPersonal: true, role: 'owner' },
      workspaces: [
        { id: 'ws_research', name: 'Research', slug: 'research', isDefault: true, icon: '🧮', role: 'owner', isActive: true },
        { id: 'ws_notes', name: 'Notes', slug: 'notes', isDefault: false, icon: '📝', role: 'owner', isActive: false },
      ],
    },
    {
      team: { id: 'team_engine', name: 'Analytical Engine', slug: 'engine', isPersonal: false, role: 'admin' },
      workspaces: [
        { id: 'ws_prod', name: 'Production', slug: 'prod', isDefault: true, icon: '⚙️', role: 'admin', isActive: false },
        { id: 'ws_staging', name: 'Staging', slug: 'staging', isDefault: false, icon: null, role: 'developer', isActive: false },
      ],
    },
  ],
};

const WALLET = {
  mode: 'prepaid',
  balance: { current: 120, reserved: 0, monthlySpent: 880, monthlyLimit: 1000 },
  paymentMethod: { exists: true, last4: '4242', brand: 'Visa' },
  autoTopUp: { enabled: false },
  lowBalance: { isLow: true, threshold: 200, current: 120 },
  topupTiers: [],
  settingsUrls: { billing: '/billing', topup: '/billing/topup', addPaymentMethod: '/billing/card' },
};

// Answer the gateway calls with the sample data above.
if (typeof window !== 'undefined' && !(window as any).__galleryFetch) {
  (window as any).__galleryFetch = true;
  const real = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith(GATEWAY)) {
      const body = url.includes('list_memberships') ? MEMBERSHIPS : url.includes('wallet/state') ? WALLET : {};
      return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
    }
    return real(input, init);
  };
}

const insufficient = parseError({
  error: {
    code: 'INSUFFICIENT_CREDITS',
    type: 'insufficient_credits',
    message: 'This request needs more credits than your team has.',
    available: 120,
    required: 450,
  },
});

const spending = parseError({
  error: {
    code: 'SPENDING_LIMIT_EXCEEDED',
    type: 'spending_limit_error',
    message: "You've reached your team's daily spending limit.",
    limitType: 'daily',
    limit: 1000,
    current: 1000,
    requested: 40,
    resetsAt: new Date(Date.now() + 5 * 3600_000).toISOString(),
  },
});

function Boom(): never {
  throw new Error('Could not load the conversation. Check your connection and try again.');
}

type Shot = { name: string; label: string; width?: number; modal?: boolean; click?: boolean; node: () => React.ReactNode };

const SHOTS: Shot[] = [
  {
    name: 'auth-modal',
    label: 'AuthModal',
    modal: true,
    node: () => <AuthModal isOpen onClose={() => {}} showEmailPassword branding={{ appName: 'Acme' }} />,
  },
  {
    name: 'sign-in-form',
    label: 'SignInForm',
    width: 400,
    node: () => <SignInForm showEmailPassword title="Sign in to Acme" description="Use your Hypery account to continue" />,
  },
  {
    name: 'modern-auth-form',
    label: 'ModernAuthForm',
    width: 440,
    node: () => <ModernAuthForm showEmailPassword branding={{ appName: 'Acme' }} />,
  },
  {
    name: 'sign-in',
    label: 'SignIn (primary, secondary, outline)',
    node: () => (
      <div className="flex gap-3">
        <SignIn variant="primary" buttonText="Sign in" />
        <SignIn variant="secondary" buttonText="Sign in" />
        <SignIn variant="outline" buttonText="Sign in" />
      </div>
    ),
  },
  {
    name: 'sign-up',
    label: 'SignUp (primary, secondary, outline)',
    node: () => (
      <div className="flex gap-3">
        <SignUp variant="primary" buttonText="Get started" />
        <SignUp variant="secondary" buttonText="Get started" />
        <SignUp variant="outline" buttonText="Get started" />
      </div>
    ),
  },
  {
    name: 'auth-button',
    label: 'AuthButton (primary, secondary, outline, ghost)',
    node: () => (
      <div className="flex items-center gap-3">
        <AuthButton variant="primary">Sign in</AuthButton>
        <AuthButton variant="secondary">Sign in</AuthButton>
        <AuthButton variant="outline">Sign in</AuthButton>
        <AuthButton variant="ghost">Sign in</AuthButton>
      </div>
    ),
  },
  { name: 'user-button', label: 'UserButton', node: () => <UserButton showUserInfo /> },
  {
    name: 'user-button-open',
    label: 'UserButton (open)',
    click: true,
    width: 264,
    node: () => (
      <div className="flex justify-end">
        <UserButton showUserInfo />
      </div>
    ),
  },
  { name: 'user-profile', label: 'UserProfile', width: 440, node: () => <UserProfile showExtended /> },
  {
    name: 'workspace-switcher',
    label: 'WorkspaceSwitcher (open)',
    click: true,
    width: 288,
    node: () => <WorkspaceSwitcher />,
  },
  {
    name: 'buy-button',
    label: 'BuyButton',
    node: () => <BuyButton appId="app_demo" amountCents={499} description="Pro upgrade" />,
  },
  {
    name: 'subscribe-button',
    label: 'SubscribeButton',
    node: () => <SubscribeButton planId="plan_pro" priceCents={1200} interval="month" />,
  },
  {
    name: 'insufficient-credits-alert',
    label: 'InsufficientCreditsAlert',
    width: 440,
    node: () => <InsufficientCreditsAlert error={insufficient} onAddCredits={() => {}} />,
  },
  {
    name: 'spending-limit-alert',
    label: 'SpendingLimitAlert',
    width: 440,
    node: () => <SpendingLimitAlert error={spending} onRetry={() => {}} onUpgradeLimits={() => {}} />,
  },
  {
    name: 'restriction-modal',
    label: 'RestrictionModal',
    modal: true,
    node: () => (
      <RestrictionModal
        error={{ code: 'INSUFFICIENT_CREDITS', message: 'Add funds to keep chatting with the assistant.' }}
        clientId="demo"
        gatewayUrl={GATEWAY}
        getAccessToken={async () => 'test-access-token'}
        onClose={() => {}}
        onRetry={() => {}}
      />
    ),
  },
  {
    name: 'error-boundary',
    label: 'ErrorBoundary (fallback)',
    width: 440,
    node: () => (
      <ErrorBoundary onRetry={() => {}}>
        <Boom />
      </ErrorBoundary>
    ),
  },
];

function Gallery() {
  const params = useSearchParams();
  const only = params.get('shot');
  const theme = params.get('theme');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      const root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.classList.toggle('light', theme === 'light');
    }
    setReady(true);
  }, [theme]);

  const shots = only ? SHOTS.filter((s) => s.name === only) : SHOTS;

  return (
    <HyperyTestProvider user={ADA} gatewayUrl={GATEWAY}>
      {only && (
        // Single-shot mode: transparent page, and modal scrims hidden so only the dialog is captured.
        <style>{`html,body{background:transparent!important}.hy\\:bg-overlay{background:transparent!important;backdrop-filter:none!important}`}</style>
      )}
      <main className={only ? 'p-16' : 'mx-auto max-w-5xl px-6 py-12'} data-ready={ready || undefined}>
        {!only && (
          <header className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight">Component gallery</h1>
            <p className="mt-2 text-muted-foreground">
              Every SDK component, signed in as a sample user with{' '}
              <code className="font-mono text-sm">HyperyTestProvider</code>. Add <code className="font-mono text-sm">?shot=name</code>{' '}
              to show one, <code className="font-mono text-sm">?theme=dark</code> for dark.
            </p>
          </header>
        )}
        <div className={only ? '' : 'grid gap-10'}>
          {shots.map((s) => (
            <section key={s.name}>
              {!only && <h2 className="mb-3 font-mono text-sm text-muted-foreground">{s.label}</h2>}
              {s.modal && !only ? (
                <p className="text-sm text-subtle-foreground">
                  Open <a className="underline" href={`?shot=${s.name}`}>?shot={s.name}</a> to see this dialog.
                </p>
              ) : (
                <div
                  data-shot={s.name}
                  data-shot-modal={s.modal || undefined}
                  data-shot-click={s.click || undefined}
                  className="inline-block align-top"
                  style={s.width ? { width: s.width } : undefined}
                >
                  {s.node()}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </HyperyTestProvider>
  );
}

export default function GalleryPage() {
  return (
    <Suspense>
      <Gallery />
    </Suspense>
  );
}
