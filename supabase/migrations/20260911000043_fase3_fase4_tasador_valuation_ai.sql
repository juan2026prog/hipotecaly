-- ==============================================================================
-- MIGRACIÓN 20260911000043: Fase3 & Fase4 Tasador IA - Índices y Seguridad
-- Motor de Comparables, Valuación Determinística, AI Features y Cost Tracking
-- ==============================================================================

-- 1. ÍNDICES DE RENDIMIENTO PARA MOTOR DE COMPARABLES Y VALUACIÓN
CREATE INDEX IF NOT EXISTS idx_property_master_type_dept ON public.property_master(property_type, department);
CREATE INDEX IF NOT EXISTS idx_property_master_built_area ON public.property_master(covered_surface_m2);
CREATE INDEX IF NOT EXISTS idx_property_listings_price_usd ON public.property_listings(price_usd_normalized);
CREATE INDEX IF NOT EXISTS idx_property_valuations_master_date ON public.property_valuations(property_master_id, valuation_date DESC);
CREATE INDEX IF NOT EXISTS idx_property_valuation_comparables_val ON public.property_valuation_comparables(valuation_id);
CREATE INDEX IF NOT EXISTS idx_property_ai_features_master ON public.property_ai_features(property_master_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_val_created ON public.ai_usage_events(valuation_id, created_at DESC);

-- 2. REAFIRMACIÓN DE SEGURIDAD RLS (ACCESO EXCLUSIVO SERVICE_ROLE / SUPER ADMIN)
REVOKE ALL ON public.property_valuations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_valuation_versions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_valuation_comparables FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.property_ai_features FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.ai_usage_events FROM PUBLIC, anon, authenticated;

-- 3. HABILITACIÓN DE RLS
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuation_comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE LECTURA AUTORIZADA PARA SUPER ADMIN
CREATE POLICY "superadmin_select_property_valuations"
  ON public.property_valuations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

CREATE POLICY "superadmin_select_property_valuation_versions"
  ON public.property_valuation_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

CREATE POLICY "superadmin_select_property_valuation_comparables"
  ON public.property_valuation_comparables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

CREATE POLICY "superadmin_select_property_ai_features"
  ON public.property_ai_features FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

CREATE POLICY "superadmin_select_ai_usage_events"
  ON public.ai_usage_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );
