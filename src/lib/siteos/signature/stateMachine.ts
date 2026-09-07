// ==============================================================================
// SITEOS SIGNATURE CORE: Máquina de Estados de Procesos de Firma Digital
// ==============================================================================

import { SignatureStatus, SignerStatus } from './types';

export const VALID_SIGNATURE_TRANSITIONS: Record<SignatureStatus, SignatureStatus[]> = {
  draft: ['prepared', 'pending', 'cancelled'],
  prepared: ['pending', 'in_progress', 'cancelled'],
  pending: ['in_progress', 'partially_signed', 'signed', 'rejected', 'expired', 'cancelled'],
  in_progress: ['partially_signed', 'signed', 'rejected', 'expired', 'cancelled'],
  partially_signed: ['in_progress', 'signed', 'rejected', 'expired', 'cancelled'],
  signed: [], // Estado terminal exitoso
  rejected: ['prepared', 'pending'], // Puede relanzarse si se corrigen observaciones
  expired: ['prepared', 'pending'],
  cancelled: [],
};

export function canTransitionSignature(current: SignatureStatus, next: SignatureStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_SIGNATURE_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function computeOverallProcessStatus(
  signers: Array<{ status: SignerStatus }>,
  currentStatus: SignatureStatus
): SignatureStatus {
  if (signers.length === 0) return currentStatus;

  const allSigned = signers.every((s) => s.status === 'signed');
  if (allSigned) return 'signed';

  const anyRejected = signers.some((s) => s.status === 'rejected' || s.status === 'failed');
  if (anyRejected) return 'rejected';

  const anySigned = signers.some((s) => s.status === 'signed');
  if (anySigned) return 'partially_signed';

  const anyOpenedOrNotified = signers.some((s) => s.status === 'opened' || s.status === 'notified');
  if (anyOpenedOrNotified) return 'in_progress';

  return 'pending';
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
