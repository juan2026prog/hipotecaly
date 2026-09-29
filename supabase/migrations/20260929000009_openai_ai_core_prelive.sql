-- ==============================================================================
-- HIPOTECALY: Migración Fase AI Core Pre-Live Remediation
-- Migración 20260929000009_openai_ai_core_prelive.sql
-- ==============================================================================

-- 1. POLÍTICAS DE UNDERWRITING POR ORGANIZACIÓN (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.organization_underwriting_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    max_ltv NUMERIC(5,2) NOT NULL DEFAULT 40.00,
    min_ltv NUMERIC(5,2) DEFAULT 5.00,
    min_loan_amount NUMERIC(14,2) NOT NULL DEFAULT 10000.00,
    max_loan_amount NUMERIC(14,2) NOT NULL DEFAULT 200000.00,
    min_term_months INT NOT NULL DEFAULT 12,
    max_term_months INT NOT NULL DEFAULT 60,
    accepted_property_types TEXT[] NOT NULL DEFAULT '{casa,apartamento,terreno,local_comercial,campo}',
    accepted_departments TEXT[] NOT NULL DEFAULT '{Montevideo,Canelones,Maldonado,Colonia,San Jose,Rocha,Salto,Paysandu,Todos}',
    accepted_currencies TEXT[] NOT NULL DEFAULT '{USD}',
    requires_income_proof BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_income_types TEXT[] NOT NULL DEFAULT '{dependiente,independiente,jubilado,rentista}',
    minimum_income_monthly NUMERIC(14,2) DEFAULT 0.00,
    accepts_clearing BOOLEAN NOT NULL DEFAULT TRUE,
    max_dti_ratio NUMERIC(5,2) DEFAULT 35.00,
    max_borrower_age_at_maturity INT DEFAULT 75,
    default_interest_rate_annual NUMERIC(5,2) DEFAULT 11.50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. REGISTRO CANÓNICO DE TARIFAS Y FRESHNESS (AI MODEL PRICING REGISTRY)
CREATE TABLE IF NOT EXISTS public.ai_model_pricing_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(100) NOT NULL DEFAULT 'openai',
    model VARCHAR(100) UNIQUE NOT NULL,
    input_price_per_million NUMERIC(10,4) NOT NULL DEFAULT 0.1500,
    cached_input_price_per_million NUMERIC(10,4) NOT NULL DEFAULT 0.0750,
    output_price_per_million NUMERIC(10,4) NOT NULL DEFAULT 0.6000,
    tool_price NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(255) NOT NULL DEFAULT 'OpenAI Official Pricing (Verified)',
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'CURRENT', -- 'CURRENT', 'STALE', 'UNKNOWN'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROMPT REGISTRY VERSIONADO
CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_key VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    template TEXT NOT NULL,
    expected_schema JSONB,
    model_profile VARCHAR(100) NOT NULL DEFAULT 'FAST_EXTRACTION',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'DRAFT', 'ACTIVE', 'ARCHIVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(prompt_key, version)
);

-- 4. EVOLUCIÓN DE AI_USAGE_EVENTS (ATRIBUCIÓN EXPLICITA HIPOTECALY Y MULTI-TENANT)
ALTER TABLE public.ai_usage_events
    ADD COLUMN IF NOT EXISTS project VARCHAR(100) NOT NULL DEFAULT 'HIPOTECALY',
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS feature VARCHAR(100) DEFAULT 'ai_core',
    ADD COLUMN IF NOT EXISTS operation VARCHAR(100) DEFAULT 'inference',
    ADD COLUMN IF NOT EXISTS model VARCHAR(100) DEFAULT 'gpt-4o-mini',
    ADD COLUMN IF NOT EXISTS prompt_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(50) DEFAULT '1.0.0',
    ADD COLUMN IF NOT EXISTS cached_input_tokens INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_tokens INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pricing_status VARCHAR(50) DEFAULT 'CURRENT',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'success',
    ADD COLUMN IF NOT EXISTS error_code VARCHAR(100);

-- RLS POLICIES
ALTER TABLE public.organization_underwriting_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_pricing_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "organization_underwriting_policies_tenant_isolation" ON public.organization_underwriting_policies;
    CREATE POLICY "organization_underwriting_policies_tenant_isolation" ON public.organization_underwriting_policies
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND is_active = true
            ) OR (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
            )
        );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "pricing_registry_read_all" ON public.ai_model_pricing_registry;
    CREATE POLICY "pricing_registry_read_all" ON public.ai_model_pricing_registry
        FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "prompt_templates_read_all" ON public.ai_prompt_templates;
    CREATE POLICY "prompt_templates_read_all" ON public.ai_prompt_templates
        FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- SEED INICIAL DE TARIFAS
INSERT INTO public.ai_model_pricing_registry (
    model, input_price_per_million, cached_input_price_per_million, output_price_per_million, tool_price, source, status
) VALUES
    ('gpt-4o-mini', 0.1500, 0.0750, 0.6000, 0.0100, 'OpenAI Official Pricing (2026)', 'CURRENT'),
    ('gpt-4o', 2.5000, 1.2500, 10.0000, 0.0100, 'OpenAI Official Pricing (2026)', 'CURRENT'),
    ('o3-mini', 1.1000, 0.5500, 4.4000, 0.0100, 'OpenAI Official Pricing (2026)', 'CURRENT'),
    ('text-embedding-3-small', 0.0200, 0.0200, 0.0000, 0.0000, 'OpenAI Official Pricing (2026)', 'CURRENT')
ON CONFLICT (model) DO UPDATE SET
    input_price_per_million = EXCLUDED.input_price_per_million,
    cached_input_price_per_million = EXCLUDED.cached_input_price_per_million,
    output_price_per_million = EXCLUDED.output_price_per_million,
    last_verified_at = NOW(),
    status = 'CURRENT';
