import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { TenantBrand } from '../common/TenantBrand';

export interface TransactionalHeaderProps {
  title?: string;
  publicId?: string;
  isSaved?: boolean;
  saving?: boolean;
  returnUrl?: string;
  returnLabel?: string;
}

export const TransactionalHeader: React.FC<TransactionalHeaderProps> = ({
  title = 'Solicitud de Financiación',
  publicId,
  isSaved = true,
  saving = false,
  returnUrl,
  returnLabel,
}) => {
  const { tenant } = useTenant();

  const isNova = tenant.slug === 'estudio-nova' || tenant.slug === 'nova' || tenant.slug === 'estudio_nova';
  const defaultReturnUrl = isNova ? '/demo/estudio-nova' : tenant.is_white_label ? `/org/${tenant.slug}` : '/';
  const targetReturnUrl = returnUrl || defaultReturnUrl;
  const targetReturnLabel = returnLabel || (isNova ? 'Volver a Estudio Nova' : 'Salir');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dfe5ea] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* Identidad del Tenant */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <Link to={targetReturnUrl} className="hover:opacity-90 transition-opacity shrink-0">
            <TenantBrand size="md" />
          </Link>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Información del Expediente en Header */}
          <div className="hidden sm:block text-left min-w-0">
            <span className="text-xs font-bold text-[#173a5e] block truncate">
              {title}
            </span>
            {publicId && (
              <span className="text-[11px] font-mono text-[#718096] block truncate">
                Expediente: {publicId}
              </span>
            )}
          </div>
        </div>

        {/* Estado de guardado y Salida */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Badge de Guardado */}
          <div className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[#245f91]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#245f91] shrink-0" />
            <span className="hidden md:inline">
              {saving ? 'Guardando...' : isSaved ? 'Guardado automáticamente' : 'Guardado local'}
            </span>
            <span className="md:hidden">
              {saving ? 'Guardando...' : 'Guardado'}
            </span>
          </div>

          {/* Botón de Retorno Seguro */}
          <Link
            to={targetReturnUrl}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#173a5e] hover:text-[#102d49] bg-[#f5f7f9] hover:bg-[#dfe5ea] px-3.5 py-2 rounded-lg border border-[#dfe5ea] transition-all"
            title="Volver"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">{targetReturnLabel}</span>
            <span className="sm:hidden">Salir</span>
          </Link>

        </div>

      </div>
    </header>
  );
};
