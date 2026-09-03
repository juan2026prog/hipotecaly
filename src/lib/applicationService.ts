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
  property: {
    id?: string;
    propertyType: string;
    department: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    cadastralNumber?: string;
    surfaceM2?: number;
    bedrooms?: number;
    bathrooms?: number;
    estimatedValue: number;
    legalStatus: string;
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
      const generatedPublicId = `HIP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', appId)
          .select()
          .single()
      );

      if (updateErr) throw new Error(updateErr.message);
      savedApp = updatedApp;
    }

    // 2. Persistir propiedad en PostgreSQL
    let propId = payload.property.id;
    if (appId) {
      if (!propId) {
        const { data: newProp, error: propErr } = await withTimeout(
          supabase
            .from('properties')
            .insert({
              application_id: appId,
              property_type: payload.property.propertyType,
              department: payload.property.department,
              city: payload.property.city,
              neighborhood: payload.property.neighborhood,
              address: payload.property.address,
              cadastral_number: payload.property.cadastralNumber,
              surface_m2: payload.property.surfaceM2,
              bedrooms: payload.property.bedrooms,
              bathrooms: payload.property.bathrooms,
              estimated_value: payload.property.estimatedValue,
              legal_status: payload.property.legalStatus,
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
              property_type: payload.property.propertyType,
              department: payload.property.department,
              city: payload.property.city,
              neighborhood: payload.property.neighborhood,
              address: payload.property.address,
              cadastral_number: payload.property.cadastralNumber,
              surface_m2: payload.property.surfaceM2,
              bedrooms: payload.property.bedrooms,
              bathrooms: payload.property.bathrooms,
              estimated_value: payload.property.estimatedValue,
              legal_status: payload.property.legalStatus,
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
 * EXIGE confirmación autoritativa de Supabase. NUNCA finge envío exitoso.
 */
export async function submitFinalApplication(
  applicationId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
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
        notes: 'Solicitud enviada formalmente por el solicitante',
      })
    );

    // Solo al confirmar Supabase se limpia el borrador local
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('No fue posible confirmar el envío con Supabase. Reintente.'),
    };
  }
}
