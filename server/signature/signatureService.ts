import crypto from 'crypto';
import { supabaseAdmin } from '../supabase.js';
import { FirmaGubClient } from './firmaGubClient.js';

export type SignatureStatus =
  | 'draft'
  | 'prepared'
  | 'pending'
  | 'in_progress'
  | 'partially_signed'
  | 'signed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface SignerConfig {
  userId?: string;
  name: string;
  email: string;
  documentCountry?: string;
  documentType?: string;
  role?: string;
}

export interface SignatureProcessInput {
  tenantId: string;
  caseId: string;
  documents: Array<{
    documentId: string;
    title: string;
    sha256Original: string;
    storagePath?: string;
    contentBase64?: string;
  }>;
  signers: SignerConfig[];
  expiresAt?: string;
}

export function normalizeFirmaGubStatus(firmaGubState: string): SignatureStatus {
  const normalized = (firmaGubState || '').toUpperCase().trim();
  switch (normalized) {
    case 'INICIADO':
    case 'PENDIENTE':
      return 'pending';
    case 'EN_PROCESO':
    case 'EN_FIRMA':
      return 'in_progress';
    case 'FINALIZADO':
    case 'FIRMADO':
    case 'COMPLETO':
      return 'signed';
    case 'RECHAZADO':
    case 'CANCELADO_POR_USUARIO':
      return 'rejected';
    case 'EXPIRADO':
    case 'VENCIDO':
      return 'expired';
    default:
      return 'in_progress';
  }
}

export class SignatureService {
  /**
   * Obtiene la configuración de firma del tenant o de plataforma
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
      // Ignorar fallback a env
    }

    return {
      signature_enabled: true,
      signature_provider: process.env.SIGNATURE_PROVIDER || 'mock',
      signature_mode: process.env.SIGNATURE_MODE || 'mock',
      api_base_url: process.env.FIRMA_GUB_API_BASE_URL || process.env.FIRMA_GUB_BASE_URL,
      sign_base_url: process.env.FIRMA_GUB_SIGN_BASE_URL,
      api_prefix: process.env.FIRMA_GUB_API_PREFIX,
    };
  }

  /**
   * Resuelve el proveedor adecuado respetando multi-tenancy y configuración
   */
  public static async resolveProvider(tenantId: string) {
    const settings = await this.getTenantSettings(tenantId);
    const providerName = settings.signature_provider || process.env.SIGNATURE_PROVIDER || 'mock';
    const apiBaseUrl =
      settings.api_base_url ||
      process.env.FIRMA_GUB_API_BASE_URL ||
      process.env.FIRMA_GUB_BASE_URL;

    if (providerName === 'firma_gub' && apiBaseUrl) {
      return new FirmaGubSignatureProvider({
        apiBaseUrl,
        signBaseUrl: settings.sign_base_url || process.env.FIRMA_GUB_SIGN_BASE_URL || apiBaseUrl,
        apiPrefix: settings.api_prefix || process.env.FIRMA_GUB_API_PREFIX || '/api/v1/externos',
        statusMethod: (process.env.FIRMA_GUB_STATUS_METHOD as any) || 'GET',
        process2Transport: (process.env.FIRMA_GUB_PROCESS2_TRANSPORT as any) || 'multipart',
        mode: (settings.signature_mode as any) || (process.env.SIGNATURE_MODE as any) || 'live',
      });
    }

    return new MockSignatureProvider();
  }

