import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-btn transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-brand-green hover:bg-brand-green-hover text-white focus:ring-brand-green shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-navy border border-slate-border focus:ring-navy shadow-sm',
    outline: 'border-2 border-brand-green text-brand-green hover:bg-brand-green-light focus:ring-brand-green',
    ghost: 'text-navy hover:bg-slate-100 focus:ring-navy',
    navy: 'bg-navy hover:bg-navy-light text-white focus:ring-navy shadow-md',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-2 min-h-[38px]',
    md: 'text-sm px-5 py-2.5 min-h-[44px]',
    lg: 'text-base px-6 py-3.5 min-h-[48px] md:min-h-[50px]',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
};
