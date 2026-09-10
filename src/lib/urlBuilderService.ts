// ==============================================================================
// HIPOTECALY: Servicio Centralizado de Construcción de URLs por Contexto (Fase 7)
// Manejo inteligente de dominios propios, subdominios y rutas demo
// ==============================================================================

/**
 * Determina si la ejecución actual se encuentra en un dominio personalizado (no hipotecaly)
 */
export function isCurrentCustomDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host !== 'localhost' &&
    host !== '127.0.0.1' &&
    host !== 'hipotecaly.vercel.app' &&
    host !== 'hipotecaly.com' &&
    host !== 'hipotecaly.app' &&
    !host.endsWith('.vercel.app')
  );
}

/**
 * Construye una URL interna adecuada para la organización según el entorno
 */
export function buildOrganizationUrl(
  path: string,
  options?: {
    slug?: string;
    isCustomDomain?: boolean;
    preview?: boolean;
  }
): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const isCustom = options?.isCustomDomain !== undefined ? options.isCustomDomain : isCurrentCustomDomain();

  let targetUrl = '';
  if (isCustom) {
    targetUrl = cleanPath;
  } else {
    const effectiveSlug = options?.slug || 'estudio-nova';
    targetUrl = `/demo/${effectiveSlug}${cleanPath === '/' ? '' : cleanPath}`;
  }

  if (options?.preview) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'preview=true';
  }

  return targetUrl;
}

/**
 * Valida de forma estricta una URL de redirección (returnUrl) para prevenir Open Redirects
 */
export function validateSafeReturnUrl(
  returnUrl: string | null | undefined,
  allowedDomains: string[] = []
): string {
  if (!returnUrl || typeof returnUrl !== 'string') {
    return '/';
  }

  const trimmed = returnUrl.trim();

  // Si es ruta relativa segura
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }

  // Si es URL absoluta, validar que su hostname pertenezca a los dominios autorizados
  try {
    const parsed = new URL(trimmed);
    const parsedHost = parsed.hostname.toLowerCase();

    const isPlatformHost =
      parsedHost === 'hipotecaly.vercel.app' ||
      parsedHost === 'hipotecaly.com' ||
      parsedHost === 'hipotecaly.app' ||
      parsedHost === 'localhost' ||
      parsedHost.endsWith('.hipotecaly.com');

    const isAllowedCustom = allowedDomains.some((d) => d.toLowerCase() === parsedHost);

    if (isPlatformHost || isAllowedCustom) {
      return trimmed;
    }
  } catch {
    // URL malformada
  }

  // Fallback seguro ante intento de phishing o dominio no autorizado
  return '/';
}
