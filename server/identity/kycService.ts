// ==============================================================================
// SERVER IDENTITY: Orquestador Server-Side para Sesiones KYC y Didit API v3
// ==============================================================================

import crypto from 'crypto';
import { supabaseAdmin } from '../supabase.js';
import { HmacVerifier } from './hmacVerifier.js';
import { KycSessionInput, KycStatus } from '../../src/lib/siteos/identity/types.js';
import { normalizeDiditStatus } from '../../src/lib/siteos/identity/stateMachine.js';
import { DiditClient } from './diditClient.js';

export class KycService {
  /**
   * Obtiene la configuración de identidad del tenant
   */
  public static async getTenantSettings(tenantId: string) {
    try {
      const { data } = await supabaseAdmin
        .from('tenant_identity_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (data) return data;
    } catch {
      // Ignorar
    }

    return {
      kyc_enabled: true,
      kyc_provider: process.env.KYC_PROVIDER || 'didit',
      kyc_mode: process.env.KYC_MODE || 'mock',
      signature_enabled: true,
      signature_provider: process.env.SIGNATURE_PROVIDER || 'mock',
      signature_mode: process.env.SIGNATURE_MODE || 'mock',
      byok_enabled: false,
    };
  }

  /**
   * Resuelve el proveedor adecuado (Mock o Didit con credenciales del tenant o plataforma)
   */
  public static async resolveProvider(tenantId: string) {
    const settings = await this.getTenantSettings(tenantId);
    const providerName = (settings.kyc_provider || process.env.KYC_PROVIDER || 'didit').toLowerCase();
    const mode = settings.kyc_mode || process.env.KYC_MODE || 'mock';

    if (providerName === 'didit') {
      return new DiditKycProvider({
        baseUrl: process.env.DIDIT_BASE_URL,
        apiKey: process.env.DIDIT_API_KEY,
        workflowId: process.env.DIDIT_WORKFLOW_ID,
        webhookSecret: process.env.DIDIT_WEBHOOK_SECRET,
        mode: mode as any,
      });
    }

    return new MockKycProvider();
  }

  /**
   * Crea una sesión de verificación KYC server-side
   */
  public static async createSession(input: KycSessionInput) {
    const provider = await this.resolveProvider(input.tenantId);
    const session = await provider.createSession(input);

    const nowIso = new Date().toISOString();

    // Persistir en base de datos
    try {
      await supabaseAdmin.from('identity_verifications').insert({
        tenant_id: input.tenantId,
        user_id: input.userId || null,
        case_id: input.caseId || null,
        provider: session.provider,
        provider_session_id: session.sessionId,
        session_url: session.sessionUrl || null,
        mode: session.mode,
        status: session.status,
        expires_at: session.expiresAt || null,
        metadata: session.metadata || {},
        created_at: nowIso,
        updated_at: nowIso,
      });
    } catch (dbErr) {
      console.error('[KycService] Error guardando sesión en DB:', dbErr);
    }

    return session;
  }

  /**
   * Consulta el estado de una verificación (soporta Didit y registros históricos)
   */
  public static async getStatus(sessionId: string) {
    try {
      const { data } = await supabaseAdmin
        .from('identity_verifications')
        .select('*')
        .eq('provider_session_id', sessionId)
        .maybeSingle();

      if (data) return data;
    } catch {
      // Fallback
    }

    return {
      provider_session_id: sessionId,
      provider: 'didit',
      status: 'in_progress',
      mode: process.env.KYC_MODE || 'mock',
    };
  }

  /**
   * Procesa un webhook de Didit con verificación X-Signature-V2 timing-safe e idempotencia
   */
  public static async handleDiditWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | undefined>
  ) {
    const signature =
      headers['x-signature-v2'] ||
      headers['X-Signature-V2'] ||
      headers['x-signature'] ||
      headers['x-hmac-signature'] ||
      '';
    const secret = process.env.DIDIT_WEBHOOK_SECRET || '';
    const mode = process.env.KYC_MODE || 'mock';

    // 1. Validar HMAC X-Signature-V2 si está en modo test/sandbox o live y hay secreto configurado
    if (mode !== 'mock' && secret) {
      const isValid = HmacVerifier.verifyHmacSha256(rawBody, signature, secret);
      if (!isValid) {
        throw new Error('Didit X-Signature-V2 verification failed');
      }
    }

    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf-8') : rawBody;
    const payload = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;

    const sessionId =
      payload.session_id ||
      payload.sessionId ||
      payload.verification?.id ||
      payload.id;

    const eventId =
      headers['x-event-id'] ||
      payload.event_id ||
      payload.id ||
      `evt_didit_${sessionId}_${Date.now()}`;

    const payloadHash = crypto.createHash('sha256').update(bodyStr).digest('hex');

    // 2. Comprobar idempotencia
    try {
      const { data: existingEvent } = await supabaseAdmin
        .from('provider_webhook_events')
        .select('processed')
        .eq('provider', 'didit')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingEvent?.processed) {
        return {
          handled: true,
          duplicate: true,
          sessionId,
          status: 'verified',
        };
      }
    } catch {
      // Continuar
    }

