// ==============================================================================
// SITEOS SIGNATURE CORE: Proveedor MOCK de Firma Digital
// Simulación completa con sellos 'DEMO / SIN VALIDEZ JURÍDICA', hashes y firmantes
// ==============================================================================

import {
  SignatureNotification,
  SignatureProcess,
  SignatureProcessInput,
  SignatureProvider,
  SignatureStatus,
  SignedDocument,
  SignerConfig,
} from '../types';
import { computeSha256 } from '../hashUtil';

interface SimulatedProcessState {
  process: SignatureProcess;
  input: SignatureProcessInput;
  signers: SignerConfig[];
  documents: SignedDocument[];
}

export class MockSignatureProvider implements SignatureProvider {
  public readonly name = 'mock';
  private processes: Map<string, SimulatedProcessState> = new Map();

  constructor() {
    // Proceso preconfigurado para pruebas
    const defaultProcId = 'sig_mock_proc_demo_001';
    this.processes.set(defaultProcId, {
      process: {
        id: defaultProcId,
        processId: defaultProcId,
        provider: 'mock',
        mode: 'mock',
        status: 'signed',
        signerCount: 1,
        currentSignerIndex: 0,
        signingUrl: `/signature/return?mock_process_id=${defaultProcId}`,
        returnUrl: '/signature/return',
        completedAt: new Date().toISOString(),
      },
      input: {
        tenantId: 'a0000000-0000-0000-0000-000000000001',
        caseId: 'e0000000-0000-0000-0000-000000000001',
        documents: [],
        signers: [],
      },
      signers: [
        {
          name: 'Juan Demo',
          email: 'juan@demo.uy',
          role: 'applicant',
          status: 'signed',
          signedAt: new Date().toISOString(),
        },
      ],
      documents: [
        {
          id: 'doc_mock_signed_01',
          title: 'Solicitud de Crédito Hipotecario (Firma Demo)',
          sha256Original: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          sha256Signed: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
          signedStoragePath: 'tenants/demo/cases/e0000000-0000-0000-0000-000000000001/signed/doc_mock_signed_01.pdf',
          signedAt: new Date().toISOString(),
        },
      ],
    });
  }

  public async createProcess(input: SignatureProcessInput): Promise<SignatureProcess> {
    const processId = `sig_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signingUrl = `/signature/return?mock_process_id=${processId}&caseId=${input.caseId}`;

    const signers: SignerConfig[] = input.signers.map((s, idx) => ({
      ...s,
      orderIndex: idx,
      status: 'pending',
    }));

    const documents: SignedDocument[] = input.documents.map((d, idx) => ({
      id: `doc_sig_${processId}_${idx + 1}`,
      sourceDocumentId: d.documentId,
      title: d.title,
      sha256Original: d.sha256Original || 'mock_sha256_orig',
      signedStoragePath: undefined,
      contentBase64: d.contentBase64,
    }));

    const process: SignatureProcess = {
      id: processId,
      processId,
      provider: 'mock',
      mode: 'mock',
      status: 'pending',
      signerCount: signers.length,
      currentSignerIndex: 0,
      signingUrl,
      returnUrl: input.returnUrl || '/signature/return',
      expiresAt: input.expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      documents,
      signers,
      metadata: {
        isMock: true,
        tenantId: input.tenantId,
        caseId: input.caseId,
        systemName: input.systemName || 'HIPOTECALY DOCFLOW SIGNATURE ENGINE (DEMO)',
      },
    };

    this.processes.set(processId, { process, input, signers, documents });
    return process;
  }

  public async getStatus(processId: string): Promise<SignatureStatus> {
    const state = this.processes.get(processId);
    if (!state) return 'signed';
    return state.process.status;
  }

  public async getSignedDocuments(processId: string): Promise<SignedDocument[]> {
    const state = this.processes.get(processId);
    if (!state) {
      return [
        {
          id: `mock_signed_${processId}`,
          title: 'Documento Firmado Demo',
          sha256Original: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          sha256Signed: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
          signedAt: new Date().toISOString(),
        },
      ];
    }
    return state.documents;
  }

  public async getSigningUrl(processId: string, _signerIndex: number = 0): Promise<string> {
    const state = this.processes.get(processId);
    if (state?.process.signingUrl) return state.process.signingUrl;
    return `/signature/return?mock_process_id=${processId}`;
  }

  /**
   * Ejecuta la firma simulada marcando los documentos y firmantes
   */
  public async executeMockSign(
    processId: string,
    signerIndex: number = 0,
    evidenceNote?: string
  ): Promise<{ process: SignatureProcess; allCompleted: boolean }> {
    let state = this.processes.get(processId);
    if (!state) {
      const created = await this.createProcess({
        tenantId: 'a0000000-0000-0000-0000-000000000001',
        caseId: 'e0000000-0000-0000-0000-000000000001',
        documents: [{ title: 'Documento Demo', sha256Original: 'orig_hash_demo' }],
        signers: [{ name: 'Firmante Demo', email: 'demo@demo.uy', role: 'applicant' }],
      });
      state = this.processes.get(created.processId)!;
    }

    if (state.signers[signerIndex]) {
      state.signers[signerIndex].status = 'signed';
      state.signers[signerIndex].signedAt = new Date().toISOString();
      state.signers[signerIndex].evidence = {
        watermark: 'DEMO / SIN VALIDEZ JURÍDICA',
        ip: '127.0.0.1',
        userAgent: 'MockSignatureClient/1.0',
        note: evidenceNote || 'Firma electrónica simulada en entorno de pruebas',
      };
    }

    const allSigned = state.signers.every((s) => s.status === 'signed');
    if (allSigned) {
      state.process.status = 'signed';
      state.process.completedAt = new Date().toISOString();

      // Generar hashes y storage paths para documentos firmados
      for (const doc of state.documents) {
        const signedPayload = `SIGNED_DEMO_PDF_WATERMARK_${doc.id}_${Date.now()}`;
        doc.sha256Signed = await computeSha256(signedPayload);
        doc.signedStoragePath = `tenants/${state.input.tenantId}/cases/${state.input.caseId}/signed/${doc.id}.pdf`;
        doc.signedAt = new Date().toISOString();
      }
    } else {
      state.process.status = 'partially_signed';
      state.process.currentSignerIndex = signerIndex + 1;
    }

    return { process: state.process, allCompleted: allSigned };
  }

  public async handleNotification(
    payload: Record<string, unknown> | string,
    _headers?: Record<string, string | undefined>
  ): Promise<SignatureNotification> {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const processId = (data as any)?.processId || (data as any)?.id || 'sig_mock_demo';
    const status: SignatureStatus = (data as any)?.status || 'signed';

    const state = this.processes.get(processId);
    if (state) {
      state.process.status = status;
      if (status === 'signed') {
        state.process.completedAt = new Date().toISOString();
      }
    }

    return {
      handled: true,
      processId,
      status,
      eventId: `mock_sig_evt_${Date.now()}`,
      completedAt: new Date().toISOString(),
      documents: state?.documents || [],
    };
  }
}
