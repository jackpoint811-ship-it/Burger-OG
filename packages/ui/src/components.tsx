import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Button } from './button';

export function SectionHeader({ title, subtitle, action, className }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-dashed border-line bg-surface-raised p-6 text-center', className)}>
      <p className="font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
    </div>
  );
}

export function StatusPill({ children, className }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-line bg-surface-raised px-2.5 py-1 text-xs font-semibold', className)}>
      {children}
    </span>
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn('h-9 w-9 rounded-xl', className)}
      {...props}
    />
  );
}
