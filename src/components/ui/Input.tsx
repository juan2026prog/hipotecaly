import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-text mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              'w-full min-h-[46px] md:min-h-[48px] px-4 rounded-btn border text-slate-text bg-white transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green',
              'placeholder:text-slate-subtle text-base',
              error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-border hover:border-slate-400',
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-slate-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
