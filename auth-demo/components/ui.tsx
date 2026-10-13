/**
 * The demo shell's own building blocks, in the same look as hypery.ai.
 * (The SDK components style themselves from @hyperyai/sdk/styles.css.)
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,box-shadow] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

export const button = {
  primary: `${buttonBase} h-9 px-4 bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover`,
  secondary: `${buttonBase} h-9 px-4 bg-field text-foreground hover:bg-field-hover`,
  ghost: `${buttonBase} h-9 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground`,
};

export function Page({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <main className={cx('mx-auto w-full px-4 py-10 sm:px-6 sm:py-14', narrow ? 'max-w-3xl' : 'max-w-6xl')}>
      {children}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex items-start gap-4">
      {icon && (
        <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary-subtle-foreground [&_svg]:size-5">
          {icon}
        </span>
      )}
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">{description}</p>
        )}
      </div>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx('rounded-2xl bg-card shadow-card', className)}>{children}</div>;
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

/** Dark code panel with a copy button, used for every snippet. */
export function CodeBlock({ code, title, className }: { code: string; title?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className={cx('group relative overflow-hidden rounded-xl bg-code text-code-foreground', className)}>
      {title && (
        <div className="flex h-10 items-center border-b border-white/5 px-4 font-mono text-xs text-syntax-comment">
          {title}
        </div>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className={cx(
          'absolute right-2 flex size-8 items-center justify-center rounded-md text-syntax-comment opacity-0 transition hover:bg-white/10 hover:text-code-foreground focus-visible:opacity-100 group-hover:opacity-100',
          title ? 'top-1' : 'top-2',
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Inline `code`. */
export function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>
  );
}

export function Note({
  tone = 'neutral',
  title,
  children,
  icon,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'info';
  title?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const tones = {
    neutral: 'bg-muted text-muted-foreground',
    success: 'bg-success-subtle text-success-foreground',
    warning: 'bg-warning-subtle text-warning-foreground',
    info: 'bg-primary-subtle text-primary-subtle-foreground',
  };
  return (
    <div className={cx('flex items-start gap-3 rounded-xl px-4 py-3 text-sm', tones[tone])}>
      {icon && <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span>}
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function BackLink({ href = '/', children = 'Back to overview' }: { href?: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span aria-hidden>←</span> {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx('inline-block size-5 animate-spin rounded-full border-2 border-border-strong border-t-primary', className)}
    />
  );
}
