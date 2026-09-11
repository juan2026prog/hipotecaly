-- ==============================================================================
-- MIGRACIÓN 20260911000045: Tasador IA - Data Acquisition & Continuous Ingestion
-- Cola de Jobs Persistente, Discovery Runs, Kill Switch, Fingerprints,
-- Calidad de Datos, Elegibilidad de Comparables y RLS Deny-by-Default
-- ==============================================================================

-- 1. AMPLIACIÓN DE `property_sources` PARA CICLO CONTINUO Y GOBERNANZA
ALTER TABLE public.property_sources
  ADD COLUMN IF NOT EXISTS capability VARCHAR(50) DEFAULT 'PUBLIC_HTML',
  ADD COLUMN IF NOT EXISTS dry_run BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS discovery_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_discovery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_ingestion_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error_message TEXT,
  ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_status VARCHAR(50) DEFAULT 'REGISTERED',
  ADD COLUMN IF NOT EXISTS discovered_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS new_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modified_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unchanged_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parser_version VARCHAR(50) DEFAULT 'v2.0-deterministic';

-- 2. AMPLIACIÓN DE `property_listings` CON FINGERPRINTS Y CALIDAD DE DATOS
ALTER TABLE public.property_listings
  ADD COLUMN IF NOT EXISTS identity_fingerprint VARCHAR(128),
  ADD COLUMN IF NOT EXISTS content_fingerprint VARCHAR(128),
  ADD COLUMN IF NOT EXISTS pricing_fingerprint VARCHAR(128),
  ADD COLUMN IF NOT EXISTS data_quality_score NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS comparable_eligibility VARCHAR(30) DEFAULT 'NOT_ELIGIBLE',
  ADD COLUMN IF NOT EXISTS eligibility_reasons JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_property_listings_fingerprints ON public.property_listings(identity_fingerprint, content_fingerprint, pricing_fingerprint);
CREATE INDEX IF NOT EXISTS idx_property_listings_quality ON public.property_listings(data_quality_score, comparable_eligibility);

-- 3. TABLA DE COLA DE TRABAJO PERSISTENTE (`property_ingestion_jobs`)
CREATE TABLE IF NOT EXISTS public.property_ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.property_sources(id) ON DELETE CASCADE,
    source_code VARCHAR(50) NOT NULL,
    source_listing_id VARCHAR(255) NOT NULL,
    url TEXT,
    job_type VARCHAR(50) NOT NULL DEFAULT 'INGESTION_NEW',
    priority INTEGER NOT NULL DEFAULT 100,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    locked_by VARCHAR(100),
    payload JSONB DEFAULT '{}'::jsonb,
    error_code VARCHAR(50),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_ingestion_jobs_queue ON public.property_ingestion_jobs(status, available_at, priority DESC);
CREATE INDEX IF NOT EXISTS idx_property_ingestion_jobs_source_item ON public.property_ingestion_jobs(source_code, source_listing_id);

-- 4. TABLA DE EJECUCIONES DE DISCOVERY (`property_discovery_runs`)
CREATE TABLE IF NOT EXISTS public.property_discovery_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.property_sources(id) ON DELETE CASCADE,
    source_code VARCHAR(50) NOT NULL,
    run_type VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
    pages_inspected INTEGER NOT NULL DEFAULT 0,
    listings_found INTEGER NOT NULL DEFAULT 0,
    listings_new INTEGER NOT NULL DEFAULT 0,
    listings_modified INTEGER NOT NULL DEFAULT 0,
    listings_unchanged INTEGER NOT NULL DEFAULT 0,
    jobs_queued INTEGER NOT NULL DEFAULT 0,
    errors_count INTEGER NOT NULL DEFAULT 0,
    http_errors_count INTEGER NOT NULL DEFAULT 0,
    rate_limit_hits INTEGER NOT NULL DEFAULT 0,
    error_log JSONB DEFAULT '[]'::jsonb,
    duration_ms INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_discovery_runs_source ON public.property_discovery_runs(source_code, started_at DESC);

-- 5. TABLA DE KILL SWITCH Y CONTROL DE OPERACIÓN (`property_system_switches`)
CREATE TABLE IF NOT EXISTS public.property_system_switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    singleton_key VARCHAR(50) UNIQUE NOT NULL DEFAULT 'GLOBAL_TASADOR_SWITCH',
    global_discovery_enabled BOOLEAN NOT NULL DEFAULT true,
    global_ingestion_enabled BOOLEAN NOT NULL DEFAULT true,
    scheduler_active BOOLEAN NOT NULL DEFAULT true,
    kill_switch_active BOOLEAN NOT NULL DEFAULT false,
    kill_switch_reason TEXT,
    kill_switch_activated_at TIMESTAMPTZ,
    kill_switch_activated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    max_concurrency INTEGER NOT NULL DEFAULT 5,
    source_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed del Switch Singleton
