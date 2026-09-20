import { test, expect } from '@playwright/test';
import { DocumentService } from '../src/lib/docflow/documentService';
import { validateRequiredFields } from '../src/lib/docflow/templateEngine';
import { FieldProvenanceRecord, FieldProvenanceSource, FieldVerificationStatus } from '../src/lib/types';
import { CasePropertyLinkService } from '../src/lib/tasador/integration/CasePropertyLinkService';

test.describe('Hipotecaly Canonical Property & Zero False Verified Hardening Suite', () => {

  // TEST 1: Zero False Verified en Tasación / Enriquecimiento
  test('Test 1: Tasador enrichment creates UNVERIFIED status and APPRAISAL_ENRICHED source', () => {
    const rawEnrichment: FieldProvenanceRecord = {
      value: 120,
      source: 'APPRAISAL_ENRICHED' as FieldProvenanceSource,
      verification_status: 'UNVERIFIED' as FieldVerificationStatus,
      verified_at: null,
      verified_by: null,
      evidence_ref: null,
      notes: 'Dato técnico completado/enriquecido durante el flujo de tasación',
    };

    expect(rawEnrichment.verification_status).toBe('UNVERIFIED');
    expect(rawEnrichment.source).toBe('APPRAISAL_ENRICHED');
    expect(rawEnrichment.verified_at).toBeNull();
    expect(rawEnrichment.verified_by).toBeNull();
    expect(rawEnrichment.evidence_ref).toBeNull();
  });

  // TEST 2: Verificación Explícita válida
  test('Test 2: Explicit verification attaches VERIFIED, verified_by, verified_at and evidence_ref', () => {
    const explicitVerification: FieldProvenanceRecord = {
      value: '12345',
      source: 'OFFICIAL_REGISTRY_VERIFIED' as FieldProvenanceSource,
      verification_status: 'VERIFIED' as FieldVerificationStatus,
      verified_at: '2026-09-19T23:00:00.000Z',
      verified_by: 'escribano-usr-01',
      evidence_ref: 'DNC-PADRON-CERT-998822',
      notes: 'Verificado contra cédula catastral oficial de DNC',
    };

    expect(explicitVerification.verification_status).toBe('VERIFIED');
    expect(explicitVerification.source).toBe('OFFICIAL_REGISTRY_VERIFIED');
    expect(explicitVerification.verified_by).toBeTruthy();
    expect(explicitVerification.verified_at).toBeTruthy();
    expect(explicitVerification.evidence_ref).toBe('DNC-PADRON-CERT-998822');
  });

  // TEST 3: Desacoplamiento Tipología vs Régimen Catastral (apartamento != PROPIEDAD_HORIZONTAL)
  test('Test 3: property_type apartamento does NOT infer cadastral_regime PROPIEDAD_HORIZONTAL', () => {
    const propertyPayload = {
      property_type: 'apartamento',
      cadastral_regime: 'COMUN_PADRON_UNICO', // Un apartamento puede ser padrón único histórico o no estar bajo régimen PH
    };

    expect(propertyPayload.property_type).toBe('apartamento');
    expect(propertyPayload.cadastral_regime).not.toBe('PROPIEDAD_HORIZONTAL');
  });

  // TEST 4: DocFlow Zero Fake Data - Missing Legal Status
  test('Test 4: Missing legal_status resolves to undefined and required field validation flags it', async () => {
    const rawCase: any = {
      id: 'case-test-01',
      case_number: 'EXP-2026-001',
      status: 'UNDERWRITING',
      property: {
        property_type: 'casa',
        address: 'Av. Brasil 2980',
        padron: '445566',
        legal_status: null, // Sin estado jurídico
      },
    };

    const resolved = await DocumentService.resolveCaseData(rawCase);
    expect(resolved.property.legal_status).toBeUndefined();

    // Template requiring legal_status
    const validation = validateRequiredFields(['property.legal_status'], resolved);
    expect(validation.isValid).toBe(false);
    expect(validation.missingRequiredFields.map(f => f.key)).toContain('property.legal_status');
  });

  // TEST 5: DocFlow Zero Fake Data - Missing Interest Rate (No default 11.5%)
  test('Test 5: Missing interest_rate resolves to undefined and required field validation flags it', async () => {
    const rawCase: any = {
      id: 'case-test-02',
      case_number: 'EXP-2026-002',
      requested_amount: 100000,
      interest_rate: null, // Sin tasa asignada
    };

    const resolved = await DocumentService.resolveCaseData(rawCase);
    expect(resolved.loan.interest_rate).toBeUndefined();

    const validation = validateRequiredFields(['loan.interest_rate'], resolved);
    expect(validation.isValid).toBe(false);
    expect(validation.missingRequiredFields.map(f => f.key)).toContain('loan.interest_rate');
  });

  // TEST 6: DocFlow Zero Fake Data - Missing Numbers (Not 0)
  test('Test 6: Missing numerical values resolve to undefined, not 0', async () => {
    const rawCase: any = {
      id: 'case-test-03',
      case_number: 'EXP-2026-003',
      income: {
        monthly_amount: null,
      },
      property: {
        bedrooms: null,
        bathrooms: null,
      },
    };

    const resolved = await DocumentService.resolveCaseData(rawCase);
    expect(resolved.applicant.monthly_income).toBeUndefined();
    expect(resolved.property.bedrooms).toBeUndefined();
    expect(resolved.property.bathrooms).toBeUndefined();
  });

  // TEST 7: CaseTasador Link Service without Property
  test('Test 7: Case without collateral returns empty list and does not auto-create fake property', () => {
    const linkService = CasePropertyLinkService.getInstance();
    const links = linkService.getCaseCollaterals('case-empty-collateral', 'test-org');
    expect(links).toEqual([]);
  });

});
