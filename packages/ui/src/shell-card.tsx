import type { ReactNode } from 'react';
import { cn } from './cn';

type ShellCardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
};

export function ShellCard({ title, subtitle, children, className }: ShellCardProps) {
  return (
    <section className={cn('rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-neutral-800">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
