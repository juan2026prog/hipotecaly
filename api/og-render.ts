// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/og-render
// Pre-renderizado Server-Side de Metadatos OpenGraph, Twitter Cards, Canonical,
// Google Site Verification y Schema.org JSON-LD para scrapers y crawlers (WhatsApp, Facebook, Twitter, Googlebot, etc.)
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../server/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const reqUrl = req.url || '/';
  const pathParam = (req.query.path as string) || reqUrl;
  const isPreview = reqUrl.includes('preview=true') || req.query.preview === 'true';
  const rawHost = req.headers.host || 'hipotecaly.vercel.app';
  const host = rawHost.split(':')[0].toLowerCase();
  const protocol = req.headers['x-forwarded-proto'] || 'https';

  // 1. Detección de Organización / Tenant por Host Verificado o por ruta/slug
  let slug = 'estudio-nova';
  let orgId: string | null = null;
  let verifiedCustomDomain: string | null = null;
  const cleanPath = pathParam.split('?')[0];

  const isHipotecalyPlatformHost =
    host === 'hipotecaly.vercel.app' ||
    host === 'hipotecaly.com' ||
    host.endsWith('.hipotecaly.app') ||
    host === 'localhost';

  if (!isHipotecalyPlatformHost) {
    // Buscar si el host corresponde a un dominio personalizado verificado
    try {
      const { data: domainRecord } = await supabaseAdmin
        .from('organization_domains')
        .select('organization_id, domain')
        .eq('domain', host)
        .eq('is_verified', true)
        .maybeSingle();

      if (domainRecord) {
        orgId = domainRecord.organization_id;
        verifiedCustomDomain = domainRecord.domain;
      }
    } catch (err) {
      console.error('[og-render] Error buscando dominio por host:', err);
    }
  }

  if (!orgId) {
    const demoMatch = cleanPath.match(/^\/demo\/([^/]+)/);
    const orgMatch = cleanPath.match(/^\/org\/([^/]+)/);

    if (demoMatch) {
      slug = demoMatch[1];
    } else if (orgMatch) {
      slug = orgMatch[1];
    }
  }

  const isDemo = !verifiedCustomDomain && (cleanPath.startsWith('/demo') || slug === 'estudio-nova');

  // 2. Cargar datos publicados desde Supabase (Server-side con Service Role / Admin)
  let orgName = 'Estudio Nova';
  let orgTagline = 'Financiación & inversión';
  let supportPhone = '+598 2916 4455';
  let supportEmail = 'contacto@estudionova.uy';
  let address = 'Montevideo, Uruguay';
  let businessHours = 'Lun a Vie 09:00 – 18:00 hs';
  let logoUrl = 'https://hipotecaly.vercel.app/favicon.svg';

  let heroEyebrow = 'FINANCIACIÓN CON GARANTÍA HIPOTECARIA';
  let heroTitle = 'Préstamos hipotecarios ágiles con garantía inmobiliaria en Uruguay';
  let heroDescription = 'Estructuración de operaciones de crédito con respaldo en activos inmobiliarios en Uruguay.';
  let heroBgImage = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80';

  let seoTitle = `${orgName} — ${orgTagline}`;
  let seoDescription = heroDescription;
  let seoKeywords = 'creditos hipotecarios uruguay, prestamos con garantia inmobiliaria, estudio nova';
  let seoOgImage = heroBgImage;
  let googleSiteVerification: string | null = null;

  try {
    // Buscar organización por orgId o slug
    if (!orgId) {
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', slug)
        .maybeSingle();

      orgId = orgData?.id || 'd0000000-0000-0000-0000-000000000001';
      if (orgData?.name) {
        orgName = orgData.name;
      }
    } else {
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug')
        .eq('id', orgId)
        .maybeSingle();

      if (orgData?.name) {
        orgName = orgData.name;
        slug = orgData.slug;
      }
    }

    // Buscar branding
    const { data: brandingData } = await supabaseAdmin
      .from('organization_branding')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (brandingData) {
      orgName = brandingData.public_name || orgName;
      orgTagline = brandingData.tag_line || orgTagline;
      supportPhone = brandingData.support_phone || supportPhone;
      supportEmail = brandingData.support_email || supportEmail;
      address = brandingData.address || address;
      businessHours = brandingData.business_hours || businessHours;
      logoUrl = brandingData.logo_url || logoUrl;
    }

    // Si aún no tenemos dominio verificado, buscarlo
    if (!verifiedCustomDomain) {
      const { data: domainData } = await supabaseAdmin
        .from('organization_domains')
        .select('domain')
        .eq('organization_id', orgId)
        .eq('is_verified', true)
        .maybeSingle();

      if (domainData?.domain) {
        verifiedCustomDomain = domainData.domain;
      }
    }

    // Buscar configuración de Home publicada (SIEMPRE PUBLISHED, NUNCA DRAFT PARA CRAWLERS)
    const { data: homeData } = await supabaseAdmin
      .from('organization_home_settings')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (homeData) {
      const pubSnap = homeData.published_snapshot;
      if (pubSnap && typeof pubSnap === 'object') {
        const h = pubSnap.home || pubSnap;
        const b = pubSnap.branding || {};
        const s = pubSnap.seo || {};

        orgName = b.publicName || orgName;
        orgTagline = b.tagline || orgTagline;
        supportPhone = b.supportPhone || supportPhone;
        supportEmail = b.supportEmail || supportEmail;
        address = b.address || address;

        heroEyebrow = h.heroEyebrow || heroEyebrow;
        heroTitle = h.heroH1Title || heroTitle;
        heroDescription = h.heroDescription || heroDescription;
        heroBgImage = h.heroBackgroundImageUrl || heroBgImage;

        seoTitle = s.seoTitle || h.seoTitle || `${orgName} — ${orgTagline}`;
        seoDescription = s.seoDescription || h.seoDescription || heroDescription;
        seoKeywords = s.seoKeywords || h.seoKeywords || seoKeywords;
        seoOgImage = s.seoOgImageUrl || h.seoOgImageUrl || heroBgImage;
        googleSiteVerification = s.googleSiteVerification || h.googleSiteVerification || null;
      } else {
        heroEyebrow = homeData.hero_eyebrow || heroEyebrow;
        heroTitle = homeData.hero_h1_title || heroTitle;
        heroDescription = homeData.hero_description || heroDescription;
        heroBgImage = homeData.hero_background_image_url || heroBgImage;

        seoTitle = homeData.seo_title || `${orgName} — ${orgTagline}`;
        seoDescription = homeData.seo_description || heroDescription;
        seoKeywords = homeData.seo_keywords || seoKeywords;
        seoOgImage = homeData.seo_og_image_url || heroBgImage;
        googleSiteVerification = homeData.google_site_verification || null;
      }
    }
  } catch (err) {
    console.error('[og-render] Error consultando Supabase:', err);
  }

  // 3. Resolución segura de URL Canónica
  let canonicalUrl = `${protocol}://${host}${cleanPath}`;
  if (verifiedCustomDomain) {
    canonicalUrl = `https://${verifiedCustomDomain}`;
  } else if (isDemo) {
    canonicalUrl = `https://hipotecaly.vercel.app/demo/${slug}`;
  }

  // 4. Jerarquía de Indexación y Headers de Robots
  const isNoIndex = isPreview || isDemo;
  const robotsContent = isNoIndex ? 'noindex, nofollow' : 'index, follow';

  if (isNoIndex) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

  // 5. Schema.org Types Dinámicos
  const schemaTypes = ['Organization'];
  if (orgName.toLowerCase().includes('crédito') || orgName.toLowerCase().includes('finan') || orgTagline.toLowerCase().includes('finan')) {
    schemaTypes.push('FinancialService');
  }
  if (orgName.toLowerCase().includes('estudio') || orgName.toLowerCase().includes('notar') || orgName.toLowerCase().includes('abogad')) {
    schemaTypes.push('ProfessionalService');
  }
  if (schemaTypes.length === 1) {
    schemaTypes.push('FinancialService');
  }

  const schemaOrgJsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaTypes.length === 1 ? schemaTypes[0] : schemaTypes,
    name: orgName,
    description: seoDescription,
    url: canonicalUrl,
    logo: logoUrl,
    telephone: supportPhone,
    email: supportEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: 'Montevideo',
      addressCountry: 'UY',
    },
    openingHours: businessHours,
  };

  // 6. Generación del HTML Server-Side Inicial para Crawlers
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primarios -->
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDescription)}" />
  <meta name="keywords" content="${escapeHtml(seoKeywords)}" />
  <meta name="robots" content="${robotsContent}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  ${googleSiteVerification ? `<meta name="google-site-verification" content="${escapeHtml(googleSiteVerification)}" />` : ''}

  <!-- OpenGraph (WhatsApp, Facebook, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(orgName)}" />
  <meta property="og:title" content="${escapeHtml(seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(seoDescription)}" />
  <meta property="og:image" content="${escapeHtml(seoOgImage)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(seoTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(seoDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(seoOgImage)}" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
${JSON.stringify(schemaOrgJsonLd, null, 2)}
  </script>
</head>
<body style="font-family: system-ui, sans-serif; background-color: #0d1e33; color: #ffffff; padding: 2rem; margin: 0;">
  <main style="max-width: 800px; margin: 0 auto; text-align: left;">
    <h1 style="font-size: 2rem; color: #f4b43b;">${escapeHtml(heroTitle)}</h1>
    <p style="font-size: 1.1rem; color: #cbd5e1; line-height: 1.6;">${escapeHtml(heroDescription)}</p>
    <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
      <p style="margin: 0; font-size: 0.9rem;"><strong>Organización:</strong> ${escapeHtml(orgName)}</p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;"><strong>Contacto:</strong> ${escapeHtml(supportPhone)} · ${escapeHtml(supportEmail)}</p>
    </div>
  </main>
</body>
</html>`;

  return res.status(200).send(html);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
