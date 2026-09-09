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

    // 6. Canonical URL Seguro (Validación contra dominios autorizados)
    let resolvedCanonical = window.location.origin + window.location.pathname;
    if (customDomain) {
      resolvedCanonical = `https://${customDomain}`;
    }

    const rawCanonical = settings?.seoCanonicalUrl?.trim();
    if (rawCanonical) {
      try {
        const parsedUrl = new URL(rawCanonical.startsWith('http') ? rawCanonical : `https://${rawCanonical}`);
        const parsedHost = parsedUrl.hostname.toLowerCase();
        const currentHost = window.location.hostname.toLowerCase();
        const customHost = customDomain ? customDomain.toLowerCase() : '';
        
        // Dominios autorizados: hipotecaly.vercel.app, hipotecaly.com, subdominios *.hipotecaly.com, host actual o customDomain verificado
        const isAuthorizedHost =
          parsedHost === 'hipotecaly.vercel.app' ||
          parsedHost === 'hipotecaly.com' ||
          parsedHost.endsWith('.hipotecaly.com') ||
          parsedHost === currentHost ||
          (customHost && parsedHost === customHost);

        if (isAuthorizedHost) {
          resolvedCanonical = parsedUrl.toString();
        } else {
          console.warn(`[useOrganizationSeo] Canonical URL '${rawCanonical}' rechazada por no pertenecer a un dominio autorizado de la organización.`);
        }
      } catch {
        // Fallback seguro si URL es inválida
      }
    }

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', resolvedCanonical);

    // 7. Schema.org JSON-LD Estructurado (Resolución dinámica de tipos)
    const schemaTypes: string[] = ['Organization'];
    if (resolvedName.toLowerCase().includes('crédito') || resolvedName.toLowerCase().includes('finan') || orgTagline.toLowerCase().includes('finan')) {
      schemaTypes.push('FinancialService');
    }
    if (resolvedName.toLowerCase().includes('estudio') || resolvedName.toLowerCase().includes('notar') || resolvedName.toLowerCase().includes('abogad')) {
      schemaTypes.push('ProfessionalService');
    }
    if (schemaTypes.length === 1) {
      schemaTypes.push('FinancialService'); // Default coherente con plataforma hipotecaria
    }

    const schemaOrgData = {
      '@context': 'https://schema.org',
      '@type': schemaTypes.length === 1 ? schemaTypes[0] : schemaTypes,
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
