import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : generatedId);
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-slate-text mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={twMerge(
            clsx(
              'w-full p-4 rounded-btn border text-slate-text bg-white transition-colors duration-150 text-sm md:text-base font-normal',
              'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green',
              'placeholder:text-slate-subtle',
              error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-border hover:border-slate-400',
              className
            )
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-rose-600 font-medium">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-slate-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
