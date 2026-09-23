import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ActionsProps = { children: ReactNode; className?: string };
type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode };

export function Actions({ children, className }: ActionsProps) {
  return <div className={cn('flex items-center gap-1', className)} role="group" aria-label="Message actions">{children}</div>;
}

export function Action({ label, children, className, type = 'button', ...props }: ActionProps) {
  return <button {...props} type={type} className={cn('grid h-8 w-8 place-items-center rounded-md border border-[var(--color-ink-800)] bg-transparent text-[var(--color-paper-300)] transition hover:border-[var(--color-cyan-300)] hover:text-[var(--color-cyan-300)]', className)} aria-label={label} title={label}>{children}</button>;
}
