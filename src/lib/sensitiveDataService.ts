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