INSERT INTO public.property_system_switches (singleton_key, global_discovery_enabled, global_ingestion_enabled, scheduler_active, kill_switch_active)
VALUES ('GLOBAL_TASADOR_SWITCH', true, true, true, false)
ON CONFLICT (singleton_key) DO NOTHING;

-- 6. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) ESTRICTA (DENY-BY-DEFAULT)
ALTER TABLE public.property_ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_system_switches ENABLE ROW LEVEL SECURITY;

-- Revocar accesos directos de tabla a PUBLIC, anon, authenticated
REVOKE ALL ON public.property_ingestion_jobs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_discovery_runs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_system_switches FROM PUBLIC, anon, authenticated;

-- Políticas exclusivas para service_role
DROP POLICY IF EXISTS "service_role_all_property_ingestion_jobs" ON public.property_ingestion_jobs;
CREATE POLICY "service_role_all_property_ingestion_jobs" ON public.property_ingestion_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_property_discovery_runs" ON public.property_discovery_runs;
CREATE POLICY "service_role_all_property_discovery_runs" ON public.property_discovery_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_property_system_switches" ON public.property_system_switches;
CREATE POLICY "service_role_all_property_system_switches" ON public.property_system_switches FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Conceder ALL exclusivamente a service_role
GRANT ALL ON public.property_ingestion_jobs TO service_role;
GRANT ALL ON public.property_discovery_runs TO service_role;
GRANT ALL ON public.property_system_switches TO service_role;

-- 7. RPCs SEGURAS `SECURITY DEFINER` EXCLUSIVAS PARA SUPER ADMIN

-- A. Resumen General de Base Inmobiliaria
CREATE OR REPLACE FUNCTION public.fn_superadmin_get_base_inmobiliaria_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_super BOOLEAN;
    v_res JSONB;
    v_total_masters BIGINT;
    v_total_listings BIGINT;
    v_active_listings BIGINT;
    v_inactive_listings BIGINT;
    v_sources_count BIGINT;
    v_sources_healthy BIGINT;
    v_sources_paused BIGINT;
    v_sources_blocked BIGINT;
    v_new_last_24h BIGINT;
    v_mod_last_24h BIGINT;
    v_price_changes_count BIGINT;
    v_avg_quality NUMERIC(5, 2);
    v_eligible_count BIGINT;
    v_eligible_pct NUMERIC(5, 2);
    v_duplicates_count BIGINT;
    v_jobs_queued BIGINT;
    v_jobs_processing BIGINT;
    v_jobs_failed BIGINT;
    v_jobs_retry BIGINT;
    v_switches RECORD;
