// ==============================================================================
// HIPOTECALY: Servicio de WhatsApp Directo Oficial (wa.me)
// Arquitectura de control en dos niveles (Super Admin & Organización)
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { getTenantModules } from './tenantModulesService';
import { logAuditEvent } from './auditService';

export interface OrganizationWhatsAppSettings {
  tenantId: string;
  enabled: boolean;
  phoneNumber: string;
  buttonText: string;
  defaultMessage: string;
  updatedAt?: string;
}

export interface TenantWhatsAppStatus {
  platformEnabled: boolean; // Nivel 1: Super Admin
  organizationSettings: OrganizationWhatsAppSettings; // Nivel 2: Organización
}

export interface PublicWhatsAppConfig {
  isVisible: boolean;
  phone: string;
  buttonText: string;
  message: string;
  waUrl: string;
}

// Valores por defecto para organizaciones nuevas o demo
export const DEFAULT_WHATSAPP_SETTINGS: OrganizationWhatsAppSettings = {
  tenantId: 'd0000000-0000-0000-0000-000000000001',
  enabled: true,
  phoneNumber: '59899123456',
  buttonText: '¿Necesitás ayuda?',
  defaultMessage: 'Hola, estoy visitando su sitio web y quisiera hacer una consulta.',
};

// Cache en memoria por tenant
const whatsappSettingsCache = new Map<string, OrganizationWhatsAppSettings>();

// Event emitter simple para reactividad en la misma ventana
const listeners = new Set<(tenantId: string, settings: OrganizationWhatsAppSettings) => void>();

export function subscribeToWhatsAppSettings(
  callback: (tenantId: string, settings: OrganizationWhatsAppSettings) => void
): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners(tenantId: string, settings: OrganizationWhatsAppSettings) {
  listeners.forEach((cb) => {
    try {
      cb(tenantId, settings);
    } catch {
      // Ignorar errores en callbacks
    }
  });
}

/**
 * Normaliza un número telefónico eliminando +, espacios, guiones, paréntesis y caracteres no numéricos.
 * Ej: "+598 99 123-456" -> "59899123456"
 */
export function normalizeWhatsappNumber(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[^0-9]/g, '');
}

/**
 * Valida si un número telefónico es válido para WhatsApp internacional (E.164 sin +).
 * Para Uruguay (prefijo 598): debe tener entre 11 y 12 dígitos (598 + 8 o 9 dígitos).
 * Internacional general: entre 8 y 15 dígitos.
 */
export function isValidWhatsappNumber(raw: string): boolean {
  const clean = normalizeWhatsappNumber(raw);
  if (!clean) return false;

  // Rango general E.164 (sin +): 8 a 15 dígitos numéricos
  if (clean.length < 8 || clean.length > 15) {
    return false;
  }

  // Validación específica para números de Uruguay (598)
  if (clean.startsWith('598')) {
    // 598 + celular (9X XXX XXX = 8 dígitos) -> 11 dígitos
    // o 598 + fijo Montevideo (2XXX XXXX = 8 dígitos) -> 11 dígitos
    // o 598 + fijo Interior (4XXX XXXX = 8 dígitos) -> 11 dígitos
    return clean.length >= 11 && clean.length <= 12;
  }

  return true;
}

/**
 * Genera la URL oficial de wa.me con codificación segura mediante encodeURIComponent.
 * Ej: https://wa.me/59899123456?text=Hola%2C%20quisiera%20consultar
 */
export function generateWhatsappUrl(rawPhone: string, message?: string): string {
  const phone = normalizeWhatsappNumber(rawPhone);
  if (!phone) return '';

  const cleanMessage = message?.trim() || '';
  if (!cleanMessage) {
    return `https://wa.me/${phone}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(cleanMessage)}`;
}

/**
 * Obtiene el estado consolidado de WhatsApp (Nivel 1 Super Admin + Nivel 2 Organización)
 */
export async function getTenantWhatsAppStatus(
  tenantId: string,
  organizationName?: string
): Promise<TenantWhatsAppStatus> {
  // 1. Obtener Nivel 1: Master Switch de Super Admin
  const modules = await getTenantModules(tenantId);
  const platformEnabled = modules.whatsapp_direct_enabled ?? true;

  // 2. Obtener Nivel 2: Configuración de la Organización
  let orgSettings: OrganizationWhatsAppSettings = {
    ...DEFAULT_WHATSAPP_SETTINGS,
    tenantId,
    defaultMessage: organizationName
      ? `Hola, estoy visitando el sitio de ${organizationName} y quisiera hacer una consulta.`
      : DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
  };

  // Intentar cargar desde Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tenant_whatsapp_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (!error && data) {
        orgSettings = {
          tenantId: data.tenant_id,
          enabled: Boolean(data.enabled),
          phoneNumber: data.phone_number || '',
          buttonText: data.button_text || DEFAULT_WHATSAPP_SETTINGS.buttonText,
          defaultMessage: data.default_message || DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
          updatedAt: data.updated_at,
        };
        whatsappSettingsCache.set(tenantId, orgSettings);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('tenant_whatsapp_' + tenantId, JSON.stringify(orgSettings));
        }
        return { platformEnabled, organizationSettings: orgSettings };
      }
    } catch {
      // Continuar con caché o localStorage
    }
  }

  // Cache en memoria
  if (whatsappSettingsCache.has(tenantId)) {
    return { platformEnabled, organizationSettings: whatsappSettingsCache.get(tenantId)! };
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem('tenant_whatsapp_' + tenantId);
      if (cached) {
        const parsed = JSON.parse(cached);
        whatsappSettingsCache.set(tenantId, parsed);
        return { platformEnabled, organizationSettings: parsed };
      }
    } catch {
      // Ignorar error de parsing
    }
  }

  // Si es Estudio Nova demo, precargar mensaje con su nombre
  if (tenantId === 'd0000000-0000-0000-0000-000000000001') {
    orgSettings.defaultMessage = 'Hola, estoy visitando el sitio de Estudio Nova y quisiera hacer una consulta.';
  }

  whatsappSettingsCache.set(tenantId, orgSettings);
  return { platformEnabled, organizationSettings: orgSettings };
}

