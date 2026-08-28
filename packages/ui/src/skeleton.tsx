import * as React from 'react';
import { cn } from './cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-surface-raised/80', className)}
      {...props}
    />
  );
}
