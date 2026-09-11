// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE DEDUPLICACIÓN MULTI-FUENTE V1
// Generación Reversible de Candidatos (Sin Auto-merge Destructivo)
// ==============================================================================

import {
  NormalizedListing,
  CandidateDecision,
} from '../types/tasadorPipelineTypes';
import { DedupScoringEngine } from './DedupScoringEngine';
import { DEFAULT_DEDUP_CONFIG, DedupThresholdConfig } from './DedupThresholds';

export interface DuplicateCandidateRecord {
  id: string;
  propertyAId?: string | null;
  propertyBId?: string | null;
  listingAId: string;
  listingBId: string;
  matchScore: number;
  addressScore: number;
  geoScore: number;
  photoScore: number;
  priceScore: number;
  areaScore: number;
  bedroomsScore: number;
  textScore: number;
  cadastralScore: number;
  confidenceLevel: string;
  matchReasons: string[];
  decision: CandidateDecision;
  decisionSource: 'AUTOMATED' | 'MANUAL_REVIEW';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export class DeduplicationService {
  private config: DedupThresholdConfig;
  private candidates: Map<string, DuplicateCandidateRecord> = new Map();

  constructor(config: DedupThresholdConfig = DEFAULT_DEDUP_CONFIG) {
    this.config = config;
  }

  public evaluatePair(
    listingA: NormalizedListing,
    listingB: NormalizedListing,
    ids?: { listingAId?: string; listingBId?: string; propertyAId?: string; propertyBId?: string }
  ): DuplicateCandidateRecord | null {
    // Si son de la misma fuente y mismo ID de publicación, no es candidato de duplicado externo
    if (
      listingA.sourceCode === listingB.sourceCode &&
      listingA.sourceListingId === listingB.sourceListingId
    ) {
      return null;
    }

    const breakdown = DedupScoringEngine.compareListings(listingA, listingB, this.config);

    // Solo registrar como candidato si el score supera el umbral de revisión (>= 70)
    if (breakdown.totalScore < this.config.reviewThreshold) {
      return null;
    }

    const lAId = ids?.listingAId || `${listingA.sourceCode}_${listingA.sourceListingId}`;
    const lBId = ids?.listingBId || `${listingB.sourceCode}_${listingB.sourceListingId}`;
    const candidateId = `cand_${lAId}_${lBId}`;

    let decision: CandidateDecision = 'PENDING';
    if (breakdown.totalScore >= this.config.veryHighConfidenceThreshold) {
      decision = 'MATCH';
    }

    const record: DuplicateCandidateRecord = {
      id: candidateId,
      propertyAId: ids?.propertyAId || null,
      propertyBId: ids?.propertyBId || null,
      listingAId: lAId,
      listingBId: lBId,
      matchScore: breakdown.totalScore,
      addressScore: breakdown.addressScore,
      geoScore: breakdown.geoScore,
      photoScore: breakdown.photoScore,
      priceScore: breakdown.priceScore,
      areaScore: breakdown.areaScore,
      bedroomsScore: breakdown.bedroomsScore,
      textScore: breakdown.textScore,
      cadastralScore: breakdown.cadastralScore,
      confidenceLevel: breakdown.confidenceLevel,
      matchReasons: breakdown.matchReasons,
      decision,
      decisionSource: 'AUTOMATED',
      createdAt: new Date().toISOString(),
    };

    this.candidates.set(candidateId, record);
    return record;
  }

  public getCandidates(): DuplicateCandidateRecord[] {
    return Array.from(this.candidates.values());
  }

  public reviewCandidate(
    candidateId: string,
    decision: 'MATCH' | 'NO_MATCH' | 'UNCERTAIN',
    userId: string
  ): DuplicateCandidateRecord | null {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) return null;

    candidate.decision = decision;
    candidate.decisionSource = 'MANUAL_REVIEW';
    candidate.reviewedBy = userId;
    candidate.reviewedAt = new Date().toISOString();

    return candidate;
  }
}
