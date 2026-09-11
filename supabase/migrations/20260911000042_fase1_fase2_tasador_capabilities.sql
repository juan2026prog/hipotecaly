-- ==============================================================================
-- MIGRACIÓN 20260911000042: Fase 1 + Fase 2 Tasador IA - Capabilities y Gobernanza
-- Extensión Incremental sin Alteración de la Arquitectura Fase 0 Certificada
-- ==============================================================================

-- 1. ADICIÓN DE COLUMNA DE CAPABILITY TÉCNICA A `property_sources`
ALTER TABLE public.property_sources
  ADD COLUMN IF NOT EXISTS capability VARCHAR(50) DEFAULT 'PUBLIC_HTML',
  ADD COLUMN IF NOT EXISTS dry_run BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false;

-- 2. ACTUALIZACIÓN DE CAPABILITIES AUDITADAS DE LAS 20 FUENTES URUGUAYAS
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'mercadolibre_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_STRUCTURED_ENDPOINT', dry_run = true, schedule_enabled = false WHERE code = 'infocasas';
UPDATE public.property_sources SET capability = 'BLOCKED', dry_run = true, schedule_enabled = false, notes = 'Cloudflare Bot Management bloquea acceso HTTP directo (HTTP 403). No se ejecuta bypass.' WHERE code = 'gallito_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'remax_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'engel_volkers_uy';
UPDATE public.property_sources SET capability = 'REQUIRES_AUTHORIZATION', dry_run = true, schedule_enabled = false WHERE code = 'sothebys_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'acs_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'kosak_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'meikle_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'caldeiro_uy';
UPDATE public.property_sources SET capability = 'NOT_SUPPORTED', dry_run = true, schedule_enabled = false WHERE code = 'pallares_bruzzone_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'bado_asociados_uy';
UPDATE public.property_sources SET capability = 'NOT_SUPPORTED', dry_run = true, schedule_enabled = false WHERE code = 'braglia_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'canepa_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'nicolas_modena_uy';
UPDATE public.property_sources SET capability = 'BLOCKED', dry_run = true, schedule_enabled = false WHERE code = 'nieto_paez_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'terramar_uy';
UPDATE public.property_sources SET capability = 'NOT_SUPPORTED', dry_run = true, schedule_enabled = false WHERE code = 'puntamar_uy';
UPDATE public.property_sources SET capability = 'PUBLIC_HTML', dry_run = true, schedule_enabled = false WHERE code = 'century21_uy';
UPDATE public.property_sources SET capability = 'NOT_SUPPORTED', dry_run = true, schedule_enabled = false WHERE code = 'varela_uy';

-- 3. ÍNDICES DE RENDIMIENTO INCREMENTALES PARA EL PIPELINE
CREATE INDEX IF NOT EXISTS idx_property_listings_source_key ON public.property_listings(source_listing_key);
CREATE INDEX IF NOT EXISTS idx_property_snapshots_listing_hash ON public.property_listing_snapshots(listing_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_property_media_sha256 ON public.property_listing_media(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_property_field_evidence_lookup ON public.property_field_evidence(property_master_id, field_name);
CREATE INDEX IF NOT EXISTS idx_property_duplicate_candidates_scores ON public.property_duplicate_candidates(match_score, decision);

-- 4. SEGURIDAD Y PERMISOS SERVER-SIDE
REVOKE ALL ON public.property_sources FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.property_sources TO service_role;
