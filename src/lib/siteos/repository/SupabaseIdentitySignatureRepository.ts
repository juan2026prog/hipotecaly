// ==============================================================================
// SITEOS: Adaptador de Persistencia Supabase para Identidad y Firma Digital
// ==============================================================================

import { supabase } from '../../supabase';
import { KycDecision, KycSession, KycStatus, IdentityConsentInput } from '../identity/types';
import { SignatureProcess, SignatureStatus, SignerConfig } from '../signature/types';


export class SupabaseIdentitySignatureRepository {
  // ----------------------------------------------------------------------------
  // 1. IDENTITY & KYC
  // ----------------------------------------------------------------------------

  public static async createVerification(params: {
    tenantId: string;
    userId?: string;
    caseId?: string;
    session: KycSession;
  }) {
    const { data, error } = await supabase
      .from('identity_verifications')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId || null,
        case_id: params.caseId || null,
        provider: params.session.provider,
        provider_session_id: params.session.sessionId,
        session_url: params.session.sessionUrl || null,
        mode: params.session.mode,
        status: params.session.status,
        expires_at: params.session.expiresAt || null,
        metadata: params.session.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async getVerificationByCaseId(caseId: string) {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async getVerificationBySessionId(sessionId: string) {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('provider_session_id', sessionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async updateVerificationStatus(
    sessionId: string,
    status: KycStatus,
    decision?: KycDecision
  ) {
    const nowIso = new Date().toISOString();
    const updatePayload: any = {
      status,
      updated_at: nowIso,
    };

    if (decision) {
      updatePayload.provider_status = decision.providerStatus;
      updatePayload.decision_code = decision.decisionCode;
      updatePayload.reason_code = decision.reasonCode;
      updatePayload.reason = decision.reason;
      updatePayload.completed_at = decision.completedAt || nowIso;
      if (decision.metadata) {
        updatePayload.metadata = decision.metadata;
      }
    }

    const { data, error } = await supabase
      .from('identity_verifications')
      .update(updatePayload)
      .eq('provider_session_id', sessionId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async recordConsent(consent: IdentityConsentInput) {
    const { data, error } = await supabase
      .from('identity_consents')
      .insert({
        user_id: consent.userId || null,
        tenant_id: consent.tenantId,
        case_id: consent.caseId || null,
        consent_version: consent.consentVersion,
        purpose: consent.purpose,
        provider: consent.provider,
        ip_address: consent.ipAddress || null,
        user_agent: consent.userAgent || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ----------------------------------------------------------------------------
  // 2. DIGITAL SIGNATURE PROCESSES
  // ----------------------------------------------------------------------------

  public static async createSignatureProcess(params: {
    tenantId: string;
    caseId: string;
    process: SignatureProcess;
    signers: SignerConfig[];
    documents: Array<{
      documentId?: string;
      title: string;
      sha256Original: string;
      storagePath?: string;
    }>;
  }) {
    // 1. Insert proceso
    const { data: procData, error: procError } = await supabase
      .from('signature_processes')
      .insert({
        id: params.process.id.startsWith('sig_') ? undefined : params.process.id,
        tenant_id: params.tenantId,
        case_id: params.caseId,
        provider: params.process.provider,
        provider_process_id: params.process.processId,
        mode: params.process.mode,
        status: params.process.status,
        signer_count: params.process.signerCount,
        current_signer_index: 0,
        signing_url: params.process.signingUrl || null,
        return_url: params.process.returnUrl || null,
        expires_at: params.process.expiresAt || null,
        metadata: params.process.metadata || {},
      })
      .select()
      .single();

    if (procError) throw procError;
    const processDbId = procData.id;

    // 2. Insert firmantes
    if (params.signers.length > 0) {
      const signersRows = params.signers.map((s, idx) => ({
        signature_process_id: processDbId,
        user_id: s.userId || null,
        role: s.role,
        name: s.name,
        email: s.email,
        document_country: s.documentCountry || 'UY',
        document_type: s.documentType || 'CI',
        order_index: idx,
        status: s.status || 'pending',
      }));

      await supabase.from('signature_signers').insert(signersRows);
    }

    // 3. Insert documentos
    if (params.documents.length > 0) {
      const docRows = params.documents.map((d) => ({
        signature_process_id: processDbId,
        source_document_id: d.documentId || null,
        title: d.title,
        original_storage_path: d.storagePath || null,
        sha256_original: d.sha256Original,
        status: 'pending',
      }));

      await supabase.from('signature_documents').insert(docRows);
    }

    return procData;
  }

  public static async getSignatureProcessesByCaseId(caseId: string) {
    const { data: procs, error } = await supabase
      .from('signature_processes')
      .select(`
        *,
        signers:signature_signers(*),
        documents:signature_documents(*)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return procs || [];
  }

  public static async updateSignatureStatus(
    processId: string,
    status: SignatureStatus,
    extra: {
      providerStatus?: string;
      completedAt?: string;
    } = {}
  ) {
    const { data, error } = await supabase
      .from('signature_processes')
      .update({
        status,
        provider_status: extra.providerStatus || null,
        completed_at: extra.completedAt || (status === 'signed' ? new Date().toISOString() : null),
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${processId},provider_process_id.eq.${processId}`)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async recordSignedDocument(params: {
    processId: string;
    documentId: string;
    signedStoragePath: string;
    sha256Signed: string;
  }) {
    const { data, error } = await supabase
      .from('signature_documents')
      .update({
        signed_storage_path: params.signedStoragePath,
        sha256_signed: params.sha256Signed,
        status: 'signed',
        signed_at: new Date().toISOString(),
      })
      .eq('id', params.documentId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ----------------------------------------------------------------------------
  // 3. IDEMPOTENCIA DE WEBHOOKS
  // ----------------------------------------------------------------------------

  public static async isWebhookProcessed(provider: string, eventId: string): Promise<boolean> {
    const { data } = await supabase
      .from('provider_webhook_events')
      .select('processed')
      .eq('provider', provider)
      .eq('event_id', eventId)
      .maybeSingle();

    return Boolean(data?.processed);
  }

  public static async recordWebhookEvent(params: {
    provider: string;
    eventId: string;
    payloadHash: string;
    status?: string;
    processed?: boolean;
    responsePayload?: any;
  }) {
    const { data, error } = await supabase
      .from('provider_webhook_events')
      .upsert(
        {
          provider: params.provider,
          event_id: params.eventId,
          payload_hash: params.payloadHash,
          status: params.status || 'processed',
          processed: params.processed ?? true,
          processed_at: new Date().toISOString(),
          response_payload: params.responsePayload || {},
        },
        { onConflict: 'provider,event_id' }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
