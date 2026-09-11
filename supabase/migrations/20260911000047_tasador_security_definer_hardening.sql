-- ==============================================================================
-- HIPOTECALY — TASADOR IA: HARDENING ESTRICTO DE PERMISOS EN PROCEDIMIENTOS ALMACENADOS
-- Migración 20260911000047: REVOKE DE PERMISOS A anon Y authenticated
-- ==============================================================================

-- 1. REVOCAR ACCESOS DE EJECUCIÓN A ROLES PÚBLICOS, ANÓNIMOS Y AUTENTICADOS REGULARES
REVOKE ALL ON FUNCTION public.fn_pipeline_get_existing_fingerprints(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_pipeline_enqueue_jobs(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_pipeline_claim_jobs(integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_pipeline_complete_job(uuid, text, text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_pipeline_ingest_listing(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_pipeline_update_source_health(text, text, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_pipeline_touch_unchanged_listings(text, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_pipeline_record_discovery_run(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_superadmin_get_listing_audit(uuid) FROM PUBLIC, anon, authenticated;

-- Procedimientos de Superadmin existentes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_superadmin_get_base_inmobiliaria_summary') THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.fn_superadmin_get_base_inmobiliaria_summary() FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.fn_superadmin_get_base_inmobiliaria_summary() TO service_role;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_superadmin_get_property_sources') THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.fn_superadmin_get_property_sources() FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.fn_superadmin_get_property_sources() TO service_role;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_superadmin_list_properties_inspector') THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.fn_superadmin_list_properties_inspector(text, text, text, text, text, numeric, text, integer, integer) FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.fn_superadmin_list_properties_inspector(text, text, text, text, text, numeric, text, integer, integer) TO service_role;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_superadmin_toggle_source_switch') THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.fn_superadmin_toggle_source_switch(text, text, boolean) FROM PUBLIC, anon, authenticated;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.fn_superadmin_toggle_source_switch(text, text, boolean) TO service_role;';
    END IF;
END $$;

-- 2. ASIGNAR PRIVILEGIO EXCLUSIVO DE EJECUCIÓN A service_role (SERVER-SIDE ONLY)
GRANT EXECUTE ON FUNCTION public.fn_pipeline_get_existing_fingerprints(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_enqueue_jobs(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_claim_jobs(integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_complete_job(uuid, text, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_ingest_listing(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_update_source_health(text, text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_touch_unchanged_listings(text, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_pipeline_record_discovery_run(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_superadmin_get_listing_audit(uuid) TO service_role;
