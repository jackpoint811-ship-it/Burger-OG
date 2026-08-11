import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white', className)} {...props} />;
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600', className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm', className)} {...props} />;
}

export function SectionHeader({ title, subtitle, action, className }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}><div><h2 className='text-2xl font-bold text-neutral-800'>{title}</h2>{subtitle ? <p className='mt-1 text-sm text-neutral-500'>{subtitle}</p> : null}</div>{action}</div>;
}

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return <div className={cn('rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center', className)}><p className='font-semibold text-neutral-700'>{title}</p><p className='mt-1 text-sm text-neutral-500'>{description}</p></div>;
}

export function StatusPill({ children, className }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold', className)}>{children}</span>;
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button className={cn('h-8 w-8 rounded-lg border border-neutral-200 bg-neutral-100 p-0 text-neutral-700', className)} {...props} />;
}
