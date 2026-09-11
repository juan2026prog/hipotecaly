-- ==============================================================================
-- MIGRACIÓN 20260911000044: Fase 5 & Fase 6 Tasador IA
-- Integración de Expedientes, Tasaciones Profesionales, Feedback de Analistas,
-- Ground Truth, Backtesting sin Data Leakage y Calibración Progresiva Shadow
-- ==============================================================================

-- 1. EXTENSIÓN DE VALUACIONES PARA EXPEDIENTES Y ORGANIZACIONES
ALTER TABLE public.property_valuations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128),
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS ai_status VARCHAR(50) DEFAULT 'COMPLETED';

CREATE INDEX IF NOT EXISTS idx_property_valuations_org_case ON public.property_valuations(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_property_valuations_idempotency ON public.property_valuations(idempotency_key);

-- 2. VINCULACIÓN ENTRE EXPEDIENTE E INMUEBLE (CASE_PROPERTY_LINKS)
CREATE TABLE IF NOT EXISTS public.case_property_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'PRIMARY_COLLATERAL' CHECK (relationship_type IN ('PRIMARY_COLLATERAL', 'SECONDARY_COLLATERAL', 'REFERENCE', 'OTHER')),
    is_primary_collateral BOOLEAN NOT NULL DEFAULT true,
    resolution_status VARCHAR(50) NOT NULL DEFAULT 'UNRESOLVED' CHECK (resolution_status IN ('MATCHED', 'PROVISIONAL', 'REVIEW_REQUIRED', 'UNRESOLVED')),
    resolution_score NUMERIC(5, 2) DEFAULT 0.00,
    resolution_notes TEXT,
    provisional_data JSONB DEFAULT '{}'::jsonb,
    linked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_property_links_case ON public.case_property_links(case_id);
CREATE INDEX IF NOT EXISTS idx_case_property_links_master ON public.case_property_links(property_master_id);
CREATE INDEX IF NOT EXISTS idx_case_property_links_org ON public.case_property_links(organization_id);

-- 3. TASACIONES PROFESIONALES EXTERNAS (PERICIALES / NOTARIALES)
CREATE TABLE IF NOT EXISTS public.professional_appraisals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    professional_name VARCHAR(150) NOT NULL,
    professional_type VARCHAR(50) NOT NULL DEFAULT 'PERITO_TASADOR' CHECK (professional_type IN ('PERITO_TASADOR', 'ARQUITECTO', 'INGENIERO', 'ESCRIBANO', 'INMOBILIARIA', 'OTRO')),
    registration_number VARCHAR(100),
    appraisal_date DATE NOT NULL,
    appraised_value NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    methodology VARCHAR(100) DEFAULT 'COMPARATIVO_MERCADO',
    document_url TEXT,
    deviation_vs_ai_percentage NUMERIC(7, 2),
    verification_status VARCHAR(50) DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'PENDING_DOCUMENT', 'REJECTED')),
    notes TEXT,
    entered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_appraisals_org_case ON public.professional_appraisals(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_professional_appraisals_master ON public.professional_appraisals(property_master_id);

-- 4. FEEDBACK CUALITATIVO DE VALUACIONES (SEPARADO DE GROUND TRUTH)
CREATE TABLE IF NOT EXISTS public.valuation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    valuation_id UUID REFERENCES public.property_valuations(id) ON DELETE CASCADE,
    valuation_version_id UUID REFERENCES public.property_valuation_versions(id) ON DELETE SET NULL,
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('VALUATION_TOO_HIGH', 'VALUATION_TOO_LOW', 'COMPARABLE_INCORRECT', 'PROPERTY_DATA_INCORRECT', 'VISUAL_FEATURE_INCORRECT', 'RANGE_TOO_WIDE', 'RANGE_TOO_NARROW', 'GOOD_RESULT', 'PROFESSIONAL_OVERRIDE', 'OTHER')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    suggested_value NUMERIC(15, 2),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_valuation_feedback_val ON public.valuation_feedback(valuation_id);
CREATE INDEX IF NOT EXISTS idx_valuation_feedback_org ON public.valuation_feedback(organization_id);

-- 5. OBSERVACIONES CUANTITATIVAS PARA CALIBRACIÓN Y GROUND TRUTH
CREATE TABLE IF NOT EXISTS public.valuation_calibration_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valuation_id UUID REFERENCES public.property_valuations(id) ON DELETE CASCADE,
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.property_transactions(id) ON DELETE SET NULL,
    professional_appraisal_id UUID REFERENCES public.professional_appraisals(id) ON DELETE SET NULL,
    ground_truth_type VARCHAR(50) NOT NULL CHECK (ground_truth_type IN ('CONFIRMED_CLOSING', 'DOCUMENT_VERIFIED', 'BROKER_REPORTED', 'CLIENT_REPORTED')),
    ground_truth_level INTEGER NOT NULL CHECK (ground_truth_level BETWEEN 1 AND 4),
    predicted_value NUMERIC(15, 2) NOT NULL,
    actual_value NUMERIC(15, 2) NOT NULL,
    absolute_error NUMERIC(15, 2) NOT NULL,
    percentage_error NUMERIC(7, 4) NOT NULL,
    signed_percentage_error NUMERIC(7, 4) NOT NULL,
    valuation_date TIMESTAMPTZ NOT NULL,
    transaction_date DATE NOT NULL,
    days_between_valuation_and_transaction INTEGER NOT NULL,
    department VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100),
    property_type VARCHAR(50) NOT NULL,
    price_band VARCHAR(50),
    confidence_at_prediction NUMERIC(5, 2),
    settings_version VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calibration_obs_val_master ON public.valuation_calibration_observations(valuation_id, property_master_id);