BEGIN
    IF auth.role() = 'authenticated' THEN
        SELECT public.is_super_admin() INTO v_is_super;
        IF NOT COALESCE(v_is_super, false) THEN
            RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Super Admin.';
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_total_masters FROM public.property_master;
    SELECT COUNT(*) INTO v_total_listings FROM public.property_listings;
    SELECT COUNT(*) INTO v_active_listings FROM public.property_listings WHERE status IN ('ACTIVE', 'active');
    SELECT COUNT(*) INTO v_inactive_listings FROM public.property_listings WHERE status NOT IN ('ACTIVE', 'active');

    SELECT COUNT(*) INTO v_sources_count FROM public.property_sources;
    SELECT COUNT(*) INTO v_sources_healthy FROM public.property_sources WHERE health_status = 'HEALTHY';
    SELECT COUNT(*) INTO v_sources_paused FROM public.property_sources WHERE health_status = 'PAUSED' OR ingestion_enabled = false;
    SELECT COUNT(*) INTO v_sources_blocked FROM public.property_sources WHERE health_status IN ('BLOCKED', 'TOS_RESTRICTED', 'NOT_SUPPORTED');

    SELECT COUNT(*) INTO v_new_last_24h FROM public.property_listings WHERE first_seen_at >= NOW() - INTERVAL '24 hours';
    SELECT COUNT(*) INTO v_mod_last_24h FROM public.property_listings WHERE updated_at >= NOW() - INTERVAL '24 hours' AND updated_at > first_seen_at;
    SELECT COUNT(*) INTO v_price_changes_count FROM public.property_price_history WHERE event_type = 'PRICE_CHANGED';

    SELECT COALESCE(ROUND(AVG(data_quality_score), 2), 0.00) INTO v_avg_quality FROM public.property_listings;
    SELECT COUNT(*) INTO v_eligible_count FROM public.property_listings WHERE comparable_eligibility = 'ELIGIBLE';
    IF v_total_listings > 0 THEN
        v_eligible_pct := ROUND((v_eligible_count::numeric / v_total_listings::numeric) * 100.0, 2);
    ELSE
        v_eligible_pct := 0.00;
    END IF;

    SELECT COUNT(*) INTO v_duplicates_count FROM public.property_duplicate_candidates WHERE decision IN ('PENDING', 'MATCH');

    SELECT COUNT(*) INTO v_jobs_queued FROM public.property_ingestion_jobs WHERE status = 'QUEUED';
    SELECT COUNT(*) INTO v_jobs_processing FROM public.property_ingestion_jobs WHERE status = 'PROCESSING';
    SELECT COUNT(*) INTO v_jobs_failed FROM public.property_ingestion_jobs WHERE status = 'FAILED';
    SELECT COUNT(*) INTO v_jobs_retry FROM public.property_ingestion_jobs WHERE status = 'RETRY';

    SELECT * INTO v_switches FROM public.property_system_switches LIMIT 1;

    v_res := jsonb_build_object(
        'base', jsonb_build_object(
            'totalMasters', v_total_masters,
            'totalListings', v_total_listings,
            'activeListings', v_active_listings,
            'inactiveListings', v_inactive_listings,
            'newLast24h', v_new_last_24h,
            'modifiedLast24h', v_mod_last_24h,
            'priceChanges', v_price_changes_count
        ),
        'sources', jsonb_build_object(
            'total', v_sources_count,
            'healthy', v_sources_healthy,
            'paused', v_sources_paused,
            'blocked', v_sources_blocked
        ),
        'quality', jsonb_build_object(
            'avgQualityScore', v_avg_quality,
            'eligibleComparablesPct', v_eligible_pct,
            'eligibleCount', v_eligible_count,
            'potentialDuplicates', v_duplicates_count
        ),
        'pipeline', jsonb_build_object(
            'queued', v_jobs_queued,
            'processing', v_jobs_processing,
            'failed', v_jobs_failed,
            'retry', v_jobs_retry
        ),
        'scheduler', jsonb_build_object(
            'active', COALESCE(v_switches.scheduler_active, true),
            'killSwitchActive', COALESCE(v_switches.kill_switch_active, false),
            'killSwitchReason', v_switches.kill_switch_reason,
            'globalDiscovery', COALESCE(v_switches.global_discovery_enabled, true),
            'globalIngestion', COALESCE(v_switches.global_ingestion_enabled, true)
        )
    );

    RETURN v_res;
END;
$$;

-- B. Listado de 20 Fuentes para Super Admin
CREATE OR REPLACE FUNCTION public.fn_superadmin_get_property_sources()
RETURNS SETOF public.property_sources
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_super BOOLEAN;
BEGIN
    IF auth.role() = 'authenticated' THEN
        SELECT public.is_super_admin() INTO v_is_super;
        IF NOT COALESCE(v_is_super, false) THEN
            RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Super Admin.';
        END IF;
    END IF;

    RETURN QUERY
    SELECT * FROM public.property_sources
    ORDER BY priority ASC, code ASC;
END;
$$;

