import { useEffect } from 'react';
import { OrganizationHomeSettings, CompositeBrandingData } from '../lib/organizationHomeService';

interface UseOrganizationSeoParams {
  settings?: Partial<OrganizationHomeSettings>;
  branding?: Partial<CompositeBrandingData>;
  orgName?: string;
  orgTagline?: string;
  isPreview?: boolean;
  isDemo?: boolean;
  platformAllowsIndex?: boolean;
  customDomain?: string;
}

/**
 * Hook para inyectar y actualizar dinámicamente metadatos SEO, OpenGraph, Robots y Schema.org
 */
export function useOrganizationSeo({
  settings,
  branding,
  orgName = 'Estudio Nova',
  orgTagline = 'Financiación & inversión',
  isPreview = false,
  isDemo = true,
  platformAllowsIndex = true,
  customDomain,
}: UseOrganizationSeoParams) {
  useEffect(() => {
    const resolvedName = branding?.publicName || orgName;
    const resolvedTagline = branding?.tagline || orgTagline;

    // 1. Título de página
    const resolvedTitle =
      settings?.seoTitle?.trim() ||
      `${resolvedName} — ${resolvedTagline}`;
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
      branding?.footerDescription?.trim() ||
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
    setMetaTag('property', 'og:site_name', resolvedName);

    const ogImage = settings?.seoOgImageUrl?.trim() || settings?.heroBackgroundImageUrl?.trim();
    if (ogImage) {
      setMetaTag('property', 'og:image', ogImage);
    }

    // 5. Jerarquía de Indexación (Robots Meta)
    // REGLA: Preview siempre NOINDEX. Demo siempre NOINDEX. Producción según platform & org switch.
    let effectiveRobots = 'noindex, nofollow';
    if (!isPreview && !isDemo && platformAllowsIndex && settings?.robotsIndex !== false) {
      effectiveRobots = 'index, follow';
    }
    setMetaTag('name', 'robots', effectiveRobots);

    // 6. Canonical URL
    const resolvedCanonical =
      settings?.seoCanonicalUrl?.trim() ||
      (customDomain ? `https://${customDomain}` : window.location.origin + window.location.pathname);

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', resolvedCanonical);

    // 7. Schema.org JSON-LD Estructurado
    const schemaOrgData = {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'FinancialService'],
      name: resolvedName,
      description: resolvedDescription,
      url: resolvedCanonical,
      logo: branding?.logoUrl || undefined,
      telephone: branding?.supportPhone || undefined,
      email: branding?.supportEmail || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: branding?.address || 'Montevideo, Uruguay',
        addressLocality: 'Montevideo',
        addressCountry: 'UY',
      },
      openingHours: branding?.businessHours || 'Mo-Fr 09:00-18:00',
    };

    let schemaScript = document.getElementById('schema-org-jsonld') as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'schema-org-jsonld';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schemaOrgData, null, 2);
  }, [settings, branding, orgName, orgTagline, isPreview, isDemo, platformAllowsIndex, customDomain]);
}
