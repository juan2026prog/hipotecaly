// ==============================================================================
// HIPOTECALY: Native Supabase TOTP Multi-Factor Authentication (MFA) Service
// Implementación 100% nativa sin servicios pagos ni dependencias externas
// Proporciona enrolamiento TOTP, verificación de desafíos y validación de AAL (AAL1 / AAL2)
// ==============================================================================

import { supabase } from './supabase.js';

export interface MfaEnrollmentResponse {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: 'totp' | 'phone';
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

export interface AssuranceLevelInfo {
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  currentAuthenticationMethods: string[];
}

export class MfaService {
  /**
   * Determina si un rol de usuario requiere obligatoriamente MFA/2FA según la política de seguridad
   */
  public static isMfaRequiredForRole(role?: string | null): boolean {
    if (!role) return false;
    const elevatedRoles = ['super_admin', 'tenant_owner', 'tenant_admin', 'notary', 'bank_admin'];
    return elevatedRoles.includes(role);
  }

  /**
   * Inicia el proceso de enrolamiento TOTP generando un secreto y código QR nativo de Supabase
   */
  public static async enrollTotp(friendlyName = 'Hipotecaly Authenticator'): Promise<{
    data?: MfaEnrollmentResponse;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Hipotecaly',
        friendlyName,
      });

      if (error || !data) {
        return { error: error?.message || 'Error al iniciar enrolamiento MFA' };
      }

      return { data: data as MfaEnrollmentResponse };
    } catch (err: any) {
      return { error: err?.message || 'Excepción al enrolar factor MFA' };
    }
  }

  /**
   * Completa el enrolamiento o valida un desafío con el código de 6 dígitos (TOTP)
   * Si es exitoso, eleva la sesión actual al nivel de aseguramiento AAL2
   */
  public static async verifyTotpChallenge(
    factorId: string,
    code: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!factorId || !code || code.trim().length !== 6) {
        return { success: false, error: 'Código de 6 dígitos requerido.' };
      }

      // 1. Crear el desafío
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeErr || !challengeData) {
        return { success: false, error: challengeErr?.message || 'Error al crear desafío MFA' };
      }

      // 2. Verificar el código proporcionado
      const { data: verifyData, error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyErr || !verifyData) {
        return { success: false, error: verifyErr?.message || 'Código TOTP incorrecto o expirado.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al verificar TOTP' };
    }
  }

  /**
   * Lista todos los factores MFA asociados a la cuenta del usuario actual
   */
  public static async listFactors(): Promise<{
    factors: MfaFactor[];
    hasVerifiedMfa: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        return { factors: [], hasVerifiedMfa: false, error: error.message };
      }

      const factors = (data?.totp || []).concat((data as any)?.all || []) as MfaFactor[];
      const hasVerifiedMfa = factors.some((f) => f.status === 'verified');

      return { factors, hasVerifiedMfa };
    } catch (err: any) {
      return { factors: [], hasVerifiedMfa: false, error: err?.message };
    }
  }

  /**
   * Obtiene el nivel de aseguramiento de autenticación actual (aal1 o aal2)
   */
  public static async getAssuranceLevel(): Promise<{
    level: AssuranceLevelInfo | null;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        return { level: null, error: error.message };
      }
      return { level: data as AssuranceLevelInfo };
    } catch (err: any) {
      return { level: null, error: err?.message };
    }
  }

  /**
   * Desenrola / Elimina un factor MFA existente
   */
  public static async unenrollFactor(factorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }
}
