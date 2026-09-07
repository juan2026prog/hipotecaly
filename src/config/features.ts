// ==============================================================================
// HIPOTECALY: Feature Flags & Módulos Centralizados
// ==============================================================================

export interface FeatureFlags {
  /**
   * Controla la visibilidad y ejecución activa del Marketplace Hipotecario B2C
   * Por defecto: false (Marketplace congelado/frizado detrás de flag)
   */
  MARKETPLACE_ENABLED: boolean;

  /** Módulos Core Activos */
  DOCFLOW_ENABLED: boolean;
  KYC_DIDIT_ENABLED: boolean;
  SIGNATURE_FIRMAGUB_ENABLED: boolean;
  AI_ENABLED: boolean;
  SIMULATOR_EMBEDDABLE: boolean;
}

export const FEATURES: FeatureFlags = {
  // El Marketplace queda formalmente frizado en producción por defecto
  MARKETPLACE_ENABLED:
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_MARKETPLACE_ENABLED === 'true'
      ? true
      : false,
  DOCFLOW_ENABLED: true,
  KYC_DIDIT_ENABLED: true,
  SIGNATURE_FIRMAGUB_ENABLED: true,
  AI_ENABLED: true,
  SIMULATOR_EMBEDDABLE: true,
};

/**
 * Helper autoritativo para verificar si el Marketplace B2C se encuentra activo.
 */
export function isMarketplaceEnabled(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('HIPOTECALY_FEATURE_MARKETPLACE');
      if (local === 'true') return true;
      if (local === 'false') return false;
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
  }
  return FEATURES.MARKETPLACE_ENABLED;
}

/**
 * Permite alternar flags en entornos de testing o sesiones QA de Super Admin
 */
export function setFeatureFlagOverride(flag: keyof FeatureFlags, value: boolean): void {
  FEATURES[flag] = value;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`HIPOTECALY_FEATURE_${flag}`, String(value));
    } catch {
      // Ignorar
    }
  }
}
