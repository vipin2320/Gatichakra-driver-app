import React from 'react';
import { cn } from '../core/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: React.Key;
  elevated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-4',
        elevated ? 'shadow-lg shadow-slate-200/50' : 'border border-slate-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
