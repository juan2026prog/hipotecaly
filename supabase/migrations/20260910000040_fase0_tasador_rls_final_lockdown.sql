-- ==============================================================================
-- MIGRACIÓN 20260910000040: Fase0 Tasador IA - LockDown Definitivo de Seguridad & RLS
-- Aplicación estricta de Deny-by-Default en las 19 tablas de la Base Inmobiliaria Global.
-- Revocación TOTAL de Grants y acceso directo a los roles `anon`, `authenticated`
-- y `PUBLIC`. Restricción exclusiva a `service_role` (server-side) y `is_super_admin()`.
-- ==============================================================================

-- 1. REVOCACIÓN COMPLETA DE PRIVILEGIOS DE TABLA A `PUBLIC`, `anon` Y `authenticated`
REVOKE ALL ON public.property_sources FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_master FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_listings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_price_history FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_photos FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_listing_media FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_listing_attributes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_duplicate_candidates FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_field_evidence FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_listing_snapshots FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_cadastral_data FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_valuations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_valuation_versions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_valuation_comparables FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_ai_features FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_transactions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.appraisal_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.crawler_runs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.ai_usage_events FROM PUBLIC, anon, authenticated;

-- 2. HABILITACIÓN DE RLS EN LAS 19 TABLAS DE FASE 0
ALTER TABLE public.property_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listing_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_field_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_cadastral_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuation_comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawler_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINACIÓN DE TODAS LAS POLÍTICAS ANTERIORES EN LAS 19 TABLAS
DROP POLICY IF EXISTS "Allow read access to property_sources for authenticated users" ON public.property_sources;
DROP POLICY IF EXISTS "authenticated_select_property_sources" ON public.property_sources;
DROP POLICY IF EXISTS "service_role_all_property_sources" ON public.property_sources;

DROP POLICY IF EXISTS "Allow read access to property_master for authenticated users" ON public.property_master;
DROP POLICY IF EXISTS "authenticated_select_property_master" ON public.property_master;
DROP POLICY IF EXISTS "service_role_all_property_master" ON public.property_master;

DROP POLICY IF EXISTS "Allow read access to property_listings for authenticated users" ON public.property_listings;
DROP POLICY IF EXISTS "authenticated_select_property_listings" ON public.property_listings;
DROP POLICY IF EXISTS "service_role_all_property_listings" ON public.property_listings;

DROP POLICY IF EXISTS "Allow read access to property_price_history for authenticated users" ON public.property_price_history;
DROP POLICY IF EXISTS "authenticated_select_property_price_history" ON public.property_price_history;
DROP POLICY IF EXISTS "service_role_all_property_price_history" ON public.property_price_history;

DROP POLICY IF EXISTS "Allow read access to property_photos for authenticated users" ON public.property_photos;
DROP POLICY IF EXISTS "authenticated_select_property_photos" ON public.property_photos;
DROP POLICY IF EXISTS "service_role_all_property_photos" ON public.property_photos;

DROP POLICY IF EXISTS "Allow read access to property_listing_media" ON public.property_listing_media;
DROP POLICY IF EXISTS "authenticated_select_property_listing_media" ON public.property_listing_media;
DROP POLICY IF EXISTS "service_role_all_property_listing_media" ON public.property_listing_media;

DROP POLICY IF EXISTS "Allow read access to property_listing_attributes" ON public.property_listing_attributes;
DROP POLICY IF EXISTS "authenticated_select_property_listing_attributes" ON public.property_listing_attributes;
DROP POLICY IF EXISTS "service_role_all_property_listing_attributes" ON public.property_listing_attributes;

DROP POLICY IF EXISTS "Allow read access to property_duplicate_candidates" ON public.property_duplicate_candidates;
DROP POLICY IF EXISTS "superadmin_select_property_duplicate_candidates" ON public.property_duplicate_candidates;
DROP POLICY IF EXISTS "service_role_all_property_duplicate_candidates" ON public.property_duplicate_candidates;

DROP POLICY IF EXISTS "Allow read access to property_field_evidence" ON public.property_field_evidence;
DROP POLICY IF EXISTS "superadmin_select_property_field_evidence" ON public.property_field_evidence;
DROP POLICY IF EXISTS "service_role_all_property_field_evidence" ON public.property_field_evidence;

DROP POLICY IF EXISTS "Allow read access to property_listing_snapshots" ON public.property_listing_snapshots;
DROP POLICY IF EXISTS "superadmin_select_property_listing_snapshots" ON public.property_listing_snapshots;
DROP POLICY IF EXISTS "service_role_all_property_listing_snapshots" ON public.property_listing_snapshots;

DROP POLICY IF EXISTS "Allow read access to property_cadastral_data" ON public.property_cadastral_data;
DROP POLICY IF EXISTS "superadmin_select_property_cadastral_data" ON public.property_cadastral_data;
DROP POLICY IF EXISTS "service_role_all_property_cadastral_data" ON public.property_cadastral_data;

