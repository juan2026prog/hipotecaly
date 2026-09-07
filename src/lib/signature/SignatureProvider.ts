// ==============================================================================
// HIPOTECALY: Interfaz de Proveedor de Firma (SignatureProvider)
// Permite desacoplar DOCFLOW de proveedores específicos (Firma.gub.uy, Didit, PKI)
// ==============================================================================

import { SignatureProcess, SignatureValidationResult, SignatureMechanism } from './types';

export interface CreateProcessParams {
  organizationId: string;
  applicationId: string;
  generatedDocumentId: string;
  documentVersion: number;
  documentTitle: string;
  fileUrl: string;
  fileBytes?: ArrayBuffer;
  originalSha256: string;
  signerUserId: string;
  signerFullName: string;
  signerDocumentNumber: string;
  signerRole: string;
  mechanism: SignatureMechanism;
  isNotarialDoc: boolean;
  requiresNotarialSupport: boolean;
  notarialSupportCode?: string;
  returnUrl: string;
  notificationUrl: string;
}

export interface ProcessRedirectResult {
  processId: string;
  externalProcessId: string;
  redirectUrl: string;
  expiresAt: string;
}

export interface SignatureCallbackPayload {
  externalProcessId: string;
  status: 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'ERROR';
  signedDocumentUrl?: string;
  signedDocumentBase64?: string;
  signedSha256?: string;
  signerCertificate?: {
    subject: string;
    issuer: string;
    serial: string;
    fingerprint: string;
    signingTime: string;
  };
  signatureValid?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface ISignatureProvider {
  name: string;
  type: 'firma_gub' | 'didit' | 'local_pki';
  createProcess(params: CreateProcessParams): Promise<ProcessRedirectResult>;
  getProcessStatus(externalProcessId: string): Promise<SignatureProcess['status']>;
  handleCallback(payload: SignatureCallbackPayload): Promise<SignatureValidationResult>;
  validateSignature(process: SignatureProcess): Promise<SignatureValidationResult>;
  cancelProcess(externalProcessId: string): Promise<boolean>;
}
