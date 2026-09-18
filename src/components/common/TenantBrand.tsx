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

  const isNova = tenant?.slug === 'estudio-nova' || tenant?.slug === 'nova' || tenant?.slug === 'estudio_nova';

  const logoImageClasses = {
    sm: 'h-8 max-h-8 w-auto max-w-[150px] object-contain shrink-0',
    md: 'h-10 max-h-10 w-auto max-w-[190px] object-contain shrink-0',
    lg: 'h-14 max-h-14 w-auto max-w-[240px] object-contain shrink-0',
  }[size];

  const squareFallbackSizes = {
    sm: 'w-8 h-8 rounded-lg text-sm',
    md: 'w-10 h-10 rounded-xl text-lg sm:text-xl',
    lg: 'w-12 h-12 rounded-2xl text-2xl',
  }[size];

  const textSizes = {
    sm: 'text-sm font-bold',
    md: 'text-lg sm:text-xl font-extrabold',
    lg: 'text-2xl font-black',
  }[size];

  const hasCustomLogo = Boolean(tenant?.branding?.logo_url);

  return (
    <div className={clsx('flex items-center space-x-3 text-left', className)}>
      {hasCustomLogo ? (
        <img
          src={tenant?.branding?.logo_url}
          alt={name}
          className={clsx(logoImageClasses, 'rounded-sm')}
          onError={(e) => {
            // Fallback visual si la imagen falla al cargar
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : isNova ? (
        <div
          className={clsx(
            squareFallbackSizes,
            'relative flex items-center justify-center font-serif font-black text-white shadow-xs transition-transform shrink-0',
            isWhite ? 'bg-[#173a5e] border border-white/20' : 'bg-[#173a5e]'
          )}
        >
          <span>{name.charAt(0) || 'N'}</span>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f4b43b]" />
        </div>
      ) : (
        <div
          className={clsx(
            squareFallbackSizes,
            'relative flex items-center justify-center font-black text-white shadow-xs transition-transform shrink-0',
            isWhite ? 'border border-white/20' : ''
          )}
          style={{ backgroundColor: tenant?.branding?.primary_color || '#071A35' }}
        >
          <span>{name.charAt(0) || 'H'}</span>
        </div>
      )}

      {/* Si no hay logo cargado, mostramos el nombre en tipografía. Si hay logo, mantenemos la tipografía limpia o personalizada si se especifica */}
      {!hasCustomLogo && (
        <div className="leading-tight">
          <span
            className={clsx(
              textSizes,
              isNova && 'font-serif tracking-tight',
              isWhite ? 'text-white' : isNova ? 'text-[#173a5e]' : 'text-navy',
              'block truncate'
            )}
          >
            {name}
          </span>
          {showTagline && (
            <span
              className={clsx(
                'text-[10px] uppercase font-semibold tracking-wider block mt-0.5 truncate',
                isWhite ? 'text-slate-400' : isNova ? 'text-[#245f91]' : 'text-slate-muted'
              )}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