    // 3. Normalizar estado
    const rawStatus =
      payload.status ||
      payload.action ||
      payload.event ||
      payload.decision ||
      'in_progress';
    const normalizedStatus: KycStatus = normalizeDiditStatus(rawStatus);

    // 4. Actualizar verificación en DB
    const nowIso = new Date().toISOString();
    try {
      await supabaseAdmin
        .from('identity_verifications')
        .update({
          status: normalizedStatus,
          provider_status: rawStatus,
          decision_code: payload.decision_code || payload.code || null,
          reason: payload.reason || null,
          completed_at: normalizedStatus === 'verified' ? nowIso : null,
          updated_at: nowIso,
        })
        .eq('provider_session_id', sessionId);
    } catch (err) {
      console.error('[KycService] Error actualizando verificación:', err);
    }

    // 5. Registrar evento procesado (idempotencia)
    try {
      await supabaseAdmin.from('provider_webhook_events').upsert(
        {
          provider: 'didit',
          event_id: eventId,
          payload_hash: payloadHash,
          processed: true,
          processed_at: nowIso,
          status: 'processed',
          response_payload: { status: normalizedStatus },
        },
        { onConflict: 'provider,event_id' }
      );
    } catch {
      // Ignorar
    }

    return {
      handled: true,
      sessionId,
      status: normalizedStatus,
      rawStatus,
    };
  }

  /**
   * Reconciliación de estado mediante Decision API / Polling oficial
   * GET https://verification.didit.me/v3/session/{session_id}/decision/
   */
  public static async reconcileDecision(sessionId: string) {
    const client = new DiditClient();
    if (!client.isConfigured() || sessionId.startsWith('didit_mock_')) {
      return {
        sessionId,
        status: 'verified' as KycStatus,
        providerStatus: 'Approved',
        reconciled: true,
      };
    }

    try {
      const decision = await client.getDecision(sessionId);
      const normalizedStatus = normalizeDiditStatus(decision.status);
      const nowIso = new Date().toISOString();

      await supabaseAdmin
        .from('identity_verifications')
        .update({
          status: normalizedStatus,
          provider_status: decision.status,
          decision_code: decision.decision_code || null,
          reason: decision.reason || null,
          completed_at: normalizedStatus === 'verified' ? nowIso : null,
          updated_at: nowIso,
        })
        .eq('provider_session_id', sessionId);

      return {
        sessionId,
        status: normalizedStatus,
        providerStatus: decision.status,
        reconciled: true,
      };
    } catch (err: any) {
      return {
        sessionId,
        error: err.message,
        reconciled: false,
      };
    }
  }

  /**
   * Forzar resultado de test para QA / Super Admin (solo en modos mock y test/sandbox)
   */
  public static async forceKycTestResult(params: {
    adminId: string;
    sessionId: string;
    forcedStatus: KycStatus;
    reason?: string;
  }) {
    const mode = process.env.KYC_MODE || 'mock';
    if (mode === 'live') {
      throw new Error('No está permitido forzar estados en ambiente LIVE de producción.');
    }

    const nowIso = new Date().toISOString();
    let updatedRecord: any = {
      provider_session_id: params.sessionId,
      provider: 'didit',
      status: params.forcedStatus,
      provider_status: `FORCED_${params.forcedStatus.toUpperCase()}`,
      decision_code: `TEST_FORCED_${params.forcedStatus.toUpperCase()}`,
      reason: params.reason || `Estado forzado manualmente por Super Admin (${params.adminId})`,
      completed_at: params.forcedStatus === 'verified' ? nowIso : null,
      updated_at: nowIso,
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('identity_verifications')
        .update({
          status: params.forcedStatus,
          provider_status: `FORCED_${params.forcedStatus.toUpperCase()}`,
          decision_code: `TEST_FORCED_${params.forcedStatus.toUpperCase()}`,
          reason: params.reason || `Estado forzado manualmente por Super Admin (${params.adminId})`,
          completed_at: params.forcedStatus === 'verified' ? nowIso : null,
          updated_at: nowIso,
        })
        .eq('provider_session_id', params.sessionId)
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedRecord = data;
      }
    } catch (dbErr) {
      // Usar fallback en memoria si la base de datos no está disponible en tests
    }

    // Registrar en auditoría de seguridad
    try {
      await supabaseAdmin.from('identity_verification_events').insert({
        verification_id: updatedRecord?.id || 'simulated-verif-id',
        tenant_id: updatedRecord?.tenant_id || 'a0000000-0000-0000-0000-000000000001',
        provider: updatedRecord?.provider || 'didit',
        event_type: 'TEST_STATUS_FORCED',
        status: params.forcedStatus,
        metadata: {
          forcedByAdmin: params.adminId,
          reason: params.reason,
          mode,
        },
      });
    } catch {
      // Ignorar
    }

    return updatedRecord;
  }
}
