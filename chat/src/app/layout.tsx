import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hypery Chat',
  description: 'AI-powered chat interface',
  applicationName: 'Hypery Chat',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Chat',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#3B82F6',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}

