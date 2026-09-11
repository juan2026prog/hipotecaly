-- ==============================================================================
-- MIGRATION 48: GOBERNANZA Y CLASIFICACIÓN OPERATIVA DE FUENTES TASADOR IA
-- Define formalmente los 3 estados: OPERATIVA, READY_FOR_ADAPTER, PAUSED_WAF_PROTECTED
-- Reconciliación estricta 1 + 11 + 8 = 20 fuentes canónicas
-- ==============================================================================

-- 1. Agregar columna operational_status si no existe
ALTER TABLE public.property_sources 
ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50) DEFAULT 'READY_FOR_ADAPTER';

-- 2. Actualizar estado operativo de la fuente en producción (1 OPERATIVA)
UPDATE public.property_sources 
SET operational_status = 'OPERATIVA',
    health_status = 'HEALTHY',
    notes = 'Fuente principal activa con enriquecimiento GPS e ingesta continua.'
WHERE code = 'infocasas';

-- 3. Actualizar fuentes protegidas por WAF o fuera de servicio (8 PAUSED_WAF_PROTECTED)
UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'PAUSED_WAF_PROTECTED',
    notes = 'Protegido por Cloudflare Bot Management / Datadome perimetral. No se realiza bypass ilícito. Pausado preventivamente.'
WHERE code = 'mercadolibre_uy';

UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'BLOCKED',
    notes = 'Cloudflare Bot Management bloquea conexiones automatizadas directas (HTTP 403). No se realiza bypass.'
WHERE code = 'gallito_uy';

UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'TOS_RESTRICTED',
    notes = 'Requiere autorización formal o API partner debido a políticas de servicio perimetrales.'
WHERE code = 'sothebys_uy';

UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'BLOCKED',
    notes = 'Acceso bloqueado por el servidor web origen (HTTP 403).'
WHERE code = 'nieto_paez_uy';

UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'MANUAL_ONLY',
    notes = 'Dominio o servidor no accesible en internet pública.'
WHERE code = 'braglia_uy';

UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'MANUAL_ONLY',
    notes = 'Servidor no responde sobre TLS público estándar.'
WHERE code = 'pallares_bruzzone_uy';

UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'MANUAL_ONLY',
    notes = 'Dominio inestable o no responde de manera consistente.'
WHERE code = 'puntamar_uy';

UPDATE public.property_sources 
SET operational_status = 'PAUSED_WAF_PROTECTED',
    health_status = 'MANUAL_ONLY',
    notes = 'Servidor web no accesible públicamente.'
WHERE code = 'varela_uy';

-- 4. Actualizar fuentes candidatas para desarrollo futuro de adapters (11 READY_FOR_ADAPTER)
UPDATE public.property_sources 
SET operational_status = 'READY_FOR_ADAPTER',
    health_status = 'HEALTHY',
    notes = 'Dominio público accesible sin WAF bloqueante. Pendiente desarrollo de adapter específico.'
WHERE code IN (
    'acs_uy',
    'bado_asociados_uy',
    'caldeiro_uy',
    'canepa_uy',
    'century21_uy',
    'engel_volkers_uy',
    'kosak_uy',
    'meikle_uy',
    'nicolas_modena_uy',
    'remax_uy',
    'terramar_uy'
);

-- 5. Actualizar función RPC de resumen para SuperAdmin
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
    v_sources_operativas BIGINT;
    v_sources_ready BIGINT;
    v_sources_paused_waf BIGINT;
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
    SELECT COUNT(*) INTO v_sources_operativas FROM public.property_sources WHERE operational_status = 'OPERATIVA';
    SELECT COUNT(*) INTO v_sources_ready FROM public.property_sources WHERE operational_status = 'READY_FOR_ADAPTER';
    SELECT COUNT(*) INTO v_sources_paused_waf FROM public.property_sources WHERE operational_status = 'PAUSED_WAF_PROTECTED';

    -- Backward compatibility counters
    SELECT COUNT(*) INTO v_sources_healthy FROM public.property_sources WHERE health_status = 'HEALTHY';
    SELECT COUNT(*) INTO v_sources_paused FROM public.property_sources WHERE health_status = 'PAUSED' OR ingestion_enabled = false;
    SELECT COUNT(*) INTO v_sources_blocked FROM public.property_sources WHERE health_status IN ('BLOCKED', 'TOS_RESTRICTED', 'NOT_SUPPORTED', 'PAUSED_WAF_PROTECTED');

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
            'operativas', v_sources_operativas,
            'readyForAdapter', v_sources_ready,
            'pausedWaf', v_sources_paused_waf,
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

REVOKE ALL ON FUNCTION public.fn_superadmin_get_base_inmobiliaria_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_superadmin_get_base_inmobiliaria_summary() TO service_role;
