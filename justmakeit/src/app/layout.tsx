import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { HyperyProvider } from '@hypery/sdk';

const inter = Inter({ subsets: ['latin'] });

// Metadata for the app
export const metadata = {
  title: 'JustMakeIt.AI - AI-Powered Development Environment',
  description: 'Model Context Protocol IDE with integrated AI chat and tools',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <HyperyProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!,
            redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
            gatewayUrl: process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'http://localhost:3001',
            scopes: ['read', 'write', 'ai:chat', 'ai:completions', 'ai:models', 'billing:read'],
          }}
        >
          {children}
        </HyperyProvider>
      </body>
    </html>
  );
}
