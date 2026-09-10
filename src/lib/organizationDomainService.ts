// ==============================================================================
// HIPOTECALY: Servicio de Gestión Segura de Dominios de Organización (Fase 7A/7B)
// Fuente Única de Verdad, Normalización Estricta, Prevención Takeover y Auditoría
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { logTenantAuditEvent } from './organizationHomeService';

export type DomainStatus =
  | 'pending_verification'
  | 'dns_pending'
  | 'verifying'
  | 'verified'
  | 'active'
  | 'failed'
  | 'error';

export type SslStatus = 'pending' | 'issuing' | 'active' | 'failed' | 'expired';

export interface OrganizationDomain {
  id: string;
  organizationId: string;
  domain: string;
  status: DomainStatus;
  isPrimary: boolean;
  isVerified: boolean;
  sslStatus: SslStatus;
  verificationToken: string;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  vercelDomainId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normaliza un nombre de dominio:
 * - lowercase
 * - elimina http://, https://
 * - elimina paths (/...), queries (?...) y fragmentos (#...)
 * - elimina puertos (:3000)
 * - trim whitespace
 */
export function normalizeDomain(rawDomain: string): { domain: string; isValid: boolean; error?: string } {
  if (!rawDomain || typeof rawDomain !== 'string') {
    return { domain: '', isValid: false, error: 'El dominio es obligatorio.' };
  }

  let cleaned = rawDomain.trim().toLowerCase();

  // Eliminar protocolo si fue pegado
  if (cleaned.startsWith('https://')) cleaned = cleaned.slice(8);
  if (cleaned.startsWith('http://')) cleaned = cleaned.slice(7);

  // Eliminar slash final y paths/query/hash
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('#')[0];

  // Eliminar puerto si existiera
  cleaned = cleaned.split(':')[0];

  // Validar formato de hostname (RFC 1123 / DNS estándar)
  const hostnameRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

  if (!hostnameRegex.test(cleaned)) {
    return {
      domain: cleaned,
      isValid: false,
      error: 'Formato de dominio inválido. Ingrese un hostname válido (ej: creditos.miestudio.uy).',
    };
  }

  // Prevenir dominios de la propia plataforma como custom domain
  if (cleaned === 'hipotecaly.vercel.app' || cleaned === 'hipotecaly.com' || cleaned === 'localhost') {
    return {
      domain: cleaned,
      isValid: false,
      error: 'No se puede registrar un dominio del sistema central como dominio personalizado.',
    };
  }

  return { domain: cleaned, isValid: true };
}

/**
 * Obtiene la lista de dominios de una organización
 */
export async function getOrganizationDomains(orgId: string): Promise<OrganizationDomain[]> {
  if (!orgId) return [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('organization_domains')
        .select('*')
        .eq('organization_id', orgId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data.map(mapDbToDomain);
      }
    } catch (err) {
      console.error('[OrganizationDomainService] Error al obtener dominios:', err);
    }
  }

  return [];
}

/**
 * Registra un nuevo dominio para la organización
 */
export async function addOrganizationDomain(
  orgId: string,
  rawDomain: string,
  isPrimary = false,
  options?: { actorId?: string }
): Promise<{ success: boolean; data?: OrganizationDomain; error?: string }> {
  const { domain, isValid, error: normError } = normalizeDomain(rawDomain);
  if (!isValid) {
    return { success: false, error: normError };
  }

  if (isSupabaseConfigured) {
    try {
      // 1. Generar token criptográfico seguro
      const uniqueToken = 'hp_verify_' + (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).substring(2) + Date.now().toString(36));

      // 2. Si se marca como primary, verificar si ya existen otros y desmarcar
      if (isPrimary) {
        await supabase
          .from('organization_domains')
          .update({ is_primary: false })
          .eq('organization_id', orgId);
      }

      // 3. Insertar con valores iniciales forzados no-verificados
      const { data, error } = await supabase
        .from('organization_domains')
        .insert({
          organization_id: orgId,
          domain: domain,
          is_primary: isPrimary,
          is_verified: false,
          status: 'pending_verification',
          ssl_status: 'pending',
          verification_token: uniqueToken,
          verified_at: null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: `El dominio '${domain}' ya está registrado en la plataforma por otra organización.` };
        }
        return { success: false, error: error.message };
      }

      const created = mapDbToDomain(data);

      // 4. Log de auditoría
      await logTenantAuditEvent(
        orgId,
        'domain_added',
        {},
        { domain, is_primary: isPrimary },
        options?.actorId
      );

      return { success: true, data: created };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error al registrar dominio' };
    }
  }

  return { success: false, error: 'Base de datos no configurada' };
}

/**
 * Asigna un dominio como primario
 */
export async function setPrimaryOrganizationDomain(
  orgId: string,
  domainId: string,
  options?: { actorId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!orgId || !domainId) return { success: false, error: 'Parámetros inválidos' };

  if (isSupabaseConfigured) {
    try {
      // Desmarcar todos
      await supabase
        .from('organization_domains')
        .update({ is_primary: false })
        .eq('organization_id', orgId);

      // Marcar el seleccionado
      const { data, error } = await supabase
        .from('organization_domains')
        .update({ is_primary: true })
        .eq('id', domainId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      await logTenantAuditEvent(
        orgId,
        'domain_primary_changed',
        {},
        { domain_id: domainId, domain: data.domain },
        options?.actorId
      );

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error al cambiar dominio primario' };
    }
  }

  return { success: true };
}

/**
 * Elimina un dominio de la organización
 */
export async function deleteOrganizationDomain(
  orgId: string,
  domainId: string,
  domainName: string,
  options?: { actorId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!orgId || !domainId) return { success: false, error: 'Parámetros inválidos' };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('organization_domains')
        .delete()
        .eq('id', domainId)
        .eq('organization_id', orgId);

      if (error) return { success: false, error: error.message };

      await logTenantAuditEvent(
        orgId,
        'domain_removed',
        { domain: domainName },
        {},
        options?.actorId
      );

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar dominio' };
    }
  }

  return { success: true };
}

/**
 * Solicita la verificación real de DNS a través de la API Serverless de HIPOTECALY
 */
export async function requestDomainVerification(
  orgId: string,
  domainId: string
): Promise<{
  success: boolean;
  configured: boolean;
  isVerified?: boolean;
  sslStatus?: SslStatus;
  statusMessage?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/domains/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId, domainId }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        configured: false,
        error: errJson.message || 'Error al comunicar con el servidor de verificación.',
      };
    }

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    return {
      success: false,
      configured: false,
      error: err instanceof Error ? err.message : 'Error inesperado de red al verificar dominio.',
    };
  }
}

function mapDbToDomain(d: any): OrganizationDomain {
  return {
    id: d.id,
    organizationId: d.organization_id,
    domain: d.domain,
    status: d.status || 'pending_verification',
    isPrimary: Boolean(d.is_primary),
    isVerified: Boolean(d.is_verified),
    sslStatus: d.ssl_status || 'pending',
    verificationToken: d.verification_token,
    verifiedAt: d.verified_at,
    lastCheckedAt: d.last_checked_at,
    lastError: d.last_error,
    vercelDomainId: d.vercel_domain_id,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}
