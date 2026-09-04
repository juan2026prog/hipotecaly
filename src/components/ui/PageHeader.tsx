import React from 'react';
import { clsx } from 'clsx';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-border text-left',
        className
      )}
    >
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-brand-green font-medium">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-semibold text-navy">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        {eyebrow && (
          <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center space-x-3 shrink-0">{actions}</div>}
    </div>
  );
};
