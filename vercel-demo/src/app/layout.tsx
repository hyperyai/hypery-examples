import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { HyperyProvider } from '@hypery/auth';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vercel AI SDK Demo - Hypery Hub',
  description: 'Demo of Vercel AI SDK with Hypery Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HyperyProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID || '',
            gatewayUrl: process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001',
            redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/callback',
            storage: 'localStorage',
            scopes: ['ai:chat', 'ai:models'],
          }}
        >
          {children}
        </HyperyProvider>
      </body>
    </html>
  );
}

