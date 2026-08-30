import * as React from 'react';
import { cn } from './cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-surface-raised/90 bg-gradient-to-r from-surface-raised/80 via-surface-card/60 to-surface-raised/80 bg-[length:200%_100%] transition-opacity duration-300',
        className
      )}
      {...props}
    />
  );
}
