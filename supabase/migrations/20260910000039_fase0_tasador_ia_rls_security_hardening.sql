-- ==============================================================================
-- MIGRACIÓN 20260910000039: Fase0 Tasador IA - Security Hardening & Deny By Default RLS
-- Aplicación estricta de Deny-By-Default en las 18 tablas de la Base Inmobiliaria Global,
-- revocación total de accesos al rol `anon`, aislamiento estricto Multi-Tenant
-- (organization_id) y restricción a Server-Side / service_role + super_admin.
-- ==============================================================================

-- 1. ASEGURAR COLUMNA organization_id EN property_valuations SI NO EXISTE PARA TENANT ISOLATION DIRECTO
ALTER TABLE public.property_valuations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. REVOCACIÓN COMPLETA DE PERMISOS AL ROL `anon` EN LAS 18 TABLAS
REVOKE ALL ON public.property_sources FROM anon;
REVOKE ALL ON public.property_master FROM anon;
REVOKE ALL ON public.property_listings FROM anon;
REVOKE ALL ON public.property_price_history FROM anon;
REVOKE ALL ON public.property_duplicate_candidates FROM anon;
REVOKE ALL ON public.property_photos FROM anon;
REVOKE ALL ON public.property_listing_media FROM anon;
REVOKE ALL ON public.property_listing_attributes FROM anon;
REVOKE ALL ON public.property_field_evidence FROM anon;
REVOKE ALL ON public.property_listing_snapshots FROM anon;
REVOKE ALL ON public.property_cadastral_data FROM anon;
REVOKE ALL ON public.property_valuations FROM anon;
REVOKE ALL ON public.property_valuation_versions FROM anon;
REVOKE ALL ON public.property_valuation_comparables FROM anon;
REVOKE ALL ON public.property_ai_features FROM anon;
REVOKE ALL ON public.property_transactions FROM anon;
REVOKE ALL ON public.appraisal_settings FROM anon;
REVOKE ALL ON public.crawler_runs FROM anon;
REVOKE ALL ON public.ai_usage_events FROM anon;

-- 3. HABILITAR RLS EN TODAS LAS TABLAS DE FASE 0
ALTER TABLE public.property_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listing_attributes ENABLE ROW LEVEL SECURITY;
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

-- 4. ELIMINAR POLÍTICAS PERMISIVAS ANTERIORES CON USING(true) PARA anon / authenticated
DROP POLICY IF EXISTS "Allow read access to property_sources for authenticated users" ON public.property_sources;
DROP POLICY IF EXISTS "Allow read access to property_master for authenticated users" ON public.property_master;
DROP POLICY IF EXISTS "Allow read access to property_listings for authenticated users" ON public.property_listings;
DROP POLICY IF EXISTS "Allow read access to property_price_history for authenticated users" ON public.property_price_history;
DROP POLICY IF EXISTS "Allow read access to property_photos for authenticated users" ON public.property_photos;
DROP POLICY IF EXISTS "Allow read access to appraisal_settings for authenticated users" ON public.appraisal_settings;

DROP POLICY IF EXISTS "Allow read access to property_duplicate_candidates" ON public.property_duplicate_candidates;
DROP POLICY IF EXISTS "Allow read access to property_listing_media" ON public.property_listing_media;
DROP POLICY IF EXISTS "Allow read access to property_listing_attributes" ON public.property_listing_attributes;
DROP POLICY IF EXISTS "Allow read access to property_field_evidence" ON public.property_field_evidence;
DROP POLICY IF EXISTS "Allow read access to property_listing_snapshots" ON public.property_listing_snapshots;
DROP POLICY IF EXISTS "Allow read access to property_cadastral_data" ON public.property_cadastral_data;
DROP POLICY IF EXISTS "Allow read access to property_valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "Allow read access to property_valuation_versions" ON public.property_valuation_versions;
DROP POLICY IF EXISTS "Allow read access to property_valuation_comparables" ON public.property_valuation_comparables;
DROP POLICY IF EXISTS "Allow read access to property_ai_features" ON public.property_ai_features;
DROP POLICY IF EXISTS "Allow read access to property_transactions" ON public.property_transactions;
DROP POLICY IF EXISTS "Allow read access to crawler_runs" ON public.crawler_runs;
DROP POLICY IF EXISTS "Allow read access to ai_usage_events" ON public.ai_usage_events;