-- C. Inspector de Base Inmobiliaria (Búsqueda, Filtros y Paginación)
CREATE OR REPLACE FUNCTION public.fn_superadmin_list_properties_inspector(
    p_search TEXT DEFAULT NULL,
    p_source_code TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_property_type TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_min_quality NUMERIC DEFAULT NULL,
    p_comparable_eligibility TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    master_id UUID,
    source_id UUID,
    source_code VARCHAR,
    source_name VARCHAR,
    source_listing_id VARCHAR,
    original_url TEXT,
    title TEXT,
    operation_type VARCHAR,
    property_type VARCHAR,
    status VARCHAR,
    department TEXT,
    city TEXT,
    neighborhood TEXT,
    price_usd NUMERIC,
    price_amount NUMERIC,
    currency VARCHAR,
    built_area_m2 NUMERIC,
    total_area_m2 NUMERIC,
    bedrooms INTEGER,
    bathrooms INTEGER,
    data_quality_score NUMERIC,
    comparable_eligibility VARCHAR,
    first_seen_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_super BOOLEAN;
BEGIN
    IF auth.role() = 'authenticated' THEN
        SELECT public.is_super_admin() INTO v_is_super;
        IF NOT COALESCE(v_is_super, false) THEN
            RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Super Admin.';
        END IF;
    END IF;

    RETURN QUERY
    SELECT
        l.id,
        l.master_id,
        l.source_id,
        s.code AS source_code,
        s.name AS source_name,
        l.source_listing_id,
        l.original_url,
        COALESCE(l.title_normalized, l.title, l.title_raw) AS title,
        l.operation_type,
        COALESCE(m.property_type, 'apartamento')::VARCHAR AS property_type,
        l.status,
        COALESCE(l.department_normalized, l.department_raw) AS department,
        COALESCE(l.city_normalized, l.city_raw) AS city,
        COALESCE(l.neighborhood_normalized, l.neighborhood_raw) AS neighborhood,
        COALESCE(l.price_usd_normalized, l.price_usd, l.price_amount) AS price_usd,
        l.price_amount,
        l.currency,
        COALESCE(l.built_area_m2, l.covered_area_m2) AS built_area_m2,
        COALESCE(l.total_area_m2, l.built_area_m2) AS total_area_m2,
        l.bedrooms,
        l.bathrooms,
        l.data_quality_score,
        l.comparable_eligibility,
        l.first_seen_at,
        l.last_seen_at,
        l.updated_at
    FROM public.property_listings l
    JOIN public.property_sources s ON l.source_id = s.id
    LEFT JOIN public.property_master m ON l.master_id = m.id
    WHERE
        (p_search IS NULL OR l.title ILIKE '%' || p_search || '%' OR l.address_raw ILIKE '%' || p_search || '%' OR l.source_listing_id ILIKE '%' || p_search || '%')
        AND (p_source_code IS NULL OR s.code = p_source_code)
        AND (p_status IS NULL OR l.status = p_status)
        AND (p_property_type IS NULL OR m.property_type ILIKE p_property_type)
        AND (p_department IS NULL OR l.department_normalized ILIKE p_department OR l.department_raw ILIKE p_department)
        AND (p_min_quality IS NULL OR l.data_quality_score >= p_min_quality)
        AND (p_comparable_eligibility IS NULL OR l.comparable_eligibility = p_comparable_eligibility)
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- D. Toggle de Kill Switch & Switches de Fuentes
CREATE OR REPLACE FUNCTION public.fn_superadmin_toggle_source_switch(
    p_source_code TEXT,
    p_field TEXT,
    p_value BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_super BOOLEAN;
BEGIN
    IF auth.role() = 'authenticated' THEN
        SELECT public.is_super_admin() INTO v_is_super;
        IF NOT COALESCE(v_is_super, false) THEN
            RAISE EXCEPTION 'Acceso denegado: Se requiere rol de Super Admin.';
        END IF;
    END IF;

    IF p_source_code = 'GLOBAL' THEN
        IF p_field = 'kill_switch_active' THEN
            UPDATE public.property_system_switches
            SET kill_switch_active = p_value,
                kill_switch_activated_at = CASE WHEN p_value THEN NOW() ELSE NULL END,
                kill_switch_activated_by = auth.uid(),
                updated_at = NOW();
        ELSIF p_field = 'global_discovery_enabled' THEN
            UPDATE public.property_system_switches
            SET global_discovery_enabled = p_value, updated_at = NOW();
        ELSIF p_field = 'global_ingestion_enabled' THEN
            UPDATE public.property_system_switches
            SET global_ingestion_enabled = p_value, updated_at = NOW();
        ELSIF p_field = 'scheduler_active' THEN
            UPDATE public.property_system_switches
            SET scheduler_active = p_value, updated_at = NOW();
        END IF;
    ELSE
        IF p_field = 'discovery_enabled' THEN
            UPDATE public.property_sources
            SET discovery_enabled = p_value, updated_at = NOW()
            WHERE code = p_source_code;
        ELSIF p_field = 'ingestion_enabled' THEN
            UPDATE public.property_sources
            SET ingestion_enabled = p_value, updated_at = NOW()
            WHERE code = p_source_code;
        ELSIF p_field = 'enabled' THEN
            UPDATE public.property_sources
            SET enabled = p_value, is_active = p_value, updated_at = NOW()
            WHERE code = p_source_code;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'source', p_source_code, 'field', p_field, 'value', p_value);
END;
$$;

-- 8. REVOCACIÓN EXPLÍCITA DE EXECUTE A ANON Y AUTHENTICATED
REVOKE EXECUTE ON FUNCTION public.fn_superadmin_get_base_inmobiliaria_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_superadmin_get_property_sources() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_superadmin_list_properties_inspector(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_superadmin_toggle_source_switch(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fn_superadmin_get_base_inmobiliaria_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_superadmin_get_property_sources() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_superadmin_list_properties_inspector(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_superadmin_toggle_source_switch(TEXT, TEXT, BOOLEAN) TO authenticated, service_role;
