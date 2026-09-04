import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, checked, disabled, onChange, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        <label
          htmlFor={checkboxId}
          className={clsx(
            'flex items-start space-x-3 cursor-pointer select-none group min-h-[44px] py-1',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="sr-only peer"
              {...props}
            />
            <div
              className={twMerge(
                clsx(
                  'w-5 h-5 rounded border border-slate-300 bg-white transition-all flex items-center justify-center text-white',
                  'peer-checked:bg-brand-green peer-checked:border-brand-green',
                  'peer-focus:ring-2 peer-focus:ring-brand-green peer-focus:ring-offset-1',
                  error ? 'border-rose-400' : 'group-hover:border-brand-green',
                  className
                )
              )}
            >
              <Check className={clsx('w-3.5 h-3.5 stroke-[3] transition-opacity', checked ? 'opacity-100' : 'opacity-0')} />
            </div>
          </div>
          <div className="text-left">
            {label && <span className="block text-sm font-semibold text-slate-text leading-snug">{label}</span>}
            {description && <p className="text-xs text-slate-muted mt-0.5 leading-relaxed">{description}</p>}
          </div>
        </label>
        {error && <p className="mt-1 text-xs text-rose-600 pl-8">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
