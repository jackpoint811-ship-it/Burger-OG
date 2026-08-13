import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2', className)} {...props} />;
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide', className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]', className)} {...props} />;
}

export function SectionHeader({ title, subtitle, action, className }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}><div><h2 className='text-2xl font-extrabold text-[var(--color-text-primary)]'>{title}</h2>{subtitle ? <p className='mt-1 text-sm text-[var(--color-text-secondary)]'>{subtitle}</p> : null}</div>{action}</div>;
}

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return <div className={cn('rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface-raised)] p-4 text-center', className)}><p className='font-semibold text-[var(--color-text-primary)]'>{title}</p><p className='mt-1 text-sm text-[var(--color-text-muted)]'>{description}</p></div>;
}

export function StatusPill({ children, className }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold', className)}>{children}</span>;
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button className={cn('h-8 w-8 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-0 text-[var(--color-text-primary)]', className)} {...props} />;
}
