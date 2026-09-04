import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type CardVariant =
  | 'default'
  | 'white'
  | 'elevated'
  | 'interactive'
  | 'dark'
  | 'navy'
  | 'ghost'
  | 'highlight'
  | 'highlighted';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'rounded-card transition-all duration-200 text-left';

  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variants: Record<CardVariant, string> = {
    default: 'bg-white border border-slate-border shadow-card',
    white: 'bg-white border border-slate-border shadow-card',
    elevated: 'bg-white border border-slate-border shadow-card-hover',
    interactive:
      'bg-white border border-slate-border shadow-card hover:shadow-card-hover hover:border-brand-green cursor-pointer',
    dark: 'bg-navy text-white border border-navy-border shadow-floating',
    navy: 'bg-navy-surface text-white border border-navy-border shadow-floating',
    ghost: 'bg-slate-50/70 border border-slate-border/60',
    highlight: 'bg-brand-green-light/40 border border-brand-green/20',
    highlighted: 'bg-brand-green-light/40 border border-brand-green/20',
  };

  return (
    <div
      className={twMerge(
        clsx(baseStyles, paddings[padding], variants[variant], className)
      )}
      {...props}
    >
      {children}
    </div>
  );
};
