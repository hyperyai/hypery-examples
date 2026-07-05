import type { Metadata } from "next";
import { HyperyProvider } from '@hyperyai/sdk';
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel AI SDK Demo - Hypery",
  description: "Demo using Vercel AI SDK with OAuth authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <HyperyProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || '',
            redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
            gatewayUrl: process.env.NEXT_PUBLIC_AUTH_URL || '',
            scopes: ['ai:chat', 'ai:models'],
            storage: 'localStorage',
          }}
        >
          {children}
        </HyperyProvider>
      </body>
    </html>
  );
}