/**
 * Guarda la configuración de WhatsApp de la organización (Nivel 2)
 */
export async function saveTenantWhatsAppSettings(
  tenantId: string,
  settings: Partial<OrganizationWhatsAppSettings>
): Promise<{ success: boolean; error?: string }> {
  // Normalizar número antes de persistir
  const cleanPhone = settings.phoneNumber ? normalizeWhatsappNumber(settings.phoneNumber) : '';

  // Si se intenta activar con un número inválido, retornar error
  if (settings.enabled && cleanPhone && !isValidWhatsappNumber(cleanPhone)) {
    return {
      success: false,
      error: 'El número de WhatsApp ingresado no tiene un formato internacional válido (ej. 59899123456).',
    };
  }

  const current = whatsappSettingsCache.get(tenantId) || {
    ...DEFAULT_WHATSAPP_SETTINGS,
    tenantId,
  };

  const updated: OrganizationWhatsAppSettings = {
    ...current,
    ...settings,
    tenantId,
    phoneNumber: cleanPhone !== undefined ? cleanPhone : current.phoneNumber,
    buttonText: (settings.buttonText ?? current.buttonText).slice(0, 60),
    defaultMessage: settings.defaultMessage ?? current.defaultMessage,
    updatedAt: new Date().toISOString(),
  };

  // Actualizar caché y localStorage
  whatsappSettingsCache.set(tenantId, updated);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('tenant_whatsapp_' + tenantId, JSON.stringify(updated));
    } catch {
      // Ignorar error de storage
    }
  }

  notifyListeners(tenantId, updated);

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('tenant_whatsapp_settings').upsert(
        {
          tenant_id: tenantId,
          enabled: updated.enabled,
          phone_number: updated.phoneNumber,
          button_text: updated.buttonText,
          default_message: updated.defaultMessage,
          updated_at: updated.updatedAt,
        },
        { onConflict: 'tenant_id' }
      );

      if (error) {
        // Log local pero permitir funcionamiento en memoria
        console.warn('Error al guardar en Supabase tenant_whatsapp_settings:', error.message);
      }
    } catch (err) {
      console.warn('Fallo de conexión al guardar configuración de WhatsApp:', err);
    }
  }

  return { success: true };
}

/**
 * Obtiene la configuración segura para consumo del frontend público.
 * Solo retorna los campos necesarios para renderizar el botón y wa.me.
 */
export async function getPublicWhatsAppConfig(
  tenantId: string,
  organizationName?: string
): Promise<PublicWhatsAppConfig> {
  const { platformEnabled, organizationSettings } = await getTenantWhatsAppStatus(tenantId, organizationName);

  const hasValidPhone = isValidWhatsappNumber(organizationSettings.phoneNumber);
  const isVisible = platformEnabled && organizationSettings.enabled && hasValidPhone;

  const phone = normalizeWhatsappNumber(organizationSettings.phoneNumber);
  const buttonText = organizationSettings.buttonText || '¿Necesitás ayuda?';
  const message = organizationSettings.defaultMessage || 'Hola, quisiera hacer una consulta.';

  const waUrl = isVisible ? generateWhatsappUrl(phone, message) : '';

  return {
    isVisible,
    phone,
    buttonText,
    message,
    waUrl,
  };
}

/**
 * Registra el clic en el botón de WhatsApp con fines analíticos no invasivos.
 * NUNCA registra contenido de conversaciones.
 */
export async function trackWhatsAppClick(
  tenantId: string,
  pagePath: string,
  source: string = 'floating_button'
): Promise<void> {
  try {
    await logAuditEvent({
      organizationId: tenantId,
      userName: 'Visitante Público',
      userRole: 'public',
      action: 'WHATSAPP_CONTACT_CLICK',
      module: 'WhatsApp Directo',
      recordIdentifier: `whatsapp-${tenantId.slice(0, 8)}`,
      metadata: {
        page: pagePath,
        source,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // No interrumpir la navegación si falla el log
  }
}
