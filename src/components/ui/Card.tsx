import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'navy' | 'ghost' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'white',
  ...props
}) => {
  const baseStyles = 'rounded-card transition-all duration-200';

  const variants = {
    white: 'bg-white border border-slate-border shadow-card p-5 md:p-6',
    navy: 'bg-navy-surface text-white border border-navy-border shadow-floating p-5 md:p-6',
    ghost: 'bg-slate-50/70 border border-slate-border/60 p-4 md:p-5',
    highlight: 'bg-brand-green-light/40 border border-brand-green/20 p-5 md:p-6',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
};
