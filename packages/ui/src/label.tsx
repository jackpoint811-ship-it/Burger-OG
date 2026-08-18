import * as React from 'react';
import { cn } from './cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-semibold leading-none text-text-primary select-none inline-flex items-center gap-1',
        className
      )}
      {...props}
    >
      {children}
      {required ? <span className="text-red-500 font-bold">*</span> : null}
    </label>
  );
}
