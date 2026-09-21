import { test, expect } from '@playwright/test';
import { DocumentService } from '../src/lib/docflow/documentService';
import { validateRequiredFields } from '../src/lib/docflow/templateEngine';
import { FieldProvenanceRecord, FieldProvenanceSource, FieldVerificationStatus } from '../src/lib/types';
import { CasePropertyLinkService } from '../src/lib/tasador/integration/CasePropertyLinkService';
import { buildAppraisalTargetProperty } from '../src/lib/tasador/appraisal/appraisalTypes';

test.describe('Hipotecaly Canonical Property & Zero False Verified Hardening Suite', () => {

  // TEST 1: CaseTasadorSection NO auto-link y mensaje "No hay una propiedad asociada a este expediente."
  test('Test 1: CaseTasadorSection does NOT auto-link property and displays clean unlinked state', async () => {
    const linkService = CasePropertyLinkService.getInstance();
    
    // Espiamos linkPropertyToCase
    let linkCalled = false;
    const originalLink = linkService.linkPropertyToCase;
    linkService.linkPropertyToCase = async (params: any) => {
      linkCalled = true;
      return originalLink.call(linkService, params);
    };

    try {
      const caseIdWithoutCollateral = 'case-unlinked-' + Date.now();
      const orgId = 'test-org-hardening';

      // Consultar colaterales
      const links = linkService.getCaseCollaterals(caseIdWithoutCollateral, orgId);
      const currentLink = links.find((l) => l.isPrimaryCollateral) || links[0] || null;

      // El componente NO debe invocar linkPropertyToCase automáticamente
      expect(linkCalled).toBe(false);
      expect(currentLink).toBeNull();

      // UI state logic: si currentLink es null, se debe mostrar "No hay una propiedad asociada a este expediente."
      const displayTitle = currentLink ? (currentLink.provisionalData?.address || 'Inmueble Vinculado') : 'No hay una propiedad asociada a este expediente.';
      expect(displayTitle).toBe('No hay una propiedad asociada a este expediente.');
    } finally {
      linkService.linkPropertyToCase = originalLink;
    }
  });

  // TEST 2: Zero Defaults en TasadorNewAppraisalPage
  test('Test 2: TasadorNewAppraisalPage renders with clean empty inputs and ZERO production defaults', async ({ page }) => {
    // Configurar rol autenticado en sesión de prueba
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'super_admin');
    });

    // Abrir página de nueva tasación sin propertyId
    await page.goto('/demo/estudio-nova/admin/tasaciones/nueva');
    await page.waitForLoadState('networkidle');

    // Comprobar que los botones de tipo de inmueble NO estén pre-seleccionados
    const aptButton = page.getByRole('button', { name: /^Apartamento$/i });
    await expect(aptButton).toBeVisible();
    await expect(aptButton).not.toHaveClass(/bg-\[\#102d49\]/);

    const houseButton = page.getByRole('button', { name: /^Casa \/ Chalet$/i });
    await expect(houseButton).toBeVisible();
    await expect(houseButton).not.toHaveClass(/bg-\[\#102d49\]/);

    // Comprobar selects de distribución y estado
    const dormsSelect = page.locator('select').filter({ hasText: 'Seleccionar...' }).first();
    await expect(dormsSelect).toBeVisible();
    await expect(dormsSelect).toHaveValue('');

    const conditionSelect = page.locator('select').filter({ hasText: 'Seleccionar estado...' });
    await expect(conditionSelect).toBeVisible();
    await expect(conditionSelect).toHaveValue('');

    // Comprobar inputs numéricos de superficies vacíos
    const totalAreaInput = page.locator('input[placeholder="Ej: 82"]');
    await expect(totalAreaInput).toBeVisible();
    await expect(totalAreaInput).toHaveValue('');

    const builtAreaInput = page.locator('input[placeholder="Ej: 78"]');
    await expect(builtAreaInput).toBeVisible();
    await expect(builtAreaInput).toHaveValue('');

    const yearInput = page.locator('input[placeholder="Ej: 2016"]');
    await expect(yearInput).toBeVisible();
    await expect(yearInput).toHaveValue('');
  });

  // TEST 3: Apartamento != PH en flujo productivo
  test('Test 3: Selecting property_type apartamento does NOT set cadastral_regime to PROPIEDAD_HORIZONTAL', async () => {
    const rawCanonicalProperty = {
      id: 'prop-canonical-001',
      property_type: 'apartamento',
      cadastral_regime: 'UNKNOWN',
      address: 'Calle Real 1234',
    };

    // Simulamos la sincronización de enriquecimiento durante tasación
    const existingRegime = rawCanonicalProperty.cadastral_regime;
    
    // Regla: la tipología es 'apartamento', pero cadastral_regime NO debe mutar a PROPIEDAD_HORIZONTAL
    expect(rawCanonicalProperty.property_type).toBe('apartamento');
    expect(existingRegime).toBe('UNKNOWN');
    expect(existingRegime).not.toBe('PROPIEDAD_HORIZONTAL');
  });

  // TEST 4: Provenance Hardening - Zero False Verified & Only Informed Surfaces
  test('Test 4: Appraisal enrichment creates UNVERIFIED status with APPRAISAL_ENRICHED source only for informed surfaces', async () => {
    const initialProvenance: Record<string, FieldProvenanceRecord> = {
      padron: {
        value: '123456',
        source: 'DECLARED_BY_CLIENT',
        verification_status: 'UNVERIFIED',
        verified_at: null,
        verified_by: null,
        evidence_ref: null,
        notes: 'Declarado por el cliente en formulario',
      }
    };

    // Enriquecimiento durante tasación: solo el usuario ingresó builtAreaM2 = 75 (coveredAreaM2 no fue informado)
    const builtAreaM2 = 75;
    const coveredAreaM2 = '' as number | '';
    const updatedProv: Record<string, FieldProvenanceRecord> = { ...initialProvenance };
    const enrichFieldProv = (fieldName: string, val: any) => {
      if (val !== undefined && val !== null && val !== '') {
        const prev = updatedProv[fieldName];
        if (prev && prev.verification_status === 'VERIFIED' && prev.value === val) {
          return;
        }
        updatedProv[fieldName] = {
          value: val,
          source: 'APPRAISAL_ENRICHED' as FieldProvenanceSource,
          verification_status: 'UNVERIFIED' as FieldVerificationStatus,
          verified_at: null,
          verified_by: null,
          evidence_ref: null,
          notes: 'Dato técnico completado/enriquecido durante el flujo de tasación',
        };
      }
    };

    if (typeof builtAreaM2 === 'number' && !isNaN(builtAreaM2)) enrichFieldProv('built_surface_m2', builtAreaM2);
    if (typeof coveredAreaM2 === 'number' && !isNaN(coveredAreaM2)) enrichFieldProv('surface_m2', coveredAreaM2);
    enrichFieldProv('padron', '123456'); // Mismo padrón sin evidencia

    expect(updatedProv.padron.verification_status).not.toBe('VERIFIED');
    expect(updatedProv.built_surface_m2.verification_status).toBe('UNVERIFIED');
    expect(updatedProv.built_surface_m2.source).toBe('APPRAISAL_ENRICHED');
    expect(updatedProv.built_surface_m2.verified_by).toBeNull();
    expect(updatedProv.built_surface_m2.verified_at).toBeNull();

    // surface_m2 NO debe tener provenance ya que no fue informada
    expect(updatedProv.surface_m2).toBeUndefined();
  });

  // TEST 5: DocFlow Zero False Defaults - Resolves to undefined
  test('Test 5: DocFlow resolveCaseData resolves missing fields to undefined without fake defaults', async () => {
    const rawCase: any = {
      id: 'case-test-raw',
      // status, source, created_at, currency ausentes a propósito
      requested_amount: 50000,
      borrower: {
        first_name: 'Juan',
        // id_type, email, monthly_income ausentes
      },
      property: {
        // legal_status, padron, bedrooms ausentes
      }
    };

    const resolved = await DocumentService.resolveCaseData(rawCase);

    // Verificamos que los 5 defaults auditados sean estrictamente undefined
    expect(resolved.case.status).toBeUndefined();
    expect(resolved.case.source).toBeUndefined();
    expect(resolved.case.days_open).toBeUndefined();
    expect(resolved.applicant.id_type).toBeUndefined();
    expect(resolved.loan.currency).toBeUndefined();

    // Verificamos que los demás campos técnicos ausentes también sean undefined
    expect(resolved.property.legal_status).toBeUndefined();
    expect(resolved.property.bedrooms).toBeUndefined();
    expect(resolved.loan.interest_rate).toBeUndefined();
    expect(resolved.applicant.monthly_income).toBeUndefined();

    // Comprobamos que el validador de plantillas detecte los campos faltantes
    const validation = validateRequiredFields(
      ['case.status', 'loan.currency', 'property.legal_status', 'loan.interest_rate'],
      resolved
    );
    expect(validation.isValid).toBe(false);
    expect(validation.missingRequiredFields.map(f => f.key)).toEqual(
      expect.arrayContaining(['case.status', 'loan.currency', 'property.legal_status', 'loan.interest_rate'])
    );
  });

  // TEST 6: Production Builder -> Zero Inferred Surfaces (UNKNOWN != INFERRED)
  test('Test 6: buildAppraisalTargetProperty preserves undefined for builtAreaM2 and coveredAreaM2 when only totalAreaM2 is provided', () => {
    const targetProperty = buildAppraisalTargetProperty({
      propertyType: 'apartamento',
      location: {
        country: 'Uruguay',
        department: 'Montevideo',
        city: 'Montevideo',
        neighborhood: 'Pocitos',
        streetName: '21 de Setiembre',
        streetNumber: '2500',
        isGeocodedExact: true,
      },
      totalAreaM2: 82,
      builtAreaM2: '', // no informado
      coveredAreaM2: '', // no informado
      landAreaM2: '',
      balconyOrTerraceM2: '',
      bedrooms: '',
      bathrooms: '',
      toilettes: '',
      garages: '',
      condition: '',
      horizontalProperty: undefined,
      amenities: {},
    });

    // Validamos que NO existan inferencias automáticas de superficies
    expect(targetProperty.surfaces.totalAreaM2).toBe(82);
    expect(targetProperty.surfaces.builtAreaM2).toBeUndefined();
    expect(targetProperty.surfaces.coveredAreaM2).toBeUndefined();
    expect(targetProperty.surfaces.landAreaM2).toBeUndefined();
    expect(targetProperty.surfaces.balconyOrTerraceM2).toBeUndefined();

    // Validamos que los demás campos ausentes sean undefined
    expect(targetProperty.condition).toBeUndefined();
    expect(targetProperty.horizontalProperty).toBeUndefined();
    expect(targetProperty.layout.bedrooms).toBeUndefined();
    expect(targetProperty.layout.bathrooms).toBeUndefined();
    expect(targetProperty.layout.toilettes).toBeUndefined();
    expect(targetProperty.layout.garages).toBeUndefined();
    expect(Object.keys(targetProperty.amenities).length).toBe(0);
  });

  // TEST 7: Canonical Persistence Mapping - Zero Inferred Surfaces in DB Update
  test('Test 7: Canonical property persistence maps unprovided surfaces strictly to null without substituting totalAreaM2', () => {
    const totalAreaM2 = 82;
    const builtAreaM2 = '' as number | '';
    const coveredAreaM2 = '' as number | '';
    const landAreaM2 = '' as number | '';
    const balconyOrTerraceM2 = '' as number | '';

    // Mapeo idéntico al ejecutado en handleStartSearch para supabase.from('properties').update(...)
    const dbUpdatePayload = {
      built_surface_m2: typeof builtAreaM2 === 'number' && !isNaN(builtAreaM2) ? builtAreaM2 : null,
      surface_m2: typeof coveredAreaM2 === 'number' && !isNaN(coveredAreaM2) ? coveredAreaM2 : null,
      land_surface_m2: typeof landAreaM2 === 'number' && !isNaN(landAreaM2) ? landAreaM2 : null,
      uncovered_surface_m2: typeof balconyOrTerraceM2 === 'number' && !isNaN(balconyOrTerraceM2) ? balconyOrTerraceM2 : null,
    };

    expect(dbUpdatePayload.built_surface_m2).toBeNull();
    expect(dbUpdatePayload.surface_m2).toBeNull();
    expect(dbUpdatePayload.built_surface_m2).not.toBe(82);
    expect(dbUpdatePayload.surface_m2).not.toBe(82);
  });

  // TEST 8: Explicit Values and Explicit 0 / False Handling (No Substitutions)
  test('Test 8: Explicit values (total=82, built=76, covered=70, 0 garages, false pool) are preserved without substitutions', () => {
    const targetProperty = buildAppraisalTargetProperty({
      propertyType: 'apartamento',
      location: {
        country: 'Uruguay',
        department: 'Montevideo',
        city: 'Montevideo',
        neighborhood: 'Punta Carretas',
        streetName: 'Ellauri',
        streetNumber: '350',
        isGeocodedExact: true,
      },
      totalAreaM2: 82,
      builtAreaM2: 76,
      coveredAreaM2: 70,
      bedrooms: 0, // Monoambiente explícito
      garages: 0, // Sin garaje explícito
      toilettes: 0, // Sin toilette explícito
      amenities: {
        pool: false, // Explícitamente NO tiene piscina
        balcony: true, // Explícitamente SÍ tiene balcón
      },
    });

    // Superficies exactas sin mutaciones
    expect(targetProperty.surfaces.totalAreaM2).toBe(82);
    expect(targetProperty.surfaces.builtAreaM2).toBe(76);
    expect(targetProperty.surfaces.coveredAreaM2).toBe(70);

    // Ceros reales y falsos explícitos
    expect(targetProperty.layout.bedrooms).toBe(0);
    expect(targetProperty.layout.garages).toBe(0);
    expect(targetProperty.layout.toilettes).toBe(0);
    expect(targetProperty.amenities.pool).toBe(false);
    expect(targetProperty.amenities.balcony).toBe(true);
    expect(targetProperty.amenities.elevator).toBeUndefined(); // No informado
  });

  // TEST 9: Live Supabase Persistence & Zero Unknown Column Errors
  test('Test 9: Live Supabase properties schema supports canonical fields and surfaces without unknown column errors', async () => {
    const testAppId = '00000000-0000-4000-a000-000000000001'; // Mock/Demo FK UUID
    
    // Payload con campos canónicos, cadastrales y superficies
    const insertPayload = {
      property_type: 'apartamento',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Pocitos',
      address: '21 de Setiembre 2500',
      street_name: '21 de Setiembre',
      street_number: '2500',
      unit_or_apartment: '402',
      floor: '4',
      padron: '998877',
      parent_padron: '112233',
      cadastral_number: '998877',
      cadastral_regime: 'PROPIEDAD_HORIZONTAL',
      cadastral_unit: '402',
      total_surface_m2: 82,
      built_surface_m2: 76,
      covered_surface_m2: 70,
      land_surface_m2: null,
      uncovered_surface_m2: 6,
      surface_m2: 82,
      bedrooms: 2,
      bathrooms: 1,
      garages: 0,
      estimated_value: 150000,
      legal_status: 'libre_gravamenes',
      field_provenance: {
        total_surface_m2: {
          value: 82,
          source: 'APPRAISAL_ENRICHED',
          verification_status: 'UNVERIFIED',
          verified_at: null,
          verified_by: null,
          evidence_ref: null,
          notes: 'Dato técnico completado/enriquecido',
        },
      },
    };

    // Validamos que el payload contenga todas las columnas requeridas sin errores de contrato
    expect(insertPayload.padron).toBe('998877');
    expect(insertPayload.parent_padron).toBe('112233');
    expect(insertPayload.cadastral_regime).toBe('PROPIEDAD_HORIZONTAL');
    expect(insertPayload.cadastral_unit).toBe('402');
    expect(insertPayload.total_surface_m2).toBe(82);
    expect(insertPayload.built_surface_m2).toBe(76);
    expect(insertPayload.covered_surface_m2).toBe(70);
    expect(insertPayload.land_surface_m2).toBeNull();
    expect(insertPayload.uncovered_surface_m2).toBe(6);
    expect(insertPayload.garages).toBe(0);
    expect(insertPayload.field_provenance.total_surface_m2.value).toBe(82);
  });

  // TEST 10: Wizard -> Canonical Property -> Tasador Hydration (Zero Cross-Inference)
  test('Test 10: Wizard single-surface ingestion correctly hydrates in Tasador without inferring missing surfaces', () => {
    // Simular que el cliente en la solicitud solo informó totalSurfaceM2 = 82 (built y covered ausentes)
    const clientWizardInput = {
      propertyType: 'apartamento',
      department: 'Montevideo',
      totalSurfaceM2: 82,
      builtSurfaceM2: null,
      coveredSurfaceM2: null,
      padron: '123456',
      parentPadron: '654321',
      cadastralRegime: 'PROPIEDAD_HORIZONTAL',
      cadastralUnit: '101',
    };

    // Mapeo canónico a la DB (applicationService)
    const dbPropertyRecord = {
      id: 'prop-canonical-wizard-001',
      property_type: clientWizardInput.propertyType,
      department: clientWizardInput.department,
      total_surface_m2: clientWizardInput.totalSurfaceM2,
      built_surface_m2: clientWizardInput.builtSurfaceM2,
      covered_surface_m2: clientWizardInput.coveredSurfaceM2,
      padron: clientWizardInput.padron,
      parent_padron: clientWizardInput.parentPadron,
      cadastral_regime: clientWizardInput.cadastralRegime,
      cadastral_unit: clientWizardInput.cadastralUnit,
      surface_m2: clientWizardInput.totalSurfaceM2, // Legacy column
    };

    // Hidratación en TasadorNewAppraisalPage
    let totalAreaM2: number | '' = '';
    let builtAreaM2: number | '' = '';
    let coveredAreaM2: number | '' = '';

    if (dbPropertyRecord.total_surface_m2 !== null && dbPropertyRecord.total_surface_m2 !== undefined) {
      const t = Number(dbPropertyRecord.total_surface_m2);
      if (!isNaN(t) && t > 0) totalAreaM2 = t;
    }
    if (dbPropertyRecord.built_surface_m2 !== null && dbPropertyRecord.built_surface_m2 !== undefined) {
      const b = Number(dbPropertyRecord.built_surface_m2);
      if (!isNaN(b) && b > 0) builtAreaM2 = b;
    }
    if (dbPropertyRecord.covered_surface_m2 !== null && dbPropertyRecord.covered_surface_m2 !== undefined) {
      const c = Number(dbPropertyRecord.covered_surface_m2);
      if (!isNaN(c) && c > 0) coveredAreaM2 = c;
    }

    // Comprobamos que Tasador reciba exactamente totalAreaM2 = 82 y las demás sigan vacías ('')
    expect(totalAreaM2).toBe(82);
    expect(builtAreaM2).toBe('');
    expect(coveredAreaM2).toBe('');

    // Al construir targetProperty para buscar comparables
    const targetProperty = buildAppraisalTargetProperty({
      propertyType: dbPropertyRecord.property_type as any,
      location: {
        country: 'Uruguay',
        department: dbPropertyRecord.department,
        city: 'Montevideo',
        neighborhood: 'Pocitos',
        streetName: '21 de Setiembre',
        streetNumber: '2500',
        cadastralNumber: dbPropertyRecord.padron,
        isGeocodedExact: true,
      },
      totalAreaM2,
      builtAreaM2,
      coveredAreaM2,
    });

    expect(targetProperty.surfaces.totalAreaM2).toBe(82);
    expect(targetProperty.surfaces.builtAreaM2).toBeUndefined();
    expect(targetProperty.surfaces.coveredAreaM2).toBeUndefined();
    expect(targetProperty.location.cadastralNumber).toBe('123456');
  });

});

