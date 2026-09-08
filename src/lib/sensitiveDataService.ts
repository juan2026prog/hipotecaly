// ==============================================================================
// HIPOTECALY: Servicio de Protección de Datos Sensibles y Desbloqueo por Etapa
// ==============================================================================

import { supabase } from './supabase';
import { getTenantPrivacyRules } from './tenantRulesService';
import { isModuleEnabled } from './tenantModulesService';

export interface ProtectedContactInfo {
  phone: string;
  email: string;
  isPhoneMasked: boolean;
  isEmailMasked: boolean;
  canDownloadDocuments: boolean;
}

export interface DisclosureAuditLog {
  id?: string;
  application_id: string;
  user_id?: string;
  data_category: 'phone' | 'email' | 'full_document' | 'sensitive_summary';
  reason: string;
  disclosed_at: string;
}

/**
 * Enmascara un número telefónico (ej: 099 123 456 -> 09X XXX 456)
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '09X XXX XXX';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 6) return '09X XXX XXX';
  const prefix = clean.slice(0, 2);
  const suffix = clean.slice(-3);
  return `${prefix}X XXX ${suffix}`;
}

/**
 * Enmascara un correo electrónico (ej: juan.perez@ejemplo.com -> j***@ejemplo.com)
 */
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'c***@correo.com';
  const [user, domain] = email.split('@');
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
  return `${maskedUser}@${domain}`;
}

/**
 * Enmascara una Cédula de Identidad de Uruguay (ej: 1.234.567-8 -> 1.234.***-* o 48901234 -> 4.890.***-*)
 */
export function maskCedula(ci?: string): string {
  if (!ci) return '•.•••.•••-•';
  const digits = ci.replace(/\D/g, '');
  if (digits.length < 6) return '•.•••.•••-•';
  if (digits.length === 8) {
    const formatted = `${digits[0]}.${digits.slice(1, 4)}.${digits.slice(4, 7)}-${digits[7]}`;
    return `${formatted.slice(0, 6)}***-*`;
  }
  return `${digits.slice(0, 3)}***-*`;
}

/**
 * Enmascara una cuenta bancaria o tarjeta (ej: 123456783812 -> **** 3812)
 */
export function maskBankAccount(account?: string): string {
  if (!account) return '**** ****';
  const clean = account.replace(/\s+/g, '');
  if (clean.length < 4) return '**** ****';
  const last4 = clean.slice(-4);
  return `**** ${last4}`;
}

/**
 * Enmascara un RUT / Número de Identificación Tributaria (ej: 211234560012 -> 21.***.***.0012)
 */
export function maskTaxId(taxId?: string): string {
  if (!taxId) return '21.***.***.****';
  const digits = taxId.replace(/\D/g, '');
  if (digits.length < 8) return '21.***.***.****';
  const prefix = digits.slice(0, 2);
  const suffix = digits.slice(-4);
  return `${prefix}.***.***.${suffix}`;
}

/**
 * Enmascara un nombre completo (ej: Juan Pérez -> J*** P***)
 */
export function maskName(fullName?: string): string {
  if (!fullName) return 'U***';
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((p) => (p.length > 1 ? `${p[0]}***` : p))
    .join(' ');
}

/**
 * Enmascara una dirección física eliminando número de puerta y apartamento
 */
export function maskAddress(address?: string): string {
  if (!address) return 'Ubicación Reservada';
  return address.replace(/\b\d{2,5}\b/g, '[Altura Reservada]').replace(/\b(apto|apartamento|unidad)\s*([A-Za-z0-9]+)/gi, '[Unidad Reservada]');
}

const STATUS_PROGRESSION: Record<string, number> = {
  draft: 1,
  submitted: 2,
  info_review: 3,
  property_analysis: 4,
  matching_lenders: 5,
  offer_available: 6,
  approved: 7,
  formalization: 8,
  active: 9,
  completed: 10,
};

/**
 * Resuelve si los datos sensibles están desbloqueados según el estado del expediente y las reglas del tenant
 */
export async function getProtectedContactInfo(
  tenantId: string,
  applicationStatus: string,
  rawPhone: string = '',
  rawEmail: string = '',
  currentUserId?: string,
  applicationId?: string
): Promise<ProtectedContactInfo> {
  const protectedEnabled = await isModuleEnabled(tenantId, 'protected_contact_enabled');

  if (!protectedEnabled) {
    return {
      phone: rawPhone,
      email: rawEmail,
      isPhoneMasked: false,
      isEmailMasked: false,
      canDownloadDocuments: true,
    };
  }

  const privacyRules = await getTenantPrivacyRules(tenantId);
  const currentLevel = STATUS_PROGRESSION[applicationStatus] || 1;
  const phoneLevel = STATUS_PROGRESSION[privacyRules.revealPhoneAtStatus] || 7;
  const emailLevel = STATUS_PROGRESSION[privacyRules.revealEmailAtStatus] || 7;
  const downloadLevel = STATUS_PROGRESSION[privacyRules.allowDocumentDownloadAtStatus] || 8;

  const canRevealPhone = currentLevel >= phoneLevel;
  const canRevealEmail = currentLevel >= emailLevel;
  const canDownloadDocs = currentLevel >= downloadLevel;

  // Registrar auditoría si los datos se revelan
  if (canRevealPhone && applicationId && currentUserId) {
    recordDataAccessAudit(applicationId, currentUserId, 'phone', 'Desbloqueo automático por avance de estado');
  }

  return {
    phone: canRevealPhone ? rawPhone : maskPhone(rawPhone),
    email: canRevealEmail ? rawEmail : maskEmail(rawEmail),
    isPhoneMasked: !canRevealPhone,
    isEmailMasked: !canRevealEmail,
    canDownloadDocuments: canDownloadDocs,
  };
}

/**
 * Registra un acceso auditado en audit_logs / data_disclosures
 */
export async function recordDataAccessAudit(
  applicationId: string,
  userId: string,
  dataCategory: 'phone' | 'email' | 'full_document' | 'sensitive_summary',
  reason: string
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      application_id: applicationId,
      user_id: userId,
      action: 'sensitive_data_accessed',
      details: {
        category: dataCategory,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Audit log safe fallback
  }
}
