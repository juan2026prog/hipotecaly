// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/robots
// Generador Dinámico de Robots.txt Multi-Tenant y Host-Aware
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../server/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawHost = req.headers.host || 'hipotecaly.vercel.app';
  const host = rawHost.split(':')[0].toLowerCase();
  const protocol = req.headers['x-forwarded-proto'] || 'https';

  const isHipotecalyPlatformHost =
    host === 'hipotecaly.vercel.app' ||
    host === 'hipotecaly.com' ||
    host.endsWith('.hipotecaly.app') ||
    host === 'localhost';

  let customDomainRecord: { organization_id: string; domain: string } | null = null;

  if (!isHipotecalyPlatformHost) {
    try {
      const { data } = await supabaseAdmin
        .from('organization_domains')
        .select('organization_id, domain')
        .eq('domain', host)
        .eq('is_verified', true)
        .maybeSingle();

      if (data) {
        customDomainRecord = data;
      }
    } catch (err) {
      console.error('[robots] Error buscando dominio:', err);
    }
  }

  let robotsTxt = '';

  if (customDomainRecord) {
    // Robots.txt para Dominio Personalizado de Organización
    robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin/*
Disallow: /api/
Disallow: /api/*

Sitemap: https://${host}/sitemap.xml
`;
  } else {
    // Robots.txt para Plataforma HIPOTECALY
    robotsTxt = `User-agent: *
Allow: /
Allow: /como-funciona
Allow: /prestamos
Allow: /simulador
Allow: /preguntas-frecuentes
Allow: /nosotros
Allow: /saas
Allow: /saas/*
Allow: /contacto
Allow: /terminos
Allow: /privacidad
Allow: /seguridad

# Rutas privadas no indexables
Disallow: /app/
Disallow: /app/*
Disallow: /admin/
Disallow: /admin/*
Disallow: /mi-cuenta/
Disallow: /mi-cuenta/*
Disallow: /ingresar
Disallow: /registro
Disallow: /recuperar-password
Disallow: /solicitar
Disallow: /solicitar/*
Disallow: /storage/
Disallow: /storage/*
Disallow: /api/
Disallow: /api/*
Disallow: /lender/
Disallow: /lender/*
Disallow: /platform-admin/
Disallow: /platform-admin/*
Disallow: /demo/
Disallow: /demo/*
Disallow: /org/
Disallow: /org/*

Sitemap: https://${host}/sitemap.xml
`;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.status(200).send(robotsTxt);
}
