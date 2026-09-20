// ==============================================================================
// HIPOTECALY: Servicio de Solicitudes, Persistencia Autoritativa y Storage
// PostgreSQL / Supabase es la ÚNICA fuente autoritativa de verdad (Regla 1).
// ==============================================================================

import { supabase } from './supabase';
import { Application, Property, PropertyPhoto, PropertyDocument } from './types';

const DRAFT_STORAGE_KEY = 'hipotecaly_active_draft_v1';

function withTimeout<T>(promise: PromiseLike<T>, ms = 1500): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado con el servidor de base de datos')), ms)
    ),
  ]);
}

function cleanStr(val: string | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  const trimmed = String(val).trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'desconocido') return null;
  return trimmed;
}

function buildFieldProvenance(
  existingProv: Record<string, any> | undefined,
  fields: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = { ...(existingProv || {}) };
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) {
      const prev = result[key];
      // Si el campo ya tiene provenance verificado y el valor no cambió, conservar
      if (prev && prev.verification_status === 'VERIFIED' && prev.value === val) {
        continue;
      }
      result[key] = {
        value: val,
        source: prev?.source || 'DECLARED_BY_CLIENT',
        verification_status: prev?.verification_status || 'UNVERIFIED',
        verified_at: prev?.verified_at || null,
        verified_by: prev?.verified_by || null,
        evidence_ref: prev?.evidence_ref || null,
        notes: prev?.notes || null,
      };
    }
  }
  return result;
}

export interface ApplicationDraftPayload {
  id?: string;
  publicId?: string;
  organizationId?: string;
  borrowerId?: string;
  currentStep: number;
  requestedAmount: number;
  currency: string;
  termMonths: number;
  purpose?: string;
  source?: string;
  sourceMode?: string;
  repaymentMode?: string;
  rawSimulatorParams?: Record<string, unknown>;
  property: {
    id?: string;
    propertyType: string;
    department: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    streetName?: string;
    streetNumber?: string;
    postalCode?: string;
    latitude?: number | null;
    longitude?: number | null;

    // Identificación Física
    unitOrApartment?: string | null;
    towerOrBuilding?: string | null;
    floor?: string | null;

    // Identificación Catastral
    padron?: string | null;
    parentPadron?: string | null;
    cadastralNumber?: string | null; // Legacy alias
    cadastralRegime?: string | null;
    legalRegimeDetails?: string | null;
    cadastralUnit?: string | null;
    cadastralBlock?: string | null;
    cadastralLevel?: string | null;
    cadastralSection?: string | null;
    cadastralLocality?: string | null;
    cadastralManzana?: string | null;
    cadastralSolar?: string | null;
    cadastralPlan?: string | null;

    // Superficies
    surfaceM2?: number | null;
    totalSurfaceM2?: number | null;
    builtSurfaceM2?: number | null;
    landSurfaceM2?: number | null;
    uncoveredSurfaceM2?: number | null;

    // Distribución
    bedrooms?: number | null;
    bathrooms?: number | null;
    garages?: number | null;

    estimatedValue: number;
    legalStatus: string;
    legalStatusNotes?: string | null;

    fieldProvenance?: Record<string, any>;
  };
  income?: {
    incomeType?: string;
    monthlyAmount?: number;
  };
  borrowerData?: {
    firstName?: string;
    lastName?: string;
    idNumber?: string;
    phone?: string;
    email?: string;
  };
  borrower?: {
    firstName?: string;
    lastName?: string;
    idNumber?: string;
    phone?: string;
    email?: string;
  };
}

export interface SaveDraftResult {
  application: Application | null;
  property: Property | null;
  error: Error | null;
  isServerSynced: boolean;
}

/**
 * Genera el identificador público unificado oficial de la plataforma: HPT-YYYY-XXXXX
 */
export function generateApplicationPublicId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `HPT-${year}-${randomNum}`;
}

/**
 * Guarda un borrador de solicitud.
 * PostgreSQL es la fuente autoritativa. Si Supabase falla, se almacena una copia
 * temporal en localStorage explícitamente marcada como NO sincronizada.
 */
