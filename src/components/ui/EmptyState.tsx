import React from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={clsx(
        'p-8 md:p-12 text-center rounded-card border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center max-w-lg mx-auto my-6',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-xs">
          <Icon className="w-6 h-6 text-brand-green" />
        </div>
      )}
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <p className="text-xs text-slate-muted mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
