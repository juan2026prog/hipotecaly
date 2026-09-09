// ==============================================================================
// HIPOTECALY: Botón Flotante de WhatsApp Directo (wa.me)
// Componente accesible, responsive, oficial y con soporte multi-organización
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  getPublicWhatsAppConfig,
  subscribeToWhatsAppSettings,
  trackWhatsAppClick,
  PublicWhatsAppConfig,
} from '../../lib/whatsappService';

interface WhatsAppFloatingButtonProps {
  tenantId: string;
  organizationName?: string;
  previewMode?: boolean;
  overrideConfig?: {
    enabled?: boolean;
    phoneNumber?: string;
    buttonText?: string;
    defaultMessage?: string;
    platformEnabled?: boolean;
  };
  className?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  tenantId,
  organizationName,
  previewMode = false,
  overrideConfig,
  className = '',
}) => {
  const [config, setConfig] = useState<PublicWhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(!previewMode);

  // Cargar configuración reactiva
  useEffect(() => {
    if (previewMode && overrideConfig) {
      const isPlatformOn = overrideConfig.platformEnabled ?? true;
      const isOrgOn = overrideConfig.enabled ?? true;
      const hasPhone = Boolean(overrideConfig.phoneNumber && overrideConfig.phoneNumber.length >= 8);

      setConfig({
        isVisible: isPlatformOn && isOrgOn && hasPhone,
        phone: overrideConfig.phoneNumber || '',
        buttonText: overrideConfig.buttonText || '¿Necesitás ayuda?',
        message: overrideConfig.defaultMessage || '',
        waUrl: '#preview',
      });
      setLoading(false);
      return;
    }

    if (!tenantId) return;

    let isMounted = true;
    getPublicWhatsAppConfig(tenantId, organizationName).then((c) => {
      if (isMounted) {
        setConfig(c);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToWhatsAppSettings((updatedTenantId) => {
      if (updatedTenantId === tenantId && isMounted) {
        getPublicWhatsAppConfig(tenantId, organizationName).then(setConfig);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [tenantId, organizationName, previewMode, overrideConfig]);

  if (loading) return null;

  // Si no está en modo preview y no debe ser visible según la lógica de dos niveles
  if (!previewMode && (!config || !config.isVisible || !config.waUrl)) {
    return null;
  }

  const buttonText = (overrideConfig?.buttonText || config?.buttonText || '¿Necesitás ayuda?').trim();
  const waUrl = overrideConfig ? '#preview' : config?.waUrl || '#';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (previewMode) {
      e.preventDefault();
      return;
    }
    trackWhatsAppClick(tenantId, typeof window !== 'undefined' ? window.location.pathname : '/');
  };

  // Ícono oficial de WhatsApp SVG
  const WhatsAppIcon = () => (
    <svg
      className="w-7 h-7 fill-white shrink-0"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );

  // Si está en modo preview inline dentro de una tarjeta
  if (previewMode) {
    return (
      <div className={`inline-flex items-center gap-2 p-3 bg-emerald-500 rounded-2xl text-white shadow-md select-none ${className}`}>
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
          <WhatsAppIcon />
        </div>
        <div className="text-left pr-2">
          <span className="text-[10px] uppercase font-bold text-emerald-100 block tracking-wider">WhatsApp</span>
          <span className="text-xs font-bold text-white block">{buttonText}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 flex items-center group pointer-events-auto ${className}`}
      style={{
        bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
        right: 'max(1.5rem, env(safe-area-inset-right, 1.5rem))',
      }}
    >
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label={`${buttonText} - Contactar por WhatsApp`}
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white pl-3.5 pr-4 py-2.5 sm:py-3 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 focus:ring-offset-2"
      >
        <WhatsAppIcon />
        <span className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap drop-shadow-xs">
          {buttonText}
        </span>
      </a>
    </div>
  );
};