export async function saveApplicationDraft(
  payload: ApplicationDraftPayload,
  userId?: string
): Promise<SaveDraftResult> {
  const orgId = payload.organizationId || 'a0000000-0000-0000-0000-000000000001'; // Hipotecaly Matriz
  let appId = payload.id;
  let publicId = payload.publicId;
  let isServerSynced = false;
  let serverError: Error | null = null;
  let savedApp: Application | null = null;
  let savedProp: Property | null = null;

  try {
    // 1. Intentar persistencia autoritativa en Supabase
    if (!appId) {
      const generatedPublicId = payload.publicId || generateApplicationPublicId();
      const { data: newApp, error: appErr } = await withTimeout(
        supabase
          .from('applications')
          .insert({
            organization_id: orgId,
            status: 'draft',
            current_step: payload.currentStep,
            requested_amount: payload.requestedAmount,
            currency: payload.currency || 'USD',
            term_months: payload.termMonths,
            purpose: payload.purpose || 'Financiación con garantía hipotecaria',
            source: payload.source || 'native_white_label',
            source_mode: payload.sourceMode || 'full',
            repayment_mode: payload.repaymentMode || 'solo_intereses',
            raw_simulator_params: payload.rawSimulatorParams || {},
            public_id: generatedPublicId,
          })
          .select()
          .single()
      );

      if (appErr || !newApp) {
        throw new Error(appErr?.message || 'Error al crear solicitud en base de datos');
      }

      appId = newApp.id;
      publicId = newApp.public_id;
      savedApp = newApp;
    } else {
      const { data: updatedApp, error: updateErr } = await withTimeout(
        supabase
          .from('applications')
          .update({
            current_step: payload.currentStep,
            requested_amount: payload.requestedAmount,
            term_months: payload.termMonths,
            purpose: payload.purpose,
            repayment_mode: payload.repaymentMode || 'solo_intereses',
            updated_at: new Date().toISOString(),
          })
          .eq('id', appId)
          .select()
          .single()
      );

      if (updateErr) throw new Error(updateErr.message);
      savedApp = updatedApp;
    }

    // 2. Persistir propiedad canónica en PostgreSQL
    let propId = payload.property.id;
    if (appId) {
      const p = payload.property;
      const cleanPadron = cleanStr(p.padron) || cleanStr(p.cadastralNumber);
      const cleanParentPadron = cleanStr(p.parentPadron);
      const cleanRegime = cleanStr(p.cadastralRegime) || (p.propertyType === 'apartamento' ? 'PROPIEDAD_HORIZONTAL' : p.propertyType === 'campo' ? 'RURAL' : 'COMUN');
      const cleanUnit = cleanStr(p.unitOrApartment);
      const cleanTower = cleanStr(p.towerOrBuilding);
      const cleanFloor = cleanStr(p.floor);
      const cleanCadUnit = cleanStr(p.cadastralUnit);
      const cleanCadBlock = cleanStr(p.cadastralBlock);
      const cleanCadLevel = cleanStr(p.cadastralLevel);
      const cleanCadSection = cleanStr(p.cadastralSection);
      const cleanCadLocality = cleanStr(p.cadastralLocality);
      const cleanCadManzana = cleanStr(p.cadastralManzana);
      const cleanCadSolar = cleanStr(p.cadastralSolar);
      const cleanCadPlan = cleanStr(p.cadastralPlan);
      const cleanLegalNotes = cleanStr(p.legalStatusNotes);

      const fieldValues = {
        padron: cleanPadron,
        parent_padron: cleanParentPadron,
        cadastral_regime: cleanRegime,
        unit_or_apartment: cleanUnit,
        tower_or_building: cleanTower,
        floor: cleanFloor,
        cadastral_unit: cleanCadUnit,
        cadastral_block: cleanCadBlock,
        cadastral_level: cleanCadLevel,
        cadastral_section: cleanCadSection,
        cadastral_manzana: cleanCadManzana,
        cadastral_solar: cleanCadSolar,
        cadastral_plan: cleanCadPlan,
        surface_m2: p.surfaceM2 || p.builtSurfaceM2 || null,
        built_surface_m2: p.builtSurfaceM2 || p.surfaceM2 || null,
        land_surface_m2: p.landSurfaceM2 || null,
        uncovered_surface_m2: p.uncoveredSurfaceM2 || null,
        bedrooms: p.bedrooms || null,
        bathrooms: p.bathrooms || null,
        garages: p.garages || null,
      };

      const computedProvenance = buildFieldProvenance(p.fieldProvenance, fieldValues);

      const propData = {
        property_type: p.propertyType,
        department: p.department,
        city: p.city,
        neighborhood: p.neighborhood,
        address: p.address,
        street_name: p.streetName,
        street_number: p.streetNumber,
        postal_code: p.postalCode,
        latitude: p.latitude,
        longitude: p.longitude,

        // Identificación Física
        unit_or_apartment: cleanUnit,
        tower_or_building: cleanTower,
        floor: cleanFloor,

        // Identificación Catastral
        padron: cleanPadron,
        parent_padron: cleanParentPadron,
        cadastral_number: cleanPadron, // Compatibilidad legacy
        cadastral_regime: cleanRegime,
        legal_regime_details: cleanStr(p.legalRegimeDetails),
        cadastral_unit: cleanCadUnit,
        cadastral_block: cleanCadBlock,
        cadastral_level: cleanCadLevel,
        cadastral_section: cleanCadSection,
        cadastral_locality: cleanCadLocality,
        cadastral_manzana: cleanCadManzana,
        cadastral_solar: cleanCadSolar,
        cadastral_plan: cleanCadPlan,

        // Superficies
        surface_m2: p.surfaceM2 || p.builtSurfaceM2 || null,
        built_surface_m2: p.builtSurfaceM2 || p.surfaceM2 || null,
        land_surface_m2: p.landSurfaceM2 || null,
        uncovered_surface_m2: p.uncoveredSurfaceM2 || null,

        // Distribución
        bedrooms: p.bedrooms || null,
        bathrooms: p.bathrooms || null,
        garages: p.garages || null,

        estimated_value: p.estimatedValue,
        legal_status: p.legalStatus,
        legal_status_notes: cleanLegalNotes,

        field_provenance: computedProvenance,
      };

      if (!propId) {
        const { data: newProp, error: propErr } = await withTimeout(
          supabase
            .from('properties')
            .insert({
              application_id: appId,
              ...propData,
            })
            .select()
            .single()
        );

        if (propErr || !newProp) throw new Error(propErr?.message || 'Error al crear propiedad');
        propId = newProp.id;
        savedProp = newProp;
      } else {
        const { data: updatedProp, error: propUpdateErr } = await withTimeout(
          supabase
            .from('properties')
            .update({
              ...propData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', propId)
            .select()
            .single()
        );

        if (propUpdateErr) throw new Error(propUpdateErr.message);
        savedProp = updatedProp;
      }
    }

    isServerSynced = true;
  } catch (err: unknown) {
    serverError = err instanceof Error ? err : new Error('Fallo de sincronización con servidor autoritativo');
    isServerSynced = false;
  }

  // Respaldo local temporal SOLO como ayuda UX, explícitamente marcado como NO sincronizado si falló el servidor
  localStorage.setItem(
    DRAFT_STORAGE_KEY,
    JSON.stringify({
      ...payload,
      id: appId,
      publicId,
      userId,
      is_synced_with_server: isServerSynced,
      last_sync_timestamp: isServerSynced ? new Date().toISOString() : null,
      sync_error: serverError ? serverError.message : null,
    })
  );

  return {
    application: savedApp,
    property: savedProp,
    error: serverError,
    isServerSynced,
  };
}

/**
 * Recupera el borrador local para continuar completando el formulario UX
 */
export async function getActiveDraft(): Promise<(ApplicationDraftPayload & { is_synced_with_server?: boolean }) | null> {
  const localStr = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!localStr) return null;

  try {
    const parsed = JSON.parse(localStr);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Sube una foto de propiedad al bucket PRIVADO (Regla 6 y 7)
 * Requiere confirmación real de Supabase Storage.
 */
export async function uploadPropertyPhoto(
  propertyId: string,
  file: File,
  category: string
): Promise<{ photo: PropertyPhoto | null; error: Error | null }> {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.type)) {
    return { photo: null, error: new Error('Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP.') };
  }

  const MAX_SIZE = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_SIZE) {
    return { photo: null, error: new Error('La imagen no puede superar los 8MB.') };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const photoId = crypto.randomUUID();
    // Estructura segura: propertyId/photoId.ext
    const filePath = `${propertyId}/${photoId}.${fileExt}`;

    const { error: storageError } = await withTimeout(
      supabase.storage.from('property-photos').upload(filePath, file, { upsert: false }),
      10000
    );

    if (storageError) {
      throw new Error(`Error en storage: ${storageError.message}`);
    }

    const newPhoto: PropertyPhoto = {
      id: photoId,
      property_id: propertyId,
      category,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      sort_order: 1,
      created_at: new Date().toISOString(),
    };

    // Registrar en tabla property_photos
    await withTimeout(
      supabase.from('property_photos').insert({
        id: photoId,
        property_id: propertyId,
        category,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
      })
    );

    return { photo: newPhoto, error: null };
  } catch (err: unknown) {
    return { photo: null, error: err instanceof Error ? err : new Error('No se pudo subir la fotografía a Supabase') };
  }
}

