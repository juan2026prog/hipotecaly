// ==============================================================================
// SITEOS SIGNATURE CORE: Tipos e Interfaces Provider-Agnostic para Firma Digital
// ==============================================================================

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

export type SignerStatus =
  | 'pending'
  | 'notified'
  | 'opened'
  | 'signed'
  | 'rejected'
  | 'failed';

export type SignerRole =
  | 'applicant'
  | 'spouse'
  | 'owner'
  | 'guarantor'
  | 'lender'
  | 'notary'
  | 'authorized_operator';

export interface SignerConfig {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  role: SignerRole | string;
  documentCountry?: string; // 'UY', 'AR', etc.
  documentType?: string;    // 'CI', 'DNI', 'PASSPORT'
  documentNumber?: string;
  orderIndex?: number;
  status?: SignerStatus;
  signedAt?: string;
  evidence?: Record<string, unknown>;
}

export interface SignatureDocumentInput {
  documentId?: string; // ID de generated_documents en DOCFLOW
  title: string;
  contentBase64?: string;
  storagePath?: string;
  sha256Original: string;
  fileSizeBytes?: number;
}

export interface SignatureProcessInput {
  tenantId: string;
  caseId: string;
  documents: SignatureDocumentInput[];
  signers: SignerConfig[];
  returnUrl?: string;
  notificationUrl?: string;
  expiresAt?: string;
  longLivedSignature?: boolean; // Firma longeva (Firma.gub.uy)
  systemName?: string;
  metadata?: Record<string, unknown>;
}

export interface SignedDocument {
  id: string;
  sourceDocumentId?: string;
  title: string;
  signedStoragePath?: string;
  sha256Original: string;
  sha256Signed?: string;
  contentBase64?: string;
  providerFileId?: string;
  signedAt?: string;
}

export interface SignatureProcess {
  id: string;
  processId: string;
  provider: string;
  mode: 'mock' | 'test' | 'live';
  status: SignatureStatus;
  providerStatus?: string;
  signerCount: number;
  currentSignerIndex: number;
  signingUrl?: string;
  returnUrl?: string;
  expiresAt?: string;
  completedAt?: string;
  documents?: SignedDocument[];
  signers?: SignerConfig[];
  securitySecretEncrypted?: string;
  metadata?: Record<string, unknown>;
}

export interface SignatureNotification {
  handled: boolean;
  processId: string;
  status: SignatureStatus;
  providerStatus?: string;
  eventId?: string;
  completedAt?: string;
  reason?: string;
  documents?: SignedDocument[];
}

export interface SignatureProvider {
  name: string;
  createProcess(input: SignatureProcessInput): Promise<SignatureProcess>;
  getStatus(processId: string, securityKey?: string): Promise<SignatureStatus>;
  getSignedDocuments(processId: string, securityKey?: string): Promise<SignedDocument[]>;
  handleNotification(
    payload: Record<string, unknown> | string,
    headers?: Record<string, string | undefined>
  ): Promise<SignatureNotification>;
  getSigningUrl(processId: string, signerIndex?: number, securityKey?: string): Promise<string>;
}