-- ELIMINAR POLÍTICAS SERVICE ROLE ANTERIORES PARA RE-CREARLAS LIMPIAS CON DEFINICIONES PRIVILEGIADAS
DROP POLICY IF EXISTS "Allow service_role full control on property_sources" ON public.property_sources;
DROP POLICY IF EXISTS "Allow service_role full control on property_master" ON public.property_master;
DROP POLICY IF EXISTS "Allow service_role full control on property_listings" ON public.property_listings;
DROP POLICY IF EXISTS "Allow service_role full control on property_price_history" ON public.property_price_history;
DROP POLICY IF EXISTS "Allow service_role full control on property_photos" ON public.property_photos;
DROP POLICY IF EXISTS "Allow service_role full control on appraisal_settings" ON public.appraisal_settings;
DROP POLICY IF EXISTS "Allow service_role full control on property_duplicate_candidates" ON public.property_duplicate_candidates;
DROP POLICY IF EXISTS "Allow service_role full control on property_listing_media" ON public.property_listing_media;
DROP POLICY IF EXISTS "Allow service_role full control on property_listing_attributes" ON public.property_listing_attributes;
DROP POLICY IF EXISTS "Allow service_role full control on property_field_evidence" ON public.property_field_evidence;
DROP POLICY IF EXISTS "Allow service_role full control on property_listing_snapshots" ON public.property_listing_snapshots;
DROP POLICY IF EXISTS "Allow service_role full control on property_cadastral_data" ON public.property_cadastral_data;
DROP POLICY IF EXISTS "Allow service_role full control on property_valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "Allow service_role full control on property_valuation_versions" ON public.property_valuation_versions;
DROP POLICY IF EXISTS "Allow service_role full control on property_valuation_comparables" ON public.property_valuation_comparables;
DROP POLICY IF EXISTS "Allow service_role full control on property_ai_features" ON public.property_ai_features;
DROP POLICY IF EXISTS "Allow service_role full control on property_transactions" ON public.property_transactions;
DROP POLICY IF EXISTS "Allow service_role full control on crawler_runs" ON public.crawler_runs;
DROP POLICY IF EXISTS "Allow service_role full control on ai_usage_events" ON public.ai_usage_events;

-- ==============================================================================
-- 5. NUEVAS POLÍTICAS DE RLS POR CATEGORÍA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- CATEGORÍA 1: TABLAS PÚBLICAS REUTILIZABLES DE LA BASE INMOBILIARIA GLOBAL (SOLO SELECT PARA AUTHENTICATED)
-- ------------------------------------------------------------------------------

-- 1. property_sources
CREATE POLICY "authenticated_select_property_sources"
  ON public.property_sources FOR SELECT TO authenticated
  USING (is_active = true OR enabled = true OR public.is_super_admin());

CREATE POLICY "service_role_all_property_sources"
  ON public.property_sources FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. property_master
CREATE POLICY "authenticated_select_property_master"
  ON public.property_master FOR SELECT TO authenticated
  USING (archived_at IS NULL OR public.is_super_admin());

CREATE POLICY "service_role_all_property_master"
  ON public.property_master FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. property_listings
CREATE POLICY "authenticated_select_property_listings"
  ON public.property_listings FOR SELECT TO authenticated
  USING (status IN ('ACTIVE', 'UNKNOWN', 'SOLD_OR_REMOVED_UNKNOWN') OR public.is_super_admin());

CREATE POLICY "service_role_all_property_listings"
  ON public.property_listings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 4. property_price_history
CREATE POLICY "authenticated_select_property_price_history"
  ON public.property_price_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_role_all_property_price_history"
  ON public.property_price_history FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5 & 6. property_photos / property_listing_media
CREATE POLICY "authenticated_select_property_photos"
  ON public.property_photos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_role_all_property_photos"
  ON public.property_photos FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_select_property_listing_media"
  ON public.property_listing_media FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_role_all_property_listing_media"
  ON public.property_listing_media FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 7. property_listing_attributes
CREATE POLICY "authenticated_select_property_listing_attributes"
  ON public.property_listing_attributes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "service_role_all_property_listing_attributes"
  ON public.property_listing_attributes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 8. appraisal_settings
CREATE POLICY "authenticated_select_appraisal_settings"
  ON public.appraisal_settings FOR SELECT TO authenticated
  USING (is_active = true OR public.is_super_admin());

CREATE POLICY "service_role_all_appraisal_settings"
  ON public.appraisal_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- CATEGORÍA 2: TABLAS MULTI-TENANT ISOLATED CON ISOLATION ESTRICTO POR ORGANIZACIÓN
-- ------------------------------------------------------------------------------

-- 9. property_valuations (Multi-tenant)
CREATE POLICY "authenticated_select_property_valuations"
  ON public.property_valuations FOR SELECT TO authenticated
  USING (
    (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    OR (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.applications a WHERE a.id = property_valuations.application_id AND public.is_member_of_org(a.organization_id)
    ))
    OR public.is_super_admin()
  );

CREATE POLICY "authenticated_insert_property_valuations"
  ON public.property_valuations FOR INSERT TO authenticated
  WITH CHECK (
    (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    OR (application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.applications a WHERE a.id = property_valuations.application_id AND public.is_member_of_org(a.organization_id)
    ))
    OR public.is_super_admin()
  );

CREATE POLICY "service_role_all_property_valuations"
  ON public.property_valuations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 10. property_valuation_versions (Multi-tenant via valuation)