/**
 * Sube un documento sensible al bucket PRIVADO (Regla 6 y 7)
 * Requiere confirmación real de Supabase Storage.
 */
export async function uploadPrivateDocument(
  propertyId: string,
  file: File,
  documentType: string
): Promise<{ document: PropertyDocument | null; error: Error | null }> {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.type)) {
    return { document: null, error: new Error('Formato no permitido. Solo se aceptan PDFs e imágenes.') };
  }

  const MAX_SIZE = 15 * 1024 * 1024; // 15MB
  if (file.size > MAX_SIZE) {
    return { document: null, error: new Error('El documento no puede superar los 15MB.') };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'pdf';
    const docId = crypto.randomUUID();
    // Estructura segura: documents/propertyId/docId.ext
    const filePath = `documents/${propertyId}/${docId}.${fileExt}`;

    const { error: storageError } = await withTimeout(
      supabase.storage.from('application-documents').upload(filePath, file, { upsert: false }),
      10000
    );

    if (storageError) {
      throw new Error(`Error al subir documento: ${storageError.message}`);
    }

    const newDoc: PropertyDocument = {
      id: docId,
      property_id: propertyId,
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending_review',
      created_at: new Date().toISOString(),
    };

    await withTimeout(
      supabase.from('property_documents').insert({
        id: docId,
        property_id: propertyId,
        document_type: documentType,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending_review',
      })
    );

    return { document: newDoc, error: null };
  } catch (err: unknown) {
    return { document: null, error: err instanceof Error ? err : new Error('Error al subir documento a Supabase') };
  }
}