DROP POLICY IF EXISTS "Allow read access to property_valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "authenticated_select_property_valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "authenticated_insert_property_valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "service_role_all_property_valuations" ON public.property_valuations;

DROP POLICY IF EXISTS "Allow read access to property_valuation_versions" ON public.property_valuation_versions;
DROP POLICY IF EXISTS "authenticated_select_property_valuation_versions" ON public.property_valuation_versions;
DROP POLICY IF EXISTS "service_role_all_property_valuation_versions" ON public.property_valuation_versions;

DROP POLICY IF EXISTS "Allow read access to property_valuation_comparables" ON public.property_valuation_comparables;
DROP POLICY IF EXISTS "authenticated_select_property_valuation_comparables" ON public.property_valuation_comparables;
DROP POLICY IF EXISTS "service_role_all_property_valuation_comparables" ON public.property_valuation_comparables;

DROP POLICY IF EXISTS "Allow read access to property_ai_features" ON public.property_ai_features;
DROP POLICY IF EXISTS "superadmin_select_property_ai_features" ON public.property_ai_features;
DROP POLICY IF EXISTS "service_role_all_property_ai_features" ON public.property_ai_features;

DROP POLICY IF EXISTS "Allow read access to property_transactions" ON public.property_transactions;
DROP POLICY IF EXISTS "superadmin_select_property_transactions" ON public.property_transactions;
DROP POLICY IF EXISTS "service_role_all_property_transactions" ON public.property_transactions;

DROP POLICY IF EXISTS "Allow read access to appraisal_settings for authenticated users" ON public.appraisal_settings;
DROP POLICY IF EXISTS "authenticated_select_appraisal_settings" ON public.appraisal_settings;
DROP POLICY IF EXISTS "service_role_all_appraisal_settings" ON public.appraisal_settings;

DROP POLICY IF EXISTS "Allow read access to crawler_runs" ON public.crawler_runs;
DROP POLICY IF EXISTS "superadmin_select_crawler_runs" ON public.crawler_runs;
DROP POLICY IF EXISTS "service_role_all_crawler_runs" ON public.crawler_runs;

DROP POLICY IF EXISTS "Allow read access to ai_usage_events" ON public.ai_usage_events;
DROP POLICY IF EXISTS "authenticated_select_ai_usage_events" ON public.ai_usage_events;
DROP POLICY IF EXISTS "service_role_all_ai_usage_events" ON public.ai_usage_events;

-- 4. NUEVAS POLÍTICAS ESTRICTAS: ACCESO PRIVILEGIADO ÚNICAMENTE PARA SUPER ADMIN Y SERVICE ROLE

-- 1. property_sources
CREATE POLICY "superadmin_select_property_sources" ON public.property_sources FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_sources" ON public.property_sources FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. property_master
CREATE POLICY "superadmin_select_property_master" ON public.property_master FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_master" ON public.property_master FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. property_listings
CREATE POLICY "superadmin_select_property_listings" ON public.property_listings FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_listings" ON public.property_listings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. property_price_history
CREATE POLICY "superadmin_select_property_price_history" ON public.property_price_history FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_price_history" ON public.property_price_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5 & 6. property_photos / property_listing_media
CREATE POLICY "superadmin_select_property_photos" ON public.property_photos FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_photos" ON public.property_photos FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "superadmin_select_property_listing_media" ON public.property_listing_media FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_listing_media" ON public.property_listing_media FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. property_listing_attributes
CREATE POLICY "superadmin_select_property_listing_attributes" ON public.property_listing_attributes FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_listing_attributes" ON public.property_listing_attributes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. property_duplicate_candidates
CREATE POLICY "superadmin_select_property_duplicate_candidates" ON public.property_duplicate_candidates FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_duplicate_candidates" ON public.property_duplicate_candidates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 9. property_field_evidence
CREATE POLICY "superadmin_select_property_field_evidence" ON public.property_field_evidence FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_field_evidence" ON public.property_field_evidence FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 10. property_listing_snapshots
CREATE POLICY "superadmin_select_property_listing_snapshots" ON public.property_listing_snapshots FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_listing_snapshots" ON public.property_listing_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 11. property_cadastral_data
CREATE POLICY "superadmin_select_property_cadastral_data" ON public.property_cadastral_data FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_cadastral_data" ON public.property_cadastral_data FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 12. property_valuations
CREATE POLICY "superadmin_select_property_valuations" ON public.property_valuations FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_valuations" ON public.property_valuations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 13. property_valuation_versions
CREATE POLICY "superadmin_select_property_valuation_versions" ON public.property_valuation_versions FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_valuation_versions" ON public.property_valuation_versions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 14. property_valuation_comparables
CREATE POLICY "superadmin_select_property_valuation_comparables" ON public.property_valuation_comparables FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_valuation_comparables" ON public.property_valuation_comparables FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 15. property_ai_features
CREATE POLICY "superadmin_select_property_ai_features" ON public.property_ai_features FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_ai_features" ON public.property_ai_features FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 16. property_transactions
CREATE POLICY "superadmin_select_property_transactions" ON public.property_transactions FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_property_transactions" ON public.property_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 17. appraisal_settings
CREATE POLICY "superadmin_select_appraisal_settings" ON public.appraisal_settings FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_appraisal_settings" ON public.appraisal_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 18. crawler_runs
CREATE POLICY "superadmin_select_crawler_runs" ON public.crawler_runs FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_crawler_runs" ON public.crawler_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 19. ai_usage_events
CREATE POLICY "superadmin_select_ai_usage_events" ON public.ai_usage_events FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "service_role_all_ai_usage_events" ON public.ai_usage_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. GRANTS UNICAMENTE A SERVICE_ROLE
GRANT ALL ON public.property_sources TO service_role;
GRANT ALL ON public.property_master TO service_role;
GRANT ALL ON public.property_listings TO service_role;
GRANT ALL ON public.property_price_history TO service_role;
GRANT ALL ON public.property_photos TO service_role;
GRANT ALL ON public.property_listing_media TO service_role;
GRANT ALL ON public.property_listing_attributes TO service_role;
GRANT ALL ON public.property_duplicate_candidates TO service_role;
GRANT ALL ON public.property_field_evidence TO service_role;
GRANT ALL ON public.property_listing_snapshots TO service_role;
GRANT ALL ON public.property_cadastral_data TO service_role;
GRANT ALL ON public.property_valuations TO service_role;
GRANT ALL ON public.property_valuation_versions TO service_role;
GRANT ALL ON public.property_valuation_comparables TO service_role;
GRANT ALL ON public.property_ai_features TO service_role;
GRANT ALL ON public.property_transactions TO service_role;
GRANT ALL ON public.appraisal_settings TO service_role;
GRANT ALL ON public.crawler_runs TO service_role;
GRANT ALL ON public.ai_usage_events TO service_role;

