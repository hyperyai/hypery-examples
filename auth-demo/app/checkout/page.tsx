'use client';

/**
 * Auth + charge demo — the seamless press-buy flow.
 *
 * Neither control below is wrapped in <Protect>: an unauthenticated visitor can
 * click either one and the SDK walks them through login → (add card) → charge in
 * a popup (desktop) or redirect (mobile / blocked popups), per interactionMode.
 */

import { BuyButton, useCheckout, useHyperyAuth } from '@hyperyai/sdk';
import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { C, Card, Page, PageHeader, button } from '@/components/ui';

export default function CheckoutDemoPage() {
  const { isAuthenticated, interactionMode } = useHyperyAuth();
  const { checkout, status, isRunning } = useCheckout();
  const [topupResult, setTopupResult] = useState<string>('');

  const buyCredits = async () => {
    setTopupResult('');
    const result = await checkout({ kind: 'topup', usdAmount: 5 });
    setTopupResult(
      result.status === 'success'
        ? '✅ Added $5 of credits'
        : result.status === 'error'
          ? `⚠️ ${result.error?.message ?? 'Failed'}`
          : result.status === 'redirecting'
            ? '↪ Redirecting…'
            : 'Cancelled',
    );
  };

  return (
    <Page narrow>
      <PageHeader
        icon={<CreditCard />}
        title="Auth + charge"
        description="Neither button needs you signed in: the SDK walks you through sign-in, adding a card and the charge."
      />
      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
          Signed in: <b className="text-foreground">{isAuthenticated ? 'yes' : 'no'}</b>
        </span>
        <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
          Interaction mode: <b className="text-foreground">{interactionMode}</b>
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="flex flex-col p-6">
          <h2 className="font-semibold">Marketplace purchase</h2>
          <p className="mt-1 flex-1 text-sm text-muted-foreground">
            <C>{'<BuyButton>'}</C> charges a seller app via Stripe Connect.
          </p>
          <div className="mt-5">
            <BuyButton
              appId={process.env.NEXT_PUBLIC_DEMO_SELLER_APP_ID || 'app_demo_seller'}
              amountCents={499}
              description="Pro upgrade (demo)"
              onSuccess={(r) => alert(`Paid! paymentIntent=${r.paymentIntentId}`)}
              onError={(e) => alert(`Purchase failed: ${e.message}`)}
            />
          </div>
        </Card>
        <Card className="flex flex-col p-6">
          <h2 className="font-semibold">Buy AI credits</h2>
          <p className="mt-1 flex-1 text-sm text-muted-foreground">
            <C>useCheckout()</C> tops up your own balance.
          </p>
          <div className="mt-5">
            <button type="button" onClick={buyCredits} disabled={isRunning} className={button.secondary}>
              {isRunning ? `${status}…` : 'Add $5 credits'}
            </button>
          </div>
          {topupResult && <p className="mt-3 text-sm text-muted-foreground">{topupResult}</p>}
        </Card>
      </div>
    </Page>
  );
}