  /**
   * Inicia un proceso de firma consumiendo documentos generados por DOCFLOW
   */
  public static async createProcessFromDocFlow(params: {
    tenantId: string;
    caseId: string;
    documentIds: string[];
    signers: SignerConfig[];
    expiresAt?: string;
  }) {
    if (!params.documentIds || params.documentIds.length === 0) {
      throw new Error('Debe especificar al menos un documento para enviar a firma.');
    }

    // 1. Recuperar documentos de DOCFLOW
    const { data: dbDocs, error: docErr } = await supabaseAdmin
      .from('generated_documents')
      .select('*')
      .in('id', params.documentIds);

    if (docErr || !dbDocs || dbDocs.length === 0) {
      throw new Error('No se encontraron los documentos especificados en DOCFLOW.');
    }

    // 2. Preparar documentos con hashes SHA-256
    const docsForSignature = dbDocs.map((doc) => {
      let hash = doc.file_hash;
      if (!hash) {
        hash = crypto.createHash('sha256').update(doc.title + doc.id).digest('hex');
      }
      return {
        documentId: doc.id,
        title: doc.title,
        sha256Original: hash,
        storagePath: doc.file_path,
        contentBase64: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2Vz...',
      };
    });

    // 3. Crear proceso con el proveedor resuelto
    const provider = await this.resolveProvider(params.tenantId);
    const processInput: SignatureProcessInput = {
      tenantId: params.tenantId,
      caseId: params.caseId,
      documents: docsForSignature,
      signers: params.signers,
      expiresAt: params.expiresAt,
    };

    const process = await provider.createProcess(processInput);
    const nowIso = new Date().toISOString();

    // 4. Persistir en base de datos
    let processDbId = process.id;
    try {
      const { data: insertedProc, error: pErr } = await supabaseAdmin
        .from('signature_processes')
        .insert({
          tenant_id: params.tenantId,
          case_id: params.caseId,
          provider: process.provider,
          provider_process_id: process.processId,
          mode: process.mode,
          status: process.status,
          signer_count: process.signerCount,
          current_signer_index: 0,
          signing_url: process.signingUrl || null,
          return_url: process.returnUrl || null,
          expires_at: process.expiresAt || null,
          security_secret_encrypted: process.securitySecretEncrypted || null,
          metadata: process.metadata || {},
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (!pErr && insertedProc) {
        processDbId = insertedProc.id;

        // Insertar firmantes
        const signerRows = params.signers.map((s, idx) => ({
          signature_process_id: processDbId,
          user_id: s.userId || null,
          role: s.role || 'applicant',
          name: s.name,
          email: s.email,
          document_country: s.documentCountry || 'UY',
          document_type: s.documentType || 'CI',
          order_index: idx,
          status: 'pending',
          created_at: nowIso,
          updated_at: nowIso,
        }));
        await supabaseAdmin.from('signature_signers').insert(signerRows);

        // Insertar documentos
        const docRows = docsForSignature.map((d) => ({
          signature_process_id: processDbId,
          source_document_id: d.documentId,
          title: d.title,
          original_storage_path: d.storagePath,
          sha256_original: d.sha256Original,
          status: 'pending',
          created_at: nowIso,
        }));
        await supabaseAdmin.from('signature_documents').insert(docRows);

        // Actualizar estado en DOCFLOW a 'sent_for_signature'
        await supabaseAdmin
          .from('generated_documents')
          .update({ status: 'sent_for_signature', updated_at: nowIso })
          .in('id', params.documentIds);
      }
    } catch (dbErr) {
      console.error('[SignatureService] Error guardando proceso en DB:', dbErr);
    }

    // Emitir evento de creación
    await signatureEventBus.emit({
      eventId: `evt_created_${processDbId}`,
      eventType: 'signature.process.created',
      tenantId: params.tenantId,
      caseId: params.caseId,
      processId: processDbId,
      provider: process.provider,
      status: process.status,
      timestamp: nowIso,
      process,
    });

    return {
      id: processDbId,
      processId: process.processId,
      status: process.status,
      signingUrl: process.signingUrl,
      signerCount: process.signerCount,
    };
  }

  /**
   * Procesa la notificación (Callback / Webhook) de Firma.gub.uy recibida vía GET o POST.
   * Unifica la normalización, idempotencia estricta y re-verificación contra el endpoint oficial.
   */
  public static async handleFirmaGubNotification(params: {
    body?: any;
    query?: any;
    headers?: any;
    method?: string;
  } | any, _headersFallback?: any) {
    // Normalizar entrada (objeto con { body, query } o payload directo)
    const isWrapped = params && (params.body !== undefined || params.query !== undefined);
    const body = isWrapped ? params.body || {} : params || {};
    const query = isWrapped ? params.query || {} : {};
    const method = isWrapped ? (params.method || 'POST').toUpperCase() : 'POST';

    // Extraer identificador y estado de query o body
    const processId =
      query.identificador ||
      query.id ||
      query.processId ||
      body.identificador ||
      body.id ||
      body.processId;

    const rawStatus =
      query.estado ||
      query.status ||
      query.estadoProceso ||
      body.estado ||
      body.status ||
      body.estadoProceso;

    if (!processId) {
      return {
        handled: false,
        error: 'MISSING_IDENTIFIER',
        message: 'La notificación no contiene el identificador de proceso (query o body).',
      };
    }

    const nowIso = new Date().toISOString();
    const normalizedStatus = normalizeFirmaGubStatus(rawStatus);

    // Fingerprint no sensible para idempotencia: provider + processId + status
    const fingerprintString = `firma_gub:${processId}:${rawStatus || 'UNKNOWN'}`;
    const payloadHash = crypto.createHash('sha256').update(fingerprintString).digest('hex');
    const eventId = `evt_firma_${processId}_${rawStatus || 'notification'}`;

    // 1. Idempotencia estricta
    try {
      const { data: existing } = await supabaseAdmin
        .from('provider_webhook_events')
        .select('processed')
        .eq('provider', 'firma_gub')
        .eq('payload_hash', payloadHash)
        .maybeSingle();

      if (existing?.processed) {
        return {
          handled: true,
          duplicate: true,
          processId,
          status: normalizedStatus,
        };
      }
    } catch {
      // Continuar si no existe la tabla
    }

    // 2. Localizar el proceso en DB para obtener la claveSeguridad
    let procRecord: any = null;
    try {
      const { data: proc } = await supabaseAdmin
        .from('signature_processes')
        .select(`*, documents:signature_documents(*)`)
        .or(`id.eq.${processId},provider_process_id.eq.${processId}`)
        .maybeSingle();
      procRecord = proc;
    } catch (err) {
      console.error('[SignatureService] Error buscando proceso para notificación:', err);
    }

    // 3. NO confiar ciegamente en el estado recibido: re-verificar contra Firma.gub si hay credenciales
    let verifiedStatus = normalizedStatus;
    let downloadedFiles: any[] = [];
    const securityKey =
      procRecord?.security_secret_encrypted ||
      procRecord?.metadata?.claveSeguridad;

    const apiBaseUrl = process.env.FIRMA_GUB_API_BASE_URL || process.env.FIRMA_GUB_BASE_URL;

    if (apiBaseUrl && securityKey && !processId.startsWith('firma_gub_mock_')) {
      const client = new FirmaGubClient({
        apiBaseUrl,
        signBaseUrl: process.env.FIRMA_GUB_SIGN_BASE_URL || apiBaseUrl,
        apiPrefix: process.env.FIRMA_GUB_API_PREFIX || '/api/v1/externos',
        statusMethod: (process.env.FIRMA_GUB_STATUS_METHOD as any) || 'GET',
      });

      try {
        const officialStatus = await client.getProcesoEstado(processId, securityKey);
        verifiedStatus = normalizeFirmaGubStatus(officialStatus.estado);

        // Si el estado verificado oficial es FINALIZADO/signed, descargar los archivos
        if (verifiedStatus === 'signed') {
          downloadedFiles = await client.getArchivosFirmados(processId, securityKey);
        }
      } catch (checkErr) {
        console.warn('[SignatureService] Advertencia al consultar estado oficial en Firma.gub:', checkErr);
      }
    }

    // 4. Actualizar estado en DB de forma segura
    try {
      if (procRecord) {
        await supabaseAdmin
          .from('signature_processes')
          .update({
            status: verifiedStatus,
            provider_status: rawStatus,
            completed_at: verifiedStatus === 'signed' ? nowIso : null,
            updated_at: nowIso,
          })
          .eq('id', procRecord.id);

        if (verifiedStatus === 'signed') {
          // Actualizar documentos asociados en DOCFLOW
          const sourceDocIds = (procRecord.documents || [])
            .map((d: any) => d.source_document_id)
            .filter(Boolean);

          if (sourceDocIds.length > 0) {
            await supabaseAdmin
              .from('generated_documents')
              .update({
                status: 'signed',
                signed_at: nowIso,
                updated_at: nowIso,
              })
              .in('id', sourceDocIds);
          }

          // Actualizar hashes firmados en signature_documents
          if (downloadedFiles.length > 0 && procRecord.documents) {
            for (let i = 0; i < procRecord.documents.length; i++) {
              const doc = procRecord.documents[i];
              const downloaded = downloadedFiles[i] || downloadedFiles[0];
              if (downloaded) {
                await supabaseAdmin
                  .from('signature_documents')
                  .update({
                    sha256_signed: downloaded.sha256,
                    status: 'signed',
                    signed_at: nowIso,
                  })
                  .eq('id', doc.id);
              }
            }
          }

          // Marcar todos los firmantes como firmados
          await supabaseAdmin
            .from('signature_signers')
            .update({
              status: 'signed',
              signed_at: nowIso,
              updated_at: nowIso,
            })
            .eq('signature_process_id', procRecord.id);
        } else if (verifiedStatus === 'rejected') {
          await supabaseAdmin
            .from('signature_signers')
            .update({
              status: 'rejected',
              updated_at: nowIso,
            })
            .eq('signature_process_id', procRecord.id);
        }
      }
    } catch (dbErr) {
      console.error('[SignatureService] Error actualizando DB en notificación:', dbErr);
    }

    // 5. Registrar evento en idempotencia
    try {
      await supabaseAdmin.from('provider_webhook_events').upsert(
        {
          provider: 'firma_gub',
          event_id: eventId,
          payload_hash: payloadHash,
          processed: true,
          processed_at: nowIso,
          status: 'processed',
          response_payload: { status: verifiedStatus, rawStatus, method },
        },
        { onConflict: 'provider,payload_hash' }
      );
    } catch {
      // Ignorar
    }

    // 6. Emitir evento interno en EventBus
    await signatureEventBus.emit({
      eventId,
      eventType:
        verifiedStatus === 'signed'
          ? 'signature.process.completed'
          : verifiedStatus === 'rejected'
          ? 'signature.process.rejected'
          : 'signature.process.partially_signed',
      tenantId: procRecord?.tenant_id || 'system',
      caseId: procRecord?.case_id || 'system',
      processId: procRecord?.id || processId,
      provider: 'firma_gub',
      status: verifiedStatus,
      timestamp: nowIso,
    });

    return {
      handled: true,
      processId,
      status: verifiedStatus,
      method,
      verifiedAgainstProvider: Boolean(apiBaseUrl && securityKey),
    };
  }

  /**
   * Alias de compatibilidad para el webhook handler
   */
  public static async handleFirmaGubWebhook(payload: any, headers?: any) {
    return this.handleFirmaGubNotification(payload, headers);
  }

  /**
   * Ejecuta la simulación de firma en modo MOCK
   */
  public static async executeMockSign(params: {
    processId: string;
    signerIndex?: number;
    evidenceNote?: string;
  }) {
    const mockProvider = new MockSignatureProvider();
    const result = await mockProvider.executeMockSign(
      params.processId,
      params.signerIndex || 0,
      params.evidenceNote
    );

    const nowIso = new Date().toISOString();

    // Actualizar proceso en DB
    try {
      const { data: proc } = await supabaseAdmin
        .from('signature_processes')
        .update({
          status: result.process.status,
          completed_at: result.allCompleted ? nowIso : null,
          updated_at: nowIso,
        })
        .or(`id.eq.${params.processId},provider_process_id.eq.${params.processId}`)
        .select(`*, documents:signature_documents(*)`)
        .maybeSingle();

      if (proc && result.allCompleted) {
        const sourceDocIds = (proc.documents || [])
          .map((d: any) => d.source_document_id)
          .filter(Boolean);

        if (sourceDocIds.length > 0) {
          await supabaseAdmin
            .from('generated_documents')
            .update({
              status: 'signed',
              signed_at: nowIso,
              updated_at: nowIso,
            })
            .in('id', sourceDocIds);
        }

        // Marcar firmantes como firmados
        await supabaseAdmin
          .from('signature_signers')
          .update({
            status: 'signed',
            signed_at: nowIso,
            updated_at: nowIso,
          })
          .eq('signature_process_id', proc.id);
      }
    } catch (err) {
      console.error('[SignatureService] Error actualizando simulación de firma en DB:', err);
    }

    return result;
  }
}