CREATE INDEX IF NOT EXISTS idx_calibration_obs_dept_neigh ON public.valuation_calibration_observations(department, neighborhood);

-- 6. EJECUCIONES DE CALIBRACIÓN Y PROPUESTAS SHADOW
CREATE TABLE IF NOT EXISTS public.valuation_calibration_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(100) NOT NULL DEFAULT 'GLOBAL',
    target_parameter VARCHAR(100),
    cutoff_date DATE,
    sample_size INTEGER NOT NULL DEFAULT 0,
    training_sample_size INTEGER NOT NULL DEFAULT 0,
    validation_sample_size INTEGER NOT NULL DEFAULT 0,
    current_settings_version VARCHAR(50) NOT NULL,
    candidate_settings_version VARCHAR(50),
    metrics_before JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics_after JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'INSUFFICIENT_DATA', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    run_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.valuation_calibration_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.valuation_calibration_runs(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_path TEXT NOT NULL,
    current_value JSONB NOT NULL,
    proposed_value JSONB NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    sample_size INTEGER NOT NULL,
    expected_impact TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EJECUCIONES DE BACKTESTING HISTÓRICO CON CUTOFF DATE
CREATE TABLE IF NOT EXISTS public.valuation_backtest_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cutoff_date DATE NOT NULL,
    department VARCHAR(100),
    property_type VARCHAR(50),
    sample_count INTEGER NOT NULL DEFAULT 0,
    mae NUMERIC(15, 2),
    mape NUMERIC(7, 4),
    mdape NUMERIC(7, 4),
    bias NUMERIC(7, 4),
    coverage_percentage NUMERIC(5, 2),
    detailed_results JSONB DEFAULT '[]'::jsonb,
    executed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. HABILITACIÓN DE RLS Y POLÍTICAS MULTI-ORGANIZACIÓN
ALTER TABLE public.case_property_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_calibration_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_calibration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_calibration_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_backtest_runs ENABLE ROW LEVEL SECURITY;

-- Acceso multi-organización a enlaces de propiedades del expediente
CREATE POLICY "org_members_select_case_property_links"
  ON public.case_property_links FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "org_members_insert_case_property_links"
  ON public.case_property_links FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "org_members_update_case_property_links"
  ON public.case_property_links FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Acceso a tasaciones profesionales
CREATE POLICY "org_members_select_professional_appraisals"
  ON public.professional_appraisals FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "org_members_insert_professional_appraisals"
  ON public.professional_appraisals FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Acceso a feedback
CREATE POLICY "org_members_select_valuation_feedback"
  ON public.valuation_feedback FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "org_members_insert_valuation_feedback"
  ON public.valuation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Acceso a valuaciones por organización
CREATE POLICY "org_members_select_property_valuations"
  ON public.property_valuations FOR SELECT
  TO authenticated
  USING (
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Acceso exclusivo de Super Admin para calibración y backtesting
CREATE POLICY "superadmin_all_calibration_observations"
  ON public.valuation_calibration_observations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "superadmin_all_calibration_runs"
  ON public.valuation_calibration_runs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "superadmin_all_calibration_proposals"
  ON public.valuation_calibration_proposals FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

CREATE POLICY "superadmin_all_backtest_runs"
  ON public.valuation_backtest_runs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
  );
