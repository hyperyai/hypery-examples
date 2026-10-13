import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { HyperyProvider } from '@hyperyai/sdk';
// The SDK's components ship their own stylesheet: import it once.
import '@hyperyai/sdk/styles.css';
import './globals.css';
import { SiteHeader } from '@/components/site-header';

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Hypery Auth Demo',
  description: 'Demo app showcasing @hyperyai/sdk package',
};

// Picks light/dark before paint: a saved choice, else the OS preference.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.add(t)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <HyperyProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || '',
            redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '',
            gatewayUrl: process.env.NEXT_PUBLIC_AUTH_URL || '',
            scopes: ['read', 'write', 'ai:chat', 'ai:completions', 'ai:models', 'billing:read'],
            storage: 'localStorage',
          }}
        >
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
          </div>
        </HyperyProvider>
      </body>
    </html>
  );
}
