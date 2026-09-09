// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/sitemap
// Generador Dinámico de Sitemap XML Multi-Tenant
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../server/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const currentDate = new Date().toISOString().split('T')[0];

  // 1. URLs oficiales e indexables de la plataforma HIPOTECALY
  const platformUrls = [
    { loc: 'https://hipotecaly.vercel.app/', lastmod: currentDate, changefreq: 'weekly', priority: '1.0' },
    { loc: 'https://hipotecaly.vercel.app/simulador', lastmod: currentDate, changefreq: 'weekly', priority: '0.9' },
    { loc: 'https://hipotecaly.vercel.app/saas', lastmod: currentDate, changefreq: 'weekly', priority: '0.9' },
    { loc: 'https://hipotecaly.vercel.app/saas/integracion', lastmod: currentDate, changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://hipotecaly.vercel.app/saas/plataforma-completa', lastmod: currentDate, changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://hipotecaly.vercel.app/saas/precios', lastmod: currentDate, changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://hipotecaly.vercel.app/como-funciona', lastmod: currentDate, changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://hipotecaly.vercel.app/prestamos', lastmod: currentDate, changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://hipotecaly.vercel.app/preguntas-frecuentes', lastmod: currentDate, changefreq: 'monthly', priority: '0.7' },
    { loc: 'https://hipotecaly.vercel.app/nosotros', lastmod: currentDate, changefreq: 'monthly', priority: '0.7' },
    { loc: 'https://hipotecaly.vercel.app/contacto', lastmod: currentDate, changefreq: 'monthly', priority: '0.8' },
    { loc: 'https://hipotecaly.vercel.app/terminos', lastmod: currentDate, changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://hipotecaly.vercel.app/privacidad', lastmod: currentDate, changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://hipotecaly.vercel.app/seguridad', lastmod: currentDate, changefreq: 'monthly', priority: '0.6' },
  ];

  // 2. URLs de Organizaciones con Dominios Personalizados Verificados
  const organizationUrls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [];

  try {
    const { data: domains } = await supabaseAdmin
      .from('organization_domains')
      .select('domain, updated_at')
      .eq('is_verified', true);

    if (domains && domains.length > 0) {
      for (const d of domains) {
        if (d.domain && !d.domain.includes('demo') && !d.domain.includes('localhost')) {
          organizationUrls.push({
            loc: `https://${d.domain}/`,
            lastmod: d.updated_at ? new Date(d.updated_at).toISOString().split('T')[0] : currentDate,
            changefreq: 'weekly',
            priority: '0.9',
          });
        }
      }
    }
  } catch (err) {
    console.error('[sitemap] Error consultando dominios de organizaciones:', err);
  }

  const allUrls = [...platformUrls, ...organizationUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.status(200).send(xml);
}
