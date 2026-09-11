// ==============================================================================
// HIPOTECALY TASADOR IA - RASTREADOR DE EVIDENCIA POR CAMPO
// Trazabilidad granular en property_field_evidence
// ==============================================================================

import { NormalizedListing } from '../types/tasadorPipelineTypes';

export interface FieldEvidenceRecord {
  id: string;
  propertyMasterId?: string | null;
  listingId: string;
  fieldName: string;
  rawValue: string | null;
  normalizedValue: string | null;
  sourceCode: string;
  evidenceType: string;
  confidence: number;
  snapshotId?: string | null;
  observedAt: string;
}

export class FieldEvidenceTracker {
  private records: FieldEvidenceRecord[] = [];

  public captureEvidence(
    listing: NormalizedListing,
    masterId?: string | null,
    snapshotId?: string | null
  ): FieldEvidenceRecord[] {
    const listingKey = listing.sourceListingKey || `${listing.sourceCode}_${listing.sourceListingId}`;
    const now = new Date().toISOString();
    const generated: FieldEvidenceRecord[] = [];

    for (const [field, data] of Object.entries(listing.fieldEvidence)) {
      const record: FieldEvidenceRecord = {
        id: `ev_${listingKey}_${field}_${Date.now()}`,
        propertyMasterId: masterId || null,
        listingId: listingKey,
        fieldName: field,
        rawValue: data.rawValue !== undefined && data.rawValue !== null ? String(data.rawValue) : null,
        normalizedValue:
          data.normalizedValue !== undefined && data.normalizedValue !== null
            ? String(data.normalizedValue)
            : null,
        sourceCode: listing.sourceCode,
        evidenceType: data.method,
        confidence: data.confidence,
        snapshotId: snapshotId || null,
        observedAt: now,
      };
      this.records.push(record);
      generated.push(record);
    }

    return generated;
  }

  public getEvidenceForListing(listingId: string): FieldEvidenceRecord[] {
    return this.records.filter((r) => r.listingId === listingId);
  }

  public getAllEvidence(): FieldEvidenceRecord[] {
    return this.records;
  }
}
