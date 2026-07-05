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
    <main style={{ maxWidth: 560, margin: '48px auto', padding: '0 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Auth + charge demo</h1>
      <p style={{ color: '#555', marginTop: 8 }}>
        Signed in: <b>{isAuthenticated ? 'yes' : 'no'}</b> · interaction mode:{' '}
        <b>{interactionMode}</b>
      </p>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Marketplace purchase (&lt;BuyButton&gt;)</h2>
        <p style={{ color: '#777', fontSize: 14, margin: '4px 0 12px' }}>
          Charges a seller app via Stripe Connect. Logs you in and adds a card first if needed.
        </p>
        <BuyButton
          appId={process.env.NEXT_PUBLIC_DEMO_SELLER_APP_ID || 'app_demo_seller'}
          amountCents={499}
          description="Pro upgrade (demo)"
          onSuccess={(r) => alert(`Paid! paymentIntent=${r.paymentIntentId}`)}
          onError={(e) => alert(`Purchase failed: ${e.message}`)}
        />
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Buy AI credits (useCheckout topup)</h2>
        <p style={{ color: '#777', fontSize: 14, margin: '4px 0 12px' }}>
          Tops up your own credit balance. Same login → add-card → charge chain.
        </p>
        <button
          type="button"
          onClick={buyCredits}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#111',
            color: '#fff',
            fontWeight: 600,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1,
          }}
        >
          {isRunning ? `${status}…` : 'Add $5 credits'}
        </button>
        {topupResult && <p style={{ marginTop: 12, fontSize: 14 }}>{topupResult}</p>}
      </section>
    </main>
  );
}
