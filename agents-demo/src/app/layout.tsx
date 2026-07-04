import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hypery Agents Demo',
  description: 'Interactive demonstration of multi-agent orchestration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}


