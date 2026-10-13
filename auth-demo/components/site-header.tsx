'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AuthButton, SignedIn, SignedOut, UserButton } from '@hyperyai/sdk';
import { cx } from './ui';

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/examples', label: 'Components' },
  { href: '/protected', label: 'Protected' },
  { href: '/api-demo', label: 'API' },
  { href: '/modals', label: 'Modals' },
  { href: '/checkout', label: 'Checkout' },
];

export function Logo() {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-brand-1 via-brand-2 to-brand-3 text-sm font-bold text-white shadow-xs">
      H
    </span>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const toggle = () => {
    const next = !dark;
    const root = document.documentElement;
    root.classList.toggle('dark', next);
    root.classList.toggle('light', !next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
    setDark(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === '/callback' || pathname === '/gallery') return null;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo />
          <span>Hypery</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Auth demo
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle />
          <SignedOut>
            <AuthButton size="sm">Sign in</AuthButton>
          </SignedOut>
          <SignedIn>
            <UserButton showUserInfo size="sm" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