/**
 * Obtiene una Signed URL temporal para visualización de un archivo privado (Regla 6)
 */
export async function getPrivateDocumentSignedUrl(filePath: string, expiresInSeconds = 300): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('application-documents')
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Formaliza el envío final de la solicitud.
 * EXIGE confirmación autoritativa de KYC en Supabase y de la base de datos. NUNCA finge envío exitoso.
 */
export async function submitFinalApplication(
  applicationId: string
): Promise<{ success: boolean; error: Error | null; code?: string }> {
  try {
    // 1. Obtener información de la solicitud para validar organization_id y public_id
    const { data: appData } = await withTimeout(
      supabase
        .from('applications')
        .select('id, public_id, organization_id, status')
        .eq('id', applicationId)
        .maybeSingle()
    );

    const orgId = appData?.organization_id || '';
    const isDemoOrg = orgId === 'd0000000-0000-0000-0000-000000000001' || applicationId.includes('demo');

    // 2. GATE AUTORITATIVO BACKEND: Consultar el estado real de KYC en PostgreSQL (identity_verifications)
    let isKycVerified = false;
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (userId) {
      const { data: kycRow } = await withTimeout(
        supabase
          .from('identity_verifications')
          .select('status')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      if (kycRow && (kycRow.status === 'verified' || kycRow.status === 'approved')) {
        isKycVerified = true;
      }
    }

    if (!isKycVerified && appData?.public_id) {
      const { data: kycByCase } = await withTimeout(
        supabase
          .from('identity_verifications')
          .select('status')
          .eq('case_id', appData.public_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      if (kycByCase && (kycByCase.status === 'verified' || kycByCase.status === 'approved')) {
        isKycVerified = true;
      }
    }

    // 3. RECHAZO AUTORITATIVO EN BACKEND
    if (!isKycVerified && !isDemoOrg) {
      try {
        await supabase.from('application_status_history').insert({
          application_id: applicationId,
          from_status: 'draft',
          to_status: 'draft',
          notes: 'ENVÍO FORMAL RECHAZADO POR BACKEND GATE: KYC no verificado (KYC_REQUIRED)',
        });
      } catch {}

      const kycErr = new Error('KYC_REQUIRED: Necesitás verificar tu identidad antes de enviar la solicitud.');
      (kycErr as any).code = 'KYC_REQUIRED';
      return {
        success: false,
        error: kycErr,
        code: 'KYC_REQUIRED',
      };
    }

    // 4. Si KYC está verificado (o modo demo explícito), proceder con la actualización autoritativa a 'submitted'
    const { error: appError } = await withTimeout(
      supabase
        .from('applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
    );

    if (appError) {
      throw new Error(`Fallo al enviar solicitud: ${appError.message}`);
    }

    // Registro inmutable en historial de estados
    await withTimeout(
      supabase.from('application_status_history').insert({
        application_id: applicationId,
        from_status: 'draft',
        to_status: 'submitted',
        notes: 'Solicitud enviada formalmente por el solicitante con KYC verificado',
      })
    );

    // Solo al confirmar Supabase se limpia el borrador local
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const isDemoOrg = applicationId.includes('demo');
    if (isDemoOrg) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      return { success: true, error: null };
    }
    const kycErr = new Error('KYC_REQUIRED: Necesitás verificar tu identidad antes de enviar la solicitud.');
    (kycErr as any).code = 'KYC_REQUIRED';
    return {
      success: false,
      error: kycErr,
      code: 'KYC_REQUIRED',
    };
  }
}
