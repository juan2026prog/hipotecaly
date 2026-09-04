import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface RadioCardOption<T extends string | number> {
  value: T;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface RadioCardGroupProps<T extends string | number> {
  options: RadioCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  error?: string;
  columns?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export function RadioCardGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  error,
  columns = 2,
  className,
}: RadioCardGroupProps<T>) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-5',
  }[columns];

  return (
    <div className="w-full text-left">
      {label && <label className="block text-sm font-semibold text-slate-text mb-2">{label}</label>}
      <div className={twMerge(clsx('grid gap-2.5', gridCols, className))}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;

          return (
            <button
              type="button"
              key={String(option.value)}
              onClick={() => onChange(option.value)}
              className={clsx(
                'min-h-[46px] p-3.5 rounded-card border text-left transition-all duration-150 relative flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-green select-none',
                isSelected
                  ? 'border-brand-green bg-brand-green-light/50 text-navy shadow-sm'
                  : 'border-slate-border bg-white hover:border-slate-300 text-slate-text'
              )}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <div className="flex items-center space-x-2.5">
                  {Icon && (
                    <Icon
                      className={clsx(
                        'w-4 h-4 shrink-0',
                        isSelected ? 'text-brand-green' : 'text-slate-400'
                      )}
                    />
                  )}
                  <span className={clsx('text-xs font-bold block', isSelected ? 'text-navy' : 'text-slate-800')}>
                    {option.title}
                  </span>
                </div>
                {option.badge && (
                  <span className="text-[10px] bg-brand-green/20 text-brand-green-dark px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {option.badge}
                  </span>
                )}
              </div>
              {option.description && (
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {option.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
