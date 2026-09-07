// ==============================================================================
// HIPOTECALY DOCFLOW: Proveedor de Firma Electrónica (SignatureProvider)
// Capa de abstracción preparada para integrar Abitab, Antel TuID, Adobe Sign y DocuSign.
// ==============================================================================

export interface SignatureRequestPayload {
  documentId: string;
  documentTitle: string;
  fileUrl: string;
  fileHash: string;
  signers: Array<{
    name: string;
    email: string;
    documentId: string;
    role: string;
    order: number;
  }>;
  expiresInDays?: number;
}

export interface SignatureRequestResult {
  provider: 'abitab' | 'antel_tuid' | 'adobe' | 'docusign' | 'platform_internal';
  requestId: string;
  status: 'sent' | 'pending' | 'completed' | 'failed';
  signUrl?: string;
  evidencePacketId?: string;
}

export interface SignatureStatusResult {
  requestId: string;
  status: 'pending' | 'partially_signed' | 'signed' | 'rejected' | 'expired';
  completedSigners: string[];
  pendingSigners: string[];
  signedAt?: string;
  signedDocumentUrl?: string;
  auditTrailUrl?: string;
}

export interface SignatureProvider {
  createSignatureRequest(payload: SignatureRequestPayload): Promise<SignatureRequestResult>;
  getSignatureStatus(requestId: string): Promise<SignatureStatusResult>;
  cancelSignatureRequest(requestId: string): Promise<boolean>;
  downloadSignedDocument(requestId: string): Promise<Blob | null>;
}

/**
 * Implementación de firma interna preparada para plataformas de crédito
 */
export class PlatformSignatureProvider implements SignatureProvider {
  async createSignatureRequest(payload: SignatureRequestPayload): Promise<SignatureRequestResult> {
    const requestId = `sig_req_${Date.now()}_${payload.documentId.slice(0, 8)}`;
    return {
      provider: 'platform_internal',
      requestId,
      status: 'sent',
      signUrl: `/firma/${requestId}`,
      evidencePacketId: `ev_${payload.fileHash.slice(0, 16)}`,
    };
  }

  async getSignatureStatus(requestId: string): Promise<SignatureStatusResult> {
    return {
      requestId,
      status: 'pending',
      completedSigners: [],
      pendingSigners: ['applicant'],
    };
  }

  async cancelSignatureRequest(_requestId: string): Promise<boolean> {
    return true;
  }

  async downloadSignedDocument(_requestId: string): Promise<Blob | null> {
    return null;
  }
}

export const defaultSignatureProvider = new PlatformSignatureProvider();
