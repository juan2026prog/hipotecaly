import { useEffect } from 'react';
import { OrganizationHomeSettings } from '../lib/organizationHomeService';

interface UseOrganizationSeoParams {
  settings?: Partial<OrganizationHomeSettings>;
  orgName?: string;
  orgTagline?: string;
  canonicalBaseUrl?: string;
}

/**
 * Hook para inyectar y actualizar dinámicamente metadatos SEO y OpenGraph en el <head>
 */
export function useOrganizationSeo({
  settings,
  orgName = 'Estudio Nova',
  orgTagline = 'Financiación & inversión',
  canonicalBaseUrl,
}: UseOrganizationSeoParams) {
  useEffect(() => {
    // 1. Título de página
    const resolvedTitle =
      settings?.seoTitle?.trim() ||
      `${orgName} — ${orgTagline}`;
    document.title = resolvedTitle;

    // Helper para actualizar o crear tags <meta>
    const setMetaTag = (attributeName: string, attributeValue: string, contentValue?: string) => {
      if (!contentValue) return;
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // 2. Meta description
    const resolvedDescription =
      settings?.seoDescription?.trim() ||
      settings?.heroDescription?.trim() ||
      'Estructuración de operaciones de crédito con respaldo en activos inmobiliarios en Uruguay.';
    setMetaTag('name', 'description', resolvedDescription);

    // 3. Keywords
    if (settings?.seoKeywords?.trim()) {
      setMetaTag('name', 'keywords', settings.seoKeywords.trim());
    }

    // 4. OpenGraph Tags
    setMetaTag('property', 'og:title', resolvedTitle);
    setMetaTag('property', 'og:description', resolvedDescription);
    setMetaTag('property', 'og:type', 'website');

    if (settings?.seoOgImageUrl?.trim()) {
      setMetaTag('property', 'og:image', settings.seoOgImageUrl.trim());
    }

    // 5. Canonical URL
    const resolvedCanonical =
      settings?.seoCanonicalUrl?.trim() ||
      canonicalBaseUrl ||
      window.location.origin + window.location.pathname;

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', resolvedCanonical);
  }, [settings, orgName, orgTagline, canonicalBaseUrl]);
}
