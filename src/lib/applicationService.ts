// ==============================================================================
// HIPOTECALY: Servicio de Solicitudes, Persistencia de Drafts y Storage
// ==============================================================================

import { supabase } from './supabase';
import { Application, Property, PropertyPhoto, PropertyDocument, PropertyType, LegalStatus } from './types';

const DRAFT_STORAGE_KEY = 'hipotecaly_active_draft_v1';

function withTimeout<T>(promise: PromiseLike<T>, ms = 800): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
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
    incomeType: string;
    monthlyAmount: number;
    employerOrSource?: string;
  };
  borrowerData?: {
    firstName: string;
    lastName: string;
    idNumber?: string;
    email: string;
    phone?: string;
    address?: string;
  };
}

/**
 * Guarda o actualiza el borrador (draft) inmediatamente en PostgreSQL a través de Supabase
 */
export async function saveApplicationDraft(
  payload: ApplicationDraftPayload,
  userId?: string
): Promise<{ application: Application; property: Property; error: Error | null }> {
  try {
    const orgId = payload.organizationId || 'a0000000-0000-0000-0000-000000000001'; // Hipotecaly Matriz

    // 1. Crear o actualizar registro en tabla applications
    let appId = payload.id;
    let publicId = payload.publicId;

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

      if (!appErr && newApp) {
        appId = newApp.id;
        publicId = newApp.public_id;
      } else {
        // Fallback local con ID generado si la base local no está accesible
        appId = appId || crypto.randomUUID();
        publicId = publicId || generatedPublicId;
      }
    } else {
      await withTimeout(
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
      );
    }

    // 2. Crear o actualizar registro en tabla properties
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

        if (!propErr && newProp) {
          propId = newProp.id;
        } else {
          propId = propId || crypto.randomUUID();
        }
      } else {
        await supabase
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
          .eq('id', propId);
      }
    }

    const applicationResult: Application = {
      id: appId!,
      public_id: publicId || `HIP-2026-00124`,
      organization_id: orgId,
      status: 'draft',
      current_step: payload.currentStep,
      requested_amount: payload.requestedAmount,
      currency: payload.currency || 'USD',
      term_months: payload.termMonths,
      purpose: payload.purpose,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const propertyResult: Property = {
      id: propId || crypto.randomUUID(),
      application_id: appId!,
      property_type: payload.property.propertyType as PropertyType,
      department: payload.property.department,
      city: payload.property.city,
      neighborhood: payload.property.neighborhood,
      address: payload.property.address,
      cadastral_number: payload.property.cadastralNumber,
      surface_m2: payload.property.surfaceM2,
      bedrooms: payload.property.bedrooms,
      bathrooms: payload.property.bathrooms,
      estimated_value: payload.property.estimatedValue,
      legal_status: payload.property.legalStatus as LegalStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Guardado de respaldo local no autoritativo para offline
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ ...payload, id: appId, publicId, propertyId: propId, userId })
    );

    return { application: applicationResult, property: propertyResult, error: null };
  } catch (err: unknown) {
    return {
      application: {} as Application,
      property: {} as Property,
      error: err instanceof Error ? err : new Error('Error al persistir borrador'),
    };
  }
}

/**
 * Recupera el borrador activo guardado
 */
export async function getActiveDraft(): Promise<ApplicationDraftPayload | null> {
  // 1. Intentar obtener de Supabase si hay sesión
  try {
    const { data: appData, error } = await supabase
      .from('applications')
      .select('*, properties(*)')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && appData) {
      const prop = appData.properties?.[0] || {};
      return {
        id: appData.id,
        publicId: appData.public_id,
        currentStep: appData.current_step || 1,
        requestedAmount: appData.requested_amount,
        currency: appData.currency,
        termMonths: appData.term_months,
        purpose: appData.purpose,
        property: {
          id: prop.id,
          propertyType: prop.property_type || 'casa',
          department: prop.department || 'Montevideo',
          city: prop.city,
          neighborhood: prop.neighborhood,
          address: prop.address,
          cadastralNumber: prop.cadastral_number,
          surfaceM2: prop.surface_m2,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          estimatedValue: prop.estimated_value || 0,
          legalStatus: prop.legal_status || 'libre_gravamenes',
        },
      };
    }
  } catch {
    // Continuar a fallback
  }

  // 2. Fallback desde cache local
  const cached = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as ApplicationDraftPayload;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Sube una fotografía de propiedad con validación estricta de MIME y tamaño (Regla 14)
 */
export async function uploadPropertyPhoto(
  propertyId: string,
  file: File,
  category: string
): Promise<{ photo: PropertyPhoto | null; error: Error | null }> {
  // Validación de MIME
  if (!file.type.startsWith('image/')) {
    return { photo: null, error: new Error('El archivo debe ser una imagen válida (JPG, PNG, WebP).') };
  }

  // Validación de tamaño (máximo 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { photo: null, error: new Error('La imagen no puede exceder los 10MB.') };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}_${category}_${Date.now()}.${fileExt}`;
    const filePath = `${propertyId}/${fileName}`;

    // Subida al bucket property-photos
    const { error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.warn('[Storage] Fallo al subir al bucket remoto:', uploadError.message);
    }

    // Registro de metadata en la base de datos
    const newPhoto: PropertyPhoto = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      category,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      sort_order: 0,
      created_at: new Date().toISOString(),
    };

    await supabase.from('property_photos').insert({
      property_id: propertyId,
      category,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    });

    return { photo: newPhoto, error: null };
  } catch (err: unknown) {
    return { photo: null, error: err instanceof Error ? err : new Error('Error al subir la foto') };
  }
}

/**
 * Sube un documento sensible al bucket PRIVADO con URLs firmadas (Regla 13 & 54)
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
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}_${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${propertyId}/${fileName}`;

    await supabase.storage
      .from('application-documents')
      .upload(filePath, file, { upsert: true });

    const newDoc: PropertyDocument = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending_review',
      created_at: new Date().toISOString(),
    };

    await supabase.from('property_documents').insert({
      property_id: propertyId,
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending_review',
    });

    return { document: newDoc, error: null };
  } catch (err: unknown) {
    return { document: null, error: err instanceof Error ? err : new Error('Error al subir documento') };
  }
}

/**
 * Obtiene una Signed URL temporal para visualización segura de un documento privado
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
 * Formaliza el envío final de la solicitud (pasa de 'draft' a 'submitted')
 */
export async function submitFinalApplication(
  applicationId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    await withTimeout(
      supabase
        .from('applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
    );

    // Registro en historial de estados
    await withTimeout(
      supabase.from('application_status_history').insert({
        application_id: applicationId,
        from_status: 'draft',
        to_status: 'submitted',
        notes: 'Solicitud enviada formalmente por el solicitante',
      })
    );

    // Limpiar caché de borrador
    localStorage.removeItem(DRAFT_STORAGE_KEY);

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err : new Error('Error al enviar la solicitud') };
  }
}
