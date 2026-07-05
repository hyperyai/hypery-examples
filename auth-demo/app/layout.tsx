import type { Metadata } from 'next';
import { HyperyProvider } from '@hypery/sdk';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hypery Auth Demo',
  description: 'Demo app showcasing @hypery/sdk package',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <HyperyProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || '',
            redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
            gatewayUrl: process.env.NEXT_PUBLIC_AUTH_URL || '',
            scopes: ['read', 'write', 'ai:chat', 'ai:completions', 'ai:models', 'billing:read'],
            storage: 'localStorage',
          }}
        >
          {children}
        </HyperyProvider>
      </body>
    </html>
  );
}
