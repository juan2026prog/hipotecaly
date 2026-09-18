// ==============================================================================
// HIPOTECALY: Servicio de Branding, Logos y Favicon por Organización
// Gestión de subidas, versionado, validación MIME, almacenamiento y eliminación
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export const ALLOWED_LOGO_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_FAVICON_MIMES = [
  'image/png',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/svg+xml',
  'image/jpeg',
  'image/webp',
];

export const MAX_BRANDING_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface BrandingAssetUploadResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Valida formato y peso del archivo antes de la subida
 */
export function validateBrandingFile(
  file: File,
  type: 'logo' | 'favicon'
): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No se seleccionó ningún archivo.' };
  }

  // Validación de peso
  if (file.size > MAX_BRANDING_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `El archivo supera el tamaño máximo permitido de 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // Validación de MIME
  const allowed = type === 'logo' ? ALLOWED_LOGO_MIMES : ALLOWED_FAVICON_MIMES;
  const fileType = file.type.toLowerCase();

  // Caso especial extensiones .ico si el navegador no envía MIME correcto
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isIcoExt = extension === 'ico';

  if (!allowed.includes(fileType) && !(type === 'favicon' && isIcoExt)) {
    const formatNames = type === 'logo' ? 'PNG, JPG, WEBP o SVG' : 'PNG, ICO o SVG';
    return {
      isValid: false,
      error: `Formato de archivo no admitido (${file.type || extension}). Se admite: ${formatNames}.`,
    };
  }

  return { isValid: true };
}

/**
 * Sube un Logo o Favicon a Supabase Storage en el bucket organization-branding
 * Estructura: {organization_id}/{type}/{type}-{timestamp}-{uuid}.{ext}
 */
export async function uploadOrganizationBrandingAsset(
  organizationId: string,
  file: File,
  type: 'logo' | 'favicon',
  oldStoragePath?: string
): Promise<BrandingAssetUploadResult> {
  if (!organizationId) {
    return { success: false, error: 'Identificador de organización requerido.' };
  }

  const validation = validateBrandingFile(file, type);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || (type === 'logo' ? 'png' : 'ico');
  const timestamp = Date.now();
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().substring(0, 8) : Math.random().toString(36).substring(2, 8);
  const fileName = `${type}-${timestamp}-${uniqueId}.${fileExt}`;
  const filePath = `${organizationId}/${type}/${fileName}`;

  // Si Supabase Storage está activo y configurado
  if (isSupabaseConfigured) {
    try {
      // Intentar primero con bucket 'organization-branding', fallback a 'organization-assets'
      const targetBucket = 'organization-branding';
      
      const { error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 año cacheable por inmutabilidad de nombre versionado
          upsert: false,
        });

      if (uploadError) {
        // Fallback a organization-assets si organization-branding no estuviera creado en el backend remoto aún
        console.warn(`[BrandingService] Fallback subiendo a organization-assets por:`, uploadError.message);
        const { error: fallbackError } = await supabase.storage
          .from('organization-assets')
          .upload(filePath, file, {
            cacheControl: '31536000',
            upsert: false,
          });

        if (fallbackError) {
          console.error('[BrandingService] Error en fallback de subida:', fallbackError);
          // Si ambos fallan (ej. sin conexión a storage), usar dataUrl temporal local
          const dataUrl = await fileToDataUrl(file);
          return {
            success: true,
            url: dataUrl,
            storagePath: filePath,
          };
        }

        const { data: publicData } = supabase.storage
          .from('organization-assets')
          .getPublicUrl(filePath);

        // Si había archivo anterior, intentar borrarlo
        if (oldStoragePath) {
          deleteStorageObjectSafe('organization-assets', oldStoragePath);
        }

        return {
          success: true,
          url: publicData.publicUrl,
          storagePath: filePath,
        };
      }

      const { data: publicData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      // Si había archivo anterior, intentar borrarlo para no acumular basura
      if (oldStoragePath) {
        deleteStorageObjectSafe(targetBucket, oldStoragePath);
      }

      return {
        success: true,
        url: publicData.publicUrl,
        storagePath: filePath,
      };
    } catch (err: any) {
      console.error('[BrandingService] Error inesperado en upload:', err);
      const dataUrl = await fileToDataUrl(file);
      return {
        success: true,
        url: dataUrl,
        storagePath: filePath,
      };
    }
  }

  // Modo offline / sin backend
  const dataUrl = await fileToDataUrl(file);
  return {
    success: true,
    url: dataUrl,
    storagePath: filePath,
  };
}

/**
 * Elimina un asset de branding del bucket
 */
export async function deleteOrganizationBrandingAsset(
  organizationId: string,
  storagePath?: string
): Promise<{ success: boolean; error?: string }> {
  if (!storagePath) {
    return { success: true };
  }

  // Verificación multi-tenant: el path DEBE pertenecer a la organización
  if (!storagePath.startsWith(`${organizationId}/`)) {
    return { success: false, error: 'Acceso no autorizado al archivo.' };
  }

  if (isSupabaseConfigured) {
    try {
      await Promise.allSettled([
        supabase.storage.from('organization-branding').remove([storagePath]),
        supabase.storage.from('organization-assets').remove([storagePath]),
      ]);
    } catch {
      // Ignorar errores de borrado
    }
  }

  return { success: true };
}

/**
 * Borrado seguro en segundo plano
 */
async function deleteStorageObjectSafe(bucket: string, path: string) {
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // Ignorar
  }
}

/**
 * Helper para convertir archivo a Data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