-- 6. HARDENING DE FUNCIONES Y RPCs (SECURITY DEFINER + search_path SEGURO + REVOKE DE EXECUTE DE PUBLIC/ANON/AUTHENTICATED)

CREATE OR REPLACE FUNCTION public.fn_track_property_price_change()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_usd NUMERIC(15, 2);
    v_change_pct NUMERIC(5, 2);
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF OLD.price_usd IS DISTINCT FROM NEW.price_usd THEN
            v_prev_usd := OLD.price_usd;
            IF v_prev_usd IS NOT NULL AND v_prev_usd > 0 THEN
                v_change_pct := ROUND(((NEW.price_usd - v_prev_usd) / v_prev_usd) * 100.0, 2);
            ELSE
                v_change_pct := NULL;
            END IF;

            INSERT INTO public.property_price_history (
                property_id, listing_id, price_amount, currency, price_usd_normalized, price_per_m2_usd, previous_price_usd, price_change_percentage, event_type
            ) VALUES (
                NEW.id, NEW.master_id, NEW.price_amount, NEW.currency, NEW.price_usd_normalized, NEW.price_per_m2_usd, v_prev_usd, v_change_pct, 'PRICE_CHANGED'
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.property_price_history (
            property_id, listing_id, price_amount, currency, price_usd_normalized, price_per_m2_usd, previous_price_usd, price_change_percentage, event_type
        ) VALUES (
            NEW.id, NEW.master_id, NEW.price_amount, NEW.currency, NEW.price_usd_normalized, NEW.price_per_m2_usd, NULL, NULL, 'FIRST_SEEN'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.fn_track_property_price_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_track_property_price_change() TO service_role;


CREATE OR REPLACE FUNCTION public.calculate_property_dedup_hash(
    p_address TEXT,
    p_department TEXT,
    p_cadastral_number TEXT DEFAULT NULL
)
RETURNS VARCHAR(64) AS $$
DECLARE
    v_clean_text TEXT;
BEGIN
    v_clean_text := LOWER(REGEXP_REPLACE(COALESCE(p_address, '') || '|' || COALESCE(p_department, '') || '|' || COALESCE(p_cadastral_number, ''), '[^a-z0-9|]', '', 'g'));
    RETURN ENCODE(DIGEST(v_clean_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.calculate_property_dedup_hash(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_property_dedup_hash(TEXT, TEXT, TEXT) TO service_role;


CREATE OR REPLACE FUNCTION public.get_active_appraisal_settings()
RETURNS SETOF public.appraisal_settings AS $$
BEGIN
    IF (auth.role() = 'service_role' OR public.is_super_admin()) THEN
        RETURN QUERY
        SELECT * FROM public.appraisal_settings
        WHERE is_active = true
        ORDER BY version DESC
        LIMIT 1;
    ELSE
        RAISE EXCEPTION 'Access denied: caller is not authorized to retrieve appraisal settings.';
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_active_appraisal_settings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_appraisal_settings() TO service_role;

-- 7. REVOCACIÓN DE PRIVILEGIOS DE SECUENCIAS
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
