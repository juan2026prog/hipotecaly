// ==============================================================================
// HIPOTECALY: Tipos de Firma Electrónica Avanzada (FEA - Ley 18.600 / Firma.gub.uy)
// ==============================================================================

export type SignatureProcessStatus =
  | 'draft'
  | 'ready'
  | 'initiated'
  | 'awaiting_signer'
  | 'signing'
  | 'signed'
  | 'validating'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'validation_failed'
  | 'error';

export const SIGNATURE_STATUS_LABELS: Record<SignatureProcessStatus, string> = {
  draft: 'Borrador',
  ready: 'Listo para firma',
  initiated: 'Firma iniciada',
  awaiting_signer: 'Esperando al escribano',
  signing: 'Firmando',
  signed: 'Firmado',
  validating: 'Validando firma',
  completed: 'Firma válida',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  validation_failed: 'Error de validación',
  error: 'Error en proceso',
};

export type SignatureMechanism =
  | 'chip_id'           // Cédula de Identidad Digital Uruguaya con Chip (Lector)
  | 'crypto_token'       // Token Criptográfico USB FIPS 140-2 (Abitab / Correo)
  | 'cloud_fea'          // Firma Electrónica Avanzada en la Nube (TuID / Abitab)
  | 'didit_fe';          // Firma Avanzada Didit / Interoperable

export interface SignatureMechanismOption {
  id: SignatureMechanism;
  name: string;
  description: string;
  badge: string;
  recommendedDevice: string;
  iconName: string;
}

export const SIGNATURE_MECHANISMS: SignatureMechanismOption[] = [
  {
    id: 'cloud_fea',
    name: 'Firma Avanzada en la Nube (TuID / Abitab)',
    description: 'Firma mediante OTP móvil o app autorizada sin necesidad de lector físico.',
    badge: 'Recomendado Móvil / Web',
    recommendedDevice: 'Cualquier dispositivo (PC, Tablet, Celular)',
    iconName: 'Cloud',
  },
  {
    id: 'chip_id',
    name: 'Cédula con Chip (Cédula Digital)',
    description: 'Documento de Identidad Digital uruguayo insertado en lector de tarjetas inteligente.',
    badge: 'Alta Seguridad',
    recommendedDevice: 'PC con Lector de Tarjetas SmartCard',
    iconName: 'CreditCard',
  },
  {
    id: 'crypto_token',
    name: 'Token Criptográfico USB',
    description: 'Dispositivo físico PKI / FIPS con certificado notarial emitido por prestador acreditado.',
    badge: 'Notarial Estándar',
    recommendedDevice: 'PC con puerto USB y driver criptográfico',
    iconName: 'Key',
  },
];

export interface SignatureProcessSigner {
  id: string;
  signature_process_id: string;
  user_id?: string;
  person_id?: string;
  full_name: string;
  document_number?: string;
  role: 'borrower' | 'lender' | 'notary' | 'guarantor' | 'spouse';
  signing_order: number;
  status: 'pending' | 'signed' | 'rejected';
  signed_at?: string;
  certificate_data?: {
    subject?: string;
    issuer?: string;
    serial?: string;
    valid_from?: string;
    valid_to?: string;
    fingerprint?: string;
  };
  created_at: string;
}

export interface SignatureProcess {
  id: string;
  organization_id: string;
  application_id: string;
  generated_document_id?: string;
  document_version: number;
  document_title: string;
  signer_user_id?: string;
  signer_role: string;
  provider: 'firma_gub' | 'didit' | 'abitab_cloud' | 'local_pki';
  external_process_id?: string;
  external_file_id?: string;
  status: SignatureProcessStatus;
  
  // Hashes y almacenamiento
  original_sha256: string;
  signed_sha256?: string;
  original_file_url?: string;
  signed_file_url?: string;
  
  // Requisitos Notariales
  is_notarial_electronic_document: boolean;
  requires_notarial_electronic_support: boolean;
  notarial_support_code?: string;
  long_term_signature: boolean;

  // Validación Criptográfica
  signature_valid?: boolean;
  certificate_valid?: boolean;
  certificate_status?: string;
  signer_identity?: string;
  certificate_subject?: string;
  certificate_issuer?: string;
  certificate_serial?: string;
  certificate_fingerprint?: string;
  signing_time?: string;
  timestamp_status?: string;
  
  // Trazabilidad temporal
  created_at: string;
  expires_at?: string;
  redirected_at?: string;
  signed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  failed_at?: string;
  callback_received_at?: string;
  validated_at?: string;
  
  error_code?: string;
  error_message?: string;

  signers?: SignatureProcessSigner[];
}

export interface SignatureValidationResult {
  isValid: boolean;
  signerIdentityMatches: boolean;
  certificateValid: boolean;
  integrityPreserved: boolean;
  signerName: string;
  documentNumber: string;
  certificateIssuer: string;
  certificateSerial: string;
  certificateFingerprint: string;
  signingTime: string;
  timestampVerified: boolean;
  originalHash: string;
  signedHash: string;
  isNotarialDocument: boolean;
  notarialSupportVerified?: boolean;
  validationDetails: {
    rule: string;
    passed: boolean;
    description: string;
  }[];
}

export interface SignatureEvidence {
  processId: string;
  documentTitle: string;
  documentVersion: number;
  applicationPublicId: string;
  status: SignatureProcessStatus;
  statusLabel: string;
  signerName: string;
  signerRole: string;
  notaryAffiliateNumber?: string;
  providerName: string;
  mechanismName: string;
  signingTime: string;
  validationTime: string;
  originalSha256: string;
  signedSha256: string;
  certificateSubject: string;
  certificateIssuer: string;
  certificateSerial: string;
  certificateFingerprint: string;
  integrityStatus: 'integro' | 'alterado';
  longTermValidation: boolean;
  isNotarialElectronicDocument: boolean;
  notarialSupportCode?: string;
  auditTrail: {
    event: string;
    timestamp: string;
    actor: string;
    details: string;
  }[];
}

export type AuditSignatureEventType =
  | 'signature_document_locked'
  | 'signature_process_created'
  | 'signature_redirected'
  | 'signature_callback_received'
  | 'signature_completed'
  | 'signature_validation_started'
  | 'signature_validated'
  | 'signature_validation_failed'
  | 'signature_rejected'
  | 'signature_cancelled'
  | 'signature_expired'
  | 'signed_document_downloaded';
