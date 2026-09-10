// ==============================================================================
// SITEOS IDENTITY CORE: Máquina de Estados y Transiciones Válidas de KYC
// ==============================================================================

import { KycStatus } from './types';

export const VALID_KYC_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
  created: ['in_progress', 'abandoned', 'expired', 'failed'],
  in_progress: ['pending_review', 'verified', 'failed', 'resubmission_required', 'expired', 'abandoned'],
  pending_review: ['verified', 'failed', 'resubmission_required', 'expired'],
  resubmission_required: ['in_progress', 'failed', 'expired', 'abandoned'],
  verified: [], // Estado terminal de éxito
  failed: ['resubmission_required', 'in_progress'], // Puede reintentar si la política lo autoriza
  expired: ['in_progress'], // Puede reiniciarse
  abandoned: ['in_progress'], // Puede retomarse
};

export function canTransitionKyc(current: KycStatus, next: KycStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_KYC_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

/**
 * Normaliza estados oficiales de Didit API v3 a los estados provider-agnostic de SiteOS
 */
export function normalizeDiditStatus(diditStatus: string): KycStatus {
  const normalized = (diditStatus || '').toLowerCase().trim();
  switch (normalized) {
    case 'created':
    case 'pending':
    case 'session.created':
    case 'session_created':
      return 'created';
    case 'in progress':
    case 'in_progress':
    case 'started':
    case 'submitted':
    case 'session.in_progress':
    case 'session_in_progress':
    case 'session.started':
    case 'session.submitted':
      return 'in_progress';
    case 'in review':
    case 'in_review':
    case 'pending_review':
    case 'review':
    case 'session.in_review':
    case 'session_in_review':
    case 'session.review':
      return 'pending_review';
    case 'approved':
    case 'verified':
    case 'passed':
    case 'success':
    case 'session.approved':
    case 'session_approved':
    case 'verification.approved':
    case 'verification.completed':
    case 'decision.approved':
      return 'verified';
    case 'declined':
    case 'rejected':
    case 'failed':
    case 'session.declined':
    case 'session_declined':
    case 'session.rejected':
    case 'verification.declined':
    case 'decision.declined':
      return 'failed';
    case 'resubmitted':
    case 'resubmission_required':
    case 'resubmission_requested':
    case 'resubmit':
    case 'session.resubmitted':
    case 'session_resubmitted':
    case 'session.resubmission_required':
      return 'resubmission_required';
    case 'expired':
    case 'session.expired':
    case 'session_expired':
      return 'expired';
    case 'abandoned':
    case 'session.abandoned':
    case 'session_abandoned':
      return 'abandoned';
    default:
      return 'in_progress';
  }
}

/**
 * Normalizador agnóstico universal (soporta Didit, Veriff histórico y genéricos)
 */
export function normalizeKycStatus(rawStatus: string, provider: string = 'didit'): KycStatus {
  if (provider.toLowerCase() === 'didit') {
    return normalizeDiditStatus(rawStatus);
  }
  return normalizeVeriffStatus(rawStatus);
}

/**
 * Helper de retrocompatibilidad para registros históricos de Veriff
 */
export function normalizeVeriffStatus(veriffActionOrStatus: string): KycStatus {
  const normalized = (veriffActionOrStatus || '').toLowerCase().trim();
  switch (normalized) {
    case 'created':
    case 'started':
      return 'created';
    case 'submitted':
    case 'in_progress':
      return 'in_progress';
    case 'review':
    case 'pending_review':
      return 'pending_review';
    case 'approved':
    case 'verified':
    case 'success':
      return 'verified';
    case 'declined':
    case 'rejected':
      return 'failed';
    case 'resubmission_requested':
    case 'resubmission_required':
      return 'resubmission_required';
    case 'expired':
      return 'expired';
    case 'abandoned':
      return 'abandoned';
    default:
      return 'in_progress';
  }
}

