// ==============================================================================
// HIPOTECALY: Componente Maestro Reutilizable OrganizationHero
// Utilizado tanto en la Home pública como en la Vista Previa del Backoffice
// ==============================================================================

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TenantBranding } from '../../lib/tenantService';
import { OrganizationHomeSettings, sanitizeLinkTarget } from '../../lib/organizationHomeService';

export interface OrganizationHeroProps {
  branding?: TenantBranding;
  homeSettings: OrganizationHomeSettings;
  className?: string;
  isInteractivePreview?: boolean;
}

export const OrganizationHero: React.FC<OrganizationHeroProps> = ({
  branding,
  homeSettings,
  className = '',
}) => {
  const accentColor = branding?.accent_color || '#f4b43b';
  const secondaryColor = branding?.secondary_color || '#102d49';

  // Determinación de modo de fondo
  const bgMode = homeSettings.heroBackgroundMode || 'image_overlay';
  const hasImage = (bgMode === 'image' || bgMode === 'image_overlay') && Boolean(homeSettings.heroBackgroundImageUrl);
  
  // Posición de imagen (left, center, right)
  const imagePosition = homeSettings.heroImagePosition || 'center';
  const bgPositionMap: Record<string, string> = {
    left: 'left center',
    center: 'center center',
    right: 'right center',
  };

  const bgPositionCss = bgPositionMap[imagePosition] || 'center center';
  const overlayOpacity = Math.max(0, Math.min(100, Number(homeSettings.heroOverlayOpacity ?? 65))) / 100;
  const overlayColor = homeSettings.heroOverlayColor || secondaryColor || '#102d49';
  const bgColor = homeSettings.heroBackgroundColor || secondaryColor || '#102d49';

  // Sanitización segura de destinos
  const primaryTarget = sanitizeLinkTarget(homeSettings.heroPrimaryCtaTarget || '#simulador');
  const secondaryTarget = sanitizeLinkTarget(homeSettings.heroSecondaryCtaTarget || '#como-funciona');

  return (
    <section
      id="inicio"
      className={`relative text-white py-16 sm:py-24 md:py-28 lg:py-32 overflow-hidden text-left transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: bgColor,
      }}
    >
      {/* 1. Capa de Imagen de Fondo (Cover) */}
      {hasImage && (
        <div
          className="absolute inset-0 z-0 bg-no-repeat transition-all duration-500"
          style={{
            backgroundImage: `url("${homeSettings.heroBackgroundImageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: bgPositionCss,
          }}
          aria-hidden="true"
        />
      )}

      {/* 2. Capa de Overlay de Color con Opacidad Configurable */}
      {bgMode === 'image_overlay' && hasImage && (
        <div
          className="absolute inset-0 z-1 transition-opacity duration-300"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
          aria-hidden="true"
        />
      )}

      {/* 3. Patrón de Puntos Sutil (Toggle) */}
      {homeSettings.heroPatternEnabled && (
        <div
          className="absolute inset-0 z-2 opacity-15 [background-size:24px_24px] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Degradado inferior suave para integración armónica con la siguiente sección */}
      <div className="absolute inset-0 z-2 bg-gradient-to-t from-[#0b2238]/60 via-transparent to-transparent pointer-events-none" />

      {/* 4. Contenedor de Contenido (Por encima de overlays: z-10) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl space-y-6 sm:space-y-7">
          
          {/* Eyebrow / Etiqueta */}
          {homeSettings.heroEyebrow && (
            <div>
              <div
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border shadow-sm backdrop-blur-sm"
                style={{
                  backgroundColor: `${accentColor}25`,
                  color: accentColor,
                  borderColor: `${accentColor}40`,
                }}
              >
                <span>{homeSettings.heroEyebrow}</span>
              </div>
            </div>
          )}

          {/* Título Principal (H1) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-white tracking-tight leading-[1.14] drop-shadow-sm">
            {homeSettings.heroTitle || 'Convertí el valor de tu inmueble en capital para avanzar.'}
          </h1>

          {/* Descripción / Bajada */}
          {homeSettings.heroDescription && (
            <p className="text-base sm:text-lg md:text-xl text-slate-100 max-w-2xl leading-relaxed font-light drop-shadow-sm">
              {homeSettings.heroDescription}
            </p>
          )}

          {/* Botones de Acción (CTAs) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            {/* CTA Principal */}
            {homeSettings.heroPrimaryCtaVisible && (
              <a
                href={primaryTarget}
                className="font-bold text-sm px-8 py-3.5 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center uppercase tracking-wider hover:brightness-105 active:scale-[0.98]"
                style={{
                  backgroundColor: accentColor,
                  color: '#0b2238',
                }}
              >
                <span>{homeSettings.heroPrimaryCtaText || 'SIMULAR FINANCIACIÓN'}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            )}

            {/* CTA Secundario */}
            {homeSettings.heroSecondaryCtaVisible && (
              <a
                href={secondaryTarget}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-7 py-3.5 rounded-lg border border-white/25 backdrop-blur-xs transition-all duration-200 flex items-center justify-center uppercase tracking-wider active:scale-[0.98]"
              >
                <span>{homeSettings.heroSecondaryCtaText || 'CÓMO FUNCIONA'}</span>
              </a>
            )}
          </div>

          {/* Línea Inferior de Confianza */}
          {homeSettings.heroTrustLine && (
            <p className="text-xs sm:text-sm text-slate-200 pt-3 border-t border-white/20 font-medium">
              {homeSettings.heroTrustLine}
            </p>
          )}

        </div>
      </div>
    </section>
  );
};
