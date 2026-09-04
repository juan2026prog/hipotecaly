// ==============================================================================
// HIPOTECALY: Motor Centralizado de Telemetría y Analytics Base
// Soporte para eventos Marketplace B2C y Plataforma SaaS B2B
// ==============================================================================

type AnalyticsEvent =
  // Marketplace Events
  | 'simulator_start'
  | 'simulator_complete'
  | 'application_start'
  | 'application_complete'
  // SaaS Events
  | 'saas_page_view'
  | 'demo_click'
  | 'demo_view'
  | 'saas_lead_start'
  | 'saas_lead_submit';

interface EventProperties {
  [key: string]: any;
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const analytics = {
  /**
   * Registra un evento de telemetría en dataLayer, gtag y consola estructurada
   */
  track(event: AnalyticsEvent, properties?: EventProperties) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      ...properties,
    };

    // 1. Google Tag Manager / dataLayer
    if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }

    // 2. Google Analytics 4 gtag
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, properties);
    }

    // 3. Log en entorno de desarrollo
    if (import.meta.env.DEV) {
      console.log(`[Analytics] 📊 Evento emitido: ${event}`, payload);
    }
  },

  // Atajos tipados de Marketplace
  simulatorStart(props?: EventProperties) {
    this.track('simulator_start', props);
  },

  simulatorComplete(props?: EventProperties) {
    this.track('simulator_complete', props);
  },

  applicationStart(props?: EventProperties) {
    this.track('application_start', props);
  },

  applicationComplete(props?: EventProperties) {
    this.track('application_complete', props);
  },

  // Atajos tipados de SaaS
  saasPageView(pageName: string, props?: EventProperties) {
    this.track('saas_page_view', { page: pageName, ...props });
  },

  demoClick(demoType: string, props?: EventProperties) {
    this.track('demo_click', { demoType, ...props });
  },

  demoView(demoType: string, props?: EventProperties) {
    this.track('demo_view', { demoType, ...props });
  },

  saasLeadStart(props?: EventProperties) {
    this.track('saas_lead_start', props);
  },

  saasLeadSubmit(company: string, props?: EventProperties) {
    this.track('saas_lead_submit', { company, ...props });
  },
};
