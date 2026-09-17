import { useEffect } from 'react';

interface PageMetadataOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  robots?: 'index, follow' | 'noindex, nofollow';
}

/**
 * Hook para sincronizar dinámicamente el título, meta descripción y enlace canónico de cada página
 */
export function usePageMetadata({
  title,
  description = 'HIPOTECALY — Plataforma y Ecosistema de Originación de Crédito Hipotecario en Uruguay.',
  canonicalPath,
  robots = 'index, follow',
}: PageMetadataOptions) {
  useEffect(() => {
    // 1. Título
    const resolvedTitle = title ? `${title} | HIPOTECALY` : 'HIPOTECALY — Ecosistema Hipotecario Digital';
    document.title = resolvedTitle;

    // Helper para actualizar o crear meta tags
    const setMetaTag = (attributeName: string, attributeValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // 2. Meta description & OpenGraph
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', resolvedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('name', 'robots', robots);

    // 3. Canonical Link
    const fullCanonical = canonicalPath
      ? `${window.location.origin}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
      : window.location.href.split('?')[0];

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullCanonical);
  }, [title, description, canonicalPath, robots]);
}
