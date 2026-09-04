import React from 'react';
import { clsx } from 'clsx';
import { useTenant } from '../../contexts/TenantContext';

export interface TenantBrandProps {
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isWhite?: boolean;
  className?: string;
  customName?: string;
  customTagline?: string;
}

export const TenantBrand: React.FC<TenantBrandProps> = ({
  showTagline = false,
  size = 'md',
  isWhite = false,
  className,
  customName,
  customTagline,
}) => {
  const { tenant } = useTenant();
  const name = customName || tenant?.branding?.public_name || 'HIPOTECALY';
  const tagline =
    customTagline ||
    tenant?.branding?.tag_line ||
    'Financiación con garantía hipotecaria';

  const logoSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-7 h-7',
  }[size];

  const textSizes = {
    sm: 'text-sm font-bold',
    md: 'text-lg sm:text-xl font-extrabold',
    lg: 'text-2xl font-black',
  }[size];

  return (
    <div className={clsx('flex items-center space-x-3 text-left', className)}>
      <div
        className={clsx(
          logoSizes,
          'flex items-center justify-center shrink-0 border shadow-xs transition-transform',
          isWhite
            ? 'bg-navy border-navy-border'
            : 'bg-navy border-navy-border'
        )}
      >
        <svg className={svgSizes} viewBox="0 0 100 100" fill="none">
          <path
            d="M50 22L24 43V74C24 76.2 25.8 78 28 78H72C74.2 78 76 76.2 76 74V43L50 22Z"
            stroke="var(--brand-green, #2DA674)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M43 78V56C43 52.1 46.1 49 50 49C53.9 49 57 52.1 57 56V78"
            stroke="var(--brand-green, #2DA674)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="leading-tight">
        <span
          className={clsx(
            textSizes,
            'tracking-tight block truncate',
            isWhite ? 'text-white' : 'text-navy'
          )}
        >
          {name}
        </span>
        {showTagline && (
          <span
            className={clsx(
              'text-[10px] uppercase font-semibold tracking-wider block mt-0.5 truncate',
              isWhite ? 'text-slate-400' : 'text-slate-muted'
            )}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
