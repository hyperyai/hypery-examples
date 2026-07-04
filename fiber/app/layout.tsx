import type { Metadata } from "next";
import { HyperyProvider } from '@hypery/auth';
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Model Generator - Hypery Hub",
  description: "Create and modify 3D models using AI chat interface",
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
            scopes: ['ai:chat', 'ai:models', 'ai:images'],
          }}
        >
          {children}
        </HyperyProvider>
      </body>
    </html>
  );
}

