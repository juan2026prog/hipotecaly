import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  currency?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  currency = 'USD',
  placeholder = '0',
  helperText,
  error,
  className,
}) => {
  const [displayValue, setDisplayValue] = React.useState<string>(
    value > 0 ? value.toLocaleString('es-UY') : ''
  );

  React.useEffect(() => {
    setDisplayValue(value > 0 ? value.toLocaleString('es-UY') : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numeric characters
    const cleanNumeric = e.target.value.replace(/\D/g, '');
    const num = cleanNumeric ? parseInt(cleanNumeric, 10) : 0;
    onChange(num);
  };

  const inputId = React.useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-text mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-4 text-slate-muted font-semibold text-sm pointer-events-none">
          {currency}
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={twMerge(
            clsx(
              'w-full min-h-[48px] md:min-h-[52px] pl-14 pr-4 rounded-btn border font-semibold text-lg text-navy bg-white transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green',
              error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-border hover:border-slate-400',
              className
            )
          )}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-muted">{helperText}</p>
      )}
    </div>
  );
};
