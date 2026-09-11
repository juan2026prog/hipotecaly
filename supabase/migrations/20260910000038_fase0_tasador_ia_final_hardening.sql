-- ==============================================================================
-- MIGRACIÓN 20260910000038: Fase0 Tasador IA - Hardening Final y 18 Entidades
-- Incorporación de crawler_runs, ai_usage_events, estado SOLD_OR_REMOVED_UNKNOWN,
-- corrección de nombres de fuentes y políticas RLS explícitas reales.
-- ==============================================================================

-- 1. TABLA `crawler_runs` (PREPARADA PERO SIN EJECUCIONES ACTIVAS EN FASE 0)
CREATE TABLE IF NOT EXISTS public.crawler_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.property_sources(id) ON DELETE CASCADE,
    run_type VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    listings_found INTEGER NOT NULL DEFAULT 0,
    listings_created INTEGER NOT NULL DEFAULT 0,
    listings_updated INTEGER NOT NULL DEFAULT 0,
    errors_count INTEGER NOT NULL DEFAULT 0,
    error_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA `ai_usage_events` (PREPARADA PERO SIN USO DE IA EN FASE 0)
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valuation_id UUID REFERENCES public.property_valuations(id) ON DELETE SET NULL,
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES public.property_listings(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
    execution_time_ms INTEGER,
    payload_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PERMITIR ESTADO EXPLÍCITO `SOLD_OR_REMOVED_UNKNOWN` EN `property_listings`
ALTER TABLE public.property_listings DROP CONSTRAINT IF EXISTS property_listings_status_check;
ALTER TABLE public.property_listings ADD CONSTRAINT property_listings_status_check
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'REMOVED', 'EXPIRED', 'RELISTED', 'UNKNOWN', 'SOLD_OR_REMOVED_UNKNOWN', 'POSSIBLE_SOLD', 'CONFIRMED_SOLD', 'active', 'inactive', 'sold', 'removed'));

-- 4. CORRECCIÓN DE NOMBRES DE FUENTES SIN ALTERAR CÓDIGOS NI IDs
UPDATE public.property_sources
SET name = 'Caldeyro Victorica Bienes Raíces'
WHERE code = 'caldeiro_uy';

UPDATE public.property_sources
SET name = 'Nicolás de Módena Inmobiliaria'
WHERE code = 'nicolas_modena_uy';

-- 5. RLS Y POLÍTICAS DE SEGURIDAD ESPECÍFICAS EN LAS 18 TABLAS
ALTER TABLE public.crawler_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE LECTURA AUTORIZADA
DROP POLICY IF EXISTS "Allow read access to crawler_runs" ON public.crawler_runs;
CREATE POLICY "Allow read access to crawler_runs"
  ON public.crawler_runs FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow read access to ai_usage_events" ON public.ai_usage_events;
CREATE POLICY "Allow read access to ai_usage_events"
  ON public.ai_usage_events FOR SELECT TO authenticated, anon USING (true);

-- POLÍTICAS DE ESCRITURA EXCLUSIVAS PARA SERVICE_ROLE
DROP POLICY IF EXISTS "Allow service_role full control on crawler_runs" ON public.crawler_runs;
CREATE POLICY "Allow service_role full control on crawler_runs"
  ON public.crawler_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full control on ai_usage_events" ON public.ai_usage_events;
CREATE POLICY "Allow service_role full control on ai_usage_events"
  ON public.ai_usage_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CONCEDER PERMISOS BÁSICOS
GRANT SELECT ON public.crawler_runs TO authenticated, anon;
GRANT SELECT ON public.ai_usage_events TO authenticated, anon;

GRANT ALL ON public.crawler_runs TO service_role;
GRANT ALL ON public.ai_usage_events TO service_role;