CREATE POLICY "authenticated_select_property_valuation_versions"
  ON public.property_valuation_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_valuations v
      WHERE v.id = valuation_id
      AND (
        (v.organization_id IS NOT NULL AND public.is_member_of_org(v.organization_id))
        OR (v.application_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.applications a WHERE a.id = v.application_id AND public.is_member_of_org(a.organization_id)
        ))
        OR public.is_super_admin()
      )
    )
  );

CREATE POLICY "service_role_all_property_valuation_versions"
  ON public.property_valuation_versions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 11. property_valuation_comparables (Multi-tenant via valuation)
CREATE POLICY "authenticated_select_property_valuation_comparables"
  ON public.property_valuation_comparables FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_valuations v
      WHERE v.id = valuation_id
      AND (
        (v.organization_id IS NOT NULL AND public.is_member_of_org(v.organization_id))
        OR (v.application_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.applications a WHERE a.id = v.application_id AND public.is_member_of_org(a.organization_id)
        ))
        OR public.is_super_admin()
      )
    )
  );

CREATE POLICY "service_role_all_property_valuation_comparables"
  ON public.property_valuation_comparables FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 12. ai_usage_events (Multi-tenant isolation por organization_id)
CREATE POLICY "authenticated_select_ai_usage_events"
  ON public.ai_usage_events FOR SELECT TO authenticated
  USING (
    (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    OR public.is_super_admin()
  );

CREATE POLICY "service_role_all_ai_usage_events"
  ON public.ai_usage_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- CATEGORÍA 3: TABLAS SERVER-SIDE ONLY (EXCLUSIVAS service_role Y super_admin)
-- Revocadas totalmente a `authenticated` y `anon`. No accesible directamente por clientes API standard.
-- ------------------------------------------------------------------------------

-- 13. property_duplicate_candidates
REVOKE ALL ON public.property_duplicate_candidates FROM authenticated;
CREATE POLICY "superadmin_select_property_duplicate_candidates"
  ON public.property_duplicate_candidates FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "service_role_all_property_duplicate_candidates"
  ON public.property_duplicate_candidates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 14. property_field_evidence
REVOKE ALL ON public.property_field_evidence FROM authenticated;
CREATE POLICY "superadmin_select_property_field_evidence"
  ON public.property_field_evidence FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "service_role_all_property_field_evidence"
  ON public.property_field_evidence FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 15. property_listing_snapshots
REVOKE ALL ON public.property_listing_snapshots FROM authenticated;
CREATE POLICY "superadmin_select_property_listing_snapshots"
  ON public.property_listing_snapshots FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "service_role_all_property_listing_snapshots"
  ON public.property_listing_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 16. property_cadastral_data
REVOKE ALL ON public.property_cadastral_data FROM authenticated;
CREATE POLICY "superadmin_select_property_cadastral_data"
  ON public.property_cadastral_data FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "service_role_all_property_cadastral_data"
  ON public.property_cadastral_data FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 17. property_ai_features
REVOKE ALL ON public.property_ai_features FROM authenticated;
CREATE POLICY "superadmin_select_property_ai_features"
  ON public.property_ai_features FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "service_role_all_property_ai_features"
  ON public.property_ai_features FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 18. property_transactions
REVOKE ALL ON public.property_transactions FROM authenticated;
CREATE POLICY "superadmin_select_property_transactions"
  ON public.property_transactions FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "service_role_all_property_transactions"
  ON public.property_transactions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 19. crawler_runs
REVOKE ALL ON public.crawler_runs FROM authenticated;
CREATE POLICY "superadmin_select_crawler_runs"
  ON public.crawler_runs FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "service_role_all_crawler_runs"
  ON public.crawler_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 6. ASIGNACIÓN EXPLICITA DE GRANTS SEGÚN PRIVILEGIO MÍNIMO
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.property_sources TO authenticated;
GRANT SELECT ON public.property_master TO authenticated;
GRANT SELECT ON public.property_listings TO authenticated;
GRANT SELECT ON public.property_price_history TO authenticated;
GRANT SELECT ON public.property_photos TO authenticated;
GRANT SELECT ON public.property_listing_media TO authenticated;
GRANT SELECT ON public.property_listing_attributes TO authenticated;
GRANT SELECT ON public.appraisal_settings TO authenticated;
GRANT SELECT, INSERT ON public.property_valuations TO authenticated;
GRANT SELECT ON public.property_valuation_versions TO authenticated;
GRANT SELECT ON public.property_valuation_comparables TO authenticated;
GRANT SELECT ON public.ai_usage_events TO authenticated;

-- GRANTS COMPLETOS UNICAMENTE A SERVICE_ROLE
GRANT ALL ON public.property_sources TO service_role;
GRANT ALL ON public.property_master TO service_role;
GRANT ALL ON public.property_listings TO service_role;
GRANT ALL ON public.property_price_history TO service_role;
GRANT ALL ON public.property_duplicate_candidates TO service_role;
GRANT ALL ON public.property_photos TO service_role;
GRANT ALL ON public.property_listing_media TO service_role;
GRANT ALL ON public.property_listing_attributes TO service_role;
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
