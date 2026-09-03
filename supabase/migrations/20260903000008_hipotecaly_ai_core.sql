-- ==============================================================================
-- HIPOTECALY: Migración Fase AI CORE — Sistema Central de Inteligencia Artificial
-- Migración 20260903000008_hipotecaly_ai_core.sql
-- ==============================================================================

-- 1. EXTENSIÓN PGVECTOR PARA MEMORIA GLOBAL Y RAG
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. ENUMS DE HIPOTECALY AI
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE ai_case_status AS ENUM (
        'not_started',
        'estimating',
        'queued',
        'processing_documents',
        'analyzing',
        'valuating',
        'retrieving_memory',
        'generating_report',
        'completed',
        'partial',
        'needs_review',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_semaphore_status AS ENUM ('green', 'yellow', 'red');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_semaphore_category AS ENUM (
        'tasacion',
        'ltv',
        'titularidad',
        'documentacion',
        'ingresos',
        'deudas',
        'consistencia',
        'propiedad',
        'riesgo',
        'elegibilidad'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_wallet_tx_type AS ENUM (
        'promo_credit',
        'purchase',
        'ai_consumption',
        'refund',
        'adjustment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. CONFIGURACIÓN DINÁMICA DE MODELOS Y TARIFAS (ADMIN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_model_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL DEFAULT 'default',
    extraction_model VARCHAR(100) NOT NULL DEFAULT 'gpt-5.6-luna',
    reasoning_model VARCHAR(100) NOT NULL DEFAULT 'gpt-5.6-terra',
    deep_model VARCHAR(100) NOT NULL DEFAULT 'gpt-5.6-sol',
    fallback_extraction_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
    fallback_reasoning_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o',
    fallback_deep_model VARCHAR(100) NOT NULL DEFAULT 'o3-mini',
    max_tokens INT NOT NULL DEFAULT 4096,
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_model_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) UNIQUE NOT NULL,
    cost_input_per_million_usd NUMERIC(10,4) NOT NULL DEFAULT 0.1500,
    cost_cached_input_per_million_usd NUMERIC(10,4) NOT NULL DEFAULT 0.0750,
    cost_output_per_million_usd NUMERIC(10,4) NOT NULL DEFAULT 0.6000,
    cost_per_search_usd NUMERIC(10,4) NOT NULL DEFAULT 0.0100,
    standard_case_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0.5000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. BILLETERA AI (WALLETS), SALDOS Y LEDGER INMUTABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    promotional_case_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    purchased_case_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    current_promo_month INT NOT NULL DEFAULT 1,
    promo_activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_promo_renewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    run_id UUID,
    tx_type ai_wallet_tx_type NOT NULL,
    promotional_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    purchased_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_case_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    balance_after_promotional NUMERIC(10,2) NOT NULL,
    balance_after_purchased NUMERIC(10,2) NOT NULL,
    cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_promotional_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    month_number INT NOT NULL, -- 1 (10 casos), 2 (5 casos), 3 (3 casos)
    cases_granted NUMERIC(10,2) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, month_number)
);

-- ------------------------------------------------------------------------------
-- 5. EJECUCIONES DEL ORQUESTADOR (RUNS & TRACING)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_case_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status ai_case_status NOT NULL DEFAULT 'queued',
    run_type VARCHAR(50) NOT NULL DEFAULT 'full', -- 'preliminary', 'full', 'deep'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    latency_ms INT DEFAULT 0,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. INTELIGENCIA DOCUMENTAL E INGESTA INCREMENTAL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_document_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.property_documents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256
    document_type VARCHAR(100) NOT NULL DEFAULT 'otro',
    document_date DATE,
    issuer VARCHAR(255),
    holder VARCHAR(255),
    property_owner VARCHAR(255),
    padron VARCHAR(100),
    department VARCHAR(100),
    locality VARCHAR(100),
    address TEXT,
    land_area_m2 NUMERIC(10,2),
    built_area_m2 NUMERIC(10,2),
    declared_income NUMERIC(14,2),
    currency VARCHAR(10) DEFAULT 'UYU',
    debts JSONB DEFAULT '[]'::jsonb,
    liens JSONB DEFAULT '[]'::jsonb,
    observations TEXT,
    detected_people JSONB DEFAULT '[]'::jsonb,
    detected_entities JSONB DEFAULT '[]'::jsonb,
    important_dates JSONB DEFAULT '[]'::jsonb,
    confidence NUMERIC(5,2) DEFAULT 90.00,
    warnings JSONB DEFAULT '[]'::jsonb,
    raw_extraction JSONB DEFAULT '{}'::jsonb,
    is_cached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_case_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    fact_category VARCHAR(100) NOT NULL,
    fact_key VARCHAR(100) NOT NULL,
    fact_value JSONB NOT NULL,
    confidence NUMERIC(5,2) DEFAULT 90.00,
    source_document_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. RESÚMENES, TASACIONES, SEMÁFOROS Y UNDERWRITING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_case_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.ai_case_runs(id) ON DELETE SET NULL,
    executive_summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    key_strengths JSONB DEFAULT '[]'::jsonb,
    key_risks JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    legal_disclaimer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.ai_case_runs(id) ON DELETE SET NULL,
    applicant_declared_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    estimated_market_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    estimated_min NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    estimated_max NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    conservative_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    confidence VARCHAR(50) DEFAULT 'medium',
    methodology VARCHAR(255) DEFAULT 'tasador_hibrido_hipotecaly_v1',
    comparables_used JSONB DEFAULT '[]'::jsonb,
    adjustments JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_semaphore_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.ai_case_runs(id) ON DELETE SET NULL,
    category ai_semaphore_category NOT NULL,
    status ai_semaphore_status NOT NULL,
    title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    evidence TEXT,
    source_document_ids UUID[] DEFAULT '{}',
    confidence NUMERIC(5,2) DEFAULT 90.00,
    requires_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_comparables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.ai_case_runs(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_url TEXT,
    property_type VARCHAR(100),
    department VARCHAR(100),
    locality VARCHAR(100),
    surface_m2 NUMERIC(10,2),
    price_usd NUMERIC(14,2),
    price_per_m2_usd NUMERIC(10,2),
    distance_meters INT,
    comparability_score NUMERIC(5,2),
    query_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. FEEDBACK, CORRECCIONES PROFESIONALES Y CALIDAD
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    conclusion_id UUID,
    item_category VARCHAR(100) NOT NULL,
    original_ai_output JSONB NOT NULL,
    human_correction JSONB NOT NULL,
    correction_reason TEXT NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    related_document_ids UUID[] DEFAULT '{}',
    final_resolution VARCHAR(100) DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    valuation_id UUID REFERENCES public.ai_valuations(id) ON DELETE SET NULL,
    ai_valuation NUMERIC(14,2) NOT NULL,
    human_valuation NUMERIC(14,2) NOT NULL,
    final_valuation NUMERIC(14,2) NOT NULL,
    absolute_error NUMERIC(14,2) GENERATED ALWAYS AS (ABS(ai_valuation - human_valuation)) STORED,
    percentage_error NUMERIC(6,2) GENERATED ALWAYS AS (
        CASE WHEN human_valuation > 0 THEN ROUND((ABS(ai_valuation - human_valuation) / human_valuation) * 100, 2) ELSE 0 END
    ) STORED,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. MEMORIA GLOBAL TRANSVERSAL ("MEMORIA 3" CON PGVECTOR Y SANITIZACIÓN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_global_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_type VARCHAR(100) NOT NULL, -- 'valuation_pattern', 'document_pattern', 'correction_pattern', 'underwriting_pattern'
    department VARCHAR(100) NOT NULL,
    locality VARCHAR(100),
    property_type VARCHAR(100),
    price_range VARCHAR(50),
    pattern_summary TEXT NOT NULL,
    sanitized_insight TEXT NOT NULL, -- PII COMPLETAMENTE PURGADA
    metrics JSONB DEFAULT '{}'::jsonb,
    source_feedback_id UUID REFERENCES public.ai_feedback(id) ON DELETE SET NULL,
    embedding vector(1536), -- Vector OpenAI text-embedding-3-small
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. TELEMETRÍA, CONSUMO REAL Y COSTOS (EXACTOS DE OPENAI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_case_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.ai_case_runs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL DEFAULT 'openai',
    model VARCHAR(100) NOT NULL,
    reasoning_level VARCHAR(50) DEFAULT 'standard',
    input_tokens INT NOT NULL DEFAULT 0,
    cached_input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    image_count INT NOT NULL DEFAULT 0,
    documents_processed INT NOT NULL DEFAULT 0,
    pages_processed INT NOT NULL DEFAULT 0,
    web_search_count INT NOT NULL DEFAULT 0,
    cost_input_usd NUMERIC(10,5) NOT NULL DEFAULT 0.00000,
    cost_output_usd NUMERIC(10,5) NOT NULL DEFAULT 0.00000,
    cost_tools_usd NUMERIC(10,5) NOT NULL DEFAULT 0.00000,
    cost_total_usd NUMERIC(10,5) NOT NULL DEFAULT 0.00000,
    case_units_consumed NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    standard_case_cost_usd NUMERIC(8,2) NOT NULL DEFAULT 0.50,
    breakdown JSONB DEFAULT '{}'::jsonb, -- desglose por etapa
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.ai_case_runs(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    latency_ms INT NOT NULL DEFAULT 0,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10,5) NOT NULL DEFAULT 0.00000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. ÍNDICES DE RENDIMIENTO Y BÚSQUEDA VECTORIAL
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ai_runs_app ON public.ai_case_runs(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_org ON public.ai_case_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_doc_hash ON public.ai_document_analyses(file_hash);
CREATE INDEX IF NOT EXISTS idx_ai_doc_app ON public.ai_document_analyses(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_sem_app ON public.ai_semaphore_items(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_val_app ON public.ai_valuations(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON public.ai_case_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_run ON public.ai_case_usage(run_id);
CREATE INDEX IF NOT EXISTS idx_ai_tx_org ON public.ai_wallet_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_global_mem_type ON public.ai_global_memory(memory_type, department);

-- Índice HNSW para búsqueda coseno en embeddings de memoria global
CREATE INDEX IF NOT EXISTS idx_ai_global_memory_embedding 
ON public.ai_global_memory USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ------------------------------------------------------------------------------
-- 12. RPC: TRANSACCIÓN ATÓMICA DE CONSUMO EN WALLET (SIN CONDICIONES DE CARRERA)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_ai_case_consumption(
    p_organization_id UUID,
    p_run_id UUID,
    p_cases_consumed NUMERIC,
    p_cost_usd NUMERIC,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    success BOOLEAN,
    promotional_deducted NUMERIC,
    purchased_deducted NUMERIC,
    new_promotional_balance NUMERIC,
    new_purchased_balance NUMERIC,
    total_remaining NUMERIC,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wallet RECORD;
    v_needed NUMERIC := p_cases_consumed;
    v_promo_deduct NUMERIC := 0.00;
    v_purch_deduct NUMERIC := 0.00;
    v_new_promo NUMERIC;
    v_new_purch NUMERIC;
BEGIN
    -- Bloqueo atómico a nivel de fila de la billetera
    SELECT * INTO v_wallet
    FROM public.ai_wallets
    WHERE organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Crear billetera por defecto con 10 créditos de mes 1 si no existiera
        INSERT INTO public.ai_wallets (organization_id, promotional_case_balance, purchased_case_balance)
        VALUES (p_organization_id, 10.00, 0.00)
        RETURNING * INTO v_wallet;

        INSERT INTO public.ai_promotional_credits (organization_id, month_number, cases_granted, valid_until)
        VALUES (p_organization_id, 1, 10.00, NOW() + INTERVAL '30 days');
    END IF;

    -- Consumir prioritariamente los créditos promocionales
    IF v_wallet.promotional_case_balance >= v_needed THEN
        v_promo_deduct := v_needed;
        v_needed := 0.00;
    ELSE
        v_promo_deduct := v_wallet.promotional_case_balance;
        v_needed := v_needed - v_promo_deduct;
    END IF;

    -- Si queda saldo por cubrir, consumir créditos comprados
    IF v_needed > 0 THEN
        IF v_wallet.purchased_case_balance >= v_needed THEN
            v_purch_deduct := v_needed;
            v_needed := 0.00;
        ELSE
            -- Saldo insuficiente total
            RETURN QUERY SELECT 
                FALSE, 
                0.00::NUMERIC, 
                0.00::NUMERIC, 
                v_wallet.promotional_case_balance, 
                v_wallet.purchased_case_balance, 
                (v_wallet.promotional_case_balance + v_wallet.purchased_case_balance),
                'Saldo de CASOS AI insuficiente para completar la operación.'::TEXT;
            RETURN;
        END IF;
    END IF;

    v_new_promo := ROUND(v_wallet.promotional_case_balance - v_promo_deduct, 2);
    v_new_purch := ROUND(v_wallet.purchased_case_balance - v_purch_deduct, 2);

    -- Actualizar billetera
    UPDATE public.ai_wallets
    SET promotional_case_balance = v_new_promo,
        purchased_case_balance = v_new_purch,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;

    -- Registrar en ledger inmutable
    INSERT INTO public.ai_wallet_transactions (
        organization_id,
        run_id,
        tx_type,
        promotional_amount,
        purchased_amount,
        total_case_amount,
        balance_after_promotional,
        balance_after_purchased,
        cost_usd,
        description,
        metadata
    ) VALUES (
        p_organization_id,
        p_run_id,
        'ai_consumption',
        v_promo_deduct,
        v_purch_deduct,
        p_cases_consumed,
        v_new_promo,
        v_new_purch,
        p_cost_usd,
        p_description,
        p_metadata
    );

    RETURN QUERY SELECT 
        TRUE, 
        v_promo_deduct, 
        v_purch_deduct, 
        v_new_promo, 
        v_new_purch, 
        (v_new_promo + v_new_purch),
        'Consumo de CASOS AI registrado correctamente.'::TEXT;
END;
$$;

-- ------------------------------------------------------------------------------
-- 13. RPC: GESTIÓN DE CRÉDITOS PROMOCIONALES 10 / 5 / 3
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_monthly_promotional_credits(
    p_organization_id UUID,
    p_month_number INT
)
RETURNS TABLE (
    success BOOLEAN,
    cases_granted NUMERIC,
    new_promotional_balance NUMERIC,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_credits NUMERIC := 0.00;
    v_wallet RECORD;
    v_new_promo NUMERIC;
BEGIN
    IF p_month_number = 1 THEN
        v_credits := 10.00;
    ELSIF p_month_number = 2 THEN
        v_credits := 5.00;
    ELSIF p_month_number = 3 THEN
        v_credits := 3.00;
    ELSE
        v_credits := 0.00; -- Mes 4 en adelante: 0 casos promocionales
    END IF;

    SELECT * INTO v_wallet
    FROM public.ai_wallets
    WHERE organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.ai_wallets (organization_id, promotional_case_balance, purchased_case_balance, current_promo_month)
        VALUES (p_organization_id, v_credits, 0.00, p_month_number)
        RETURNING * INTO v_wallet;
        v_new_promo := v_credits;
    ELSE
        -- Los créditos promocionales NO se acumulan, caducan al fin de mes
        v_new_promo := v_credits;
        UPDATE public.ai_wallets
        SET promotional_case_balance = v_new_promo,
            current_promo_month = p_month_number,
            last_promo_renewed_at = NOW(),
            updated_at = NOW()
        WHERE organization_id = p_organization_id;
    END IF;

    -- Registrar histórico promocional
    IF v_credits > 0 THEN
        INSERT INTO public.ai_promotional_credits (
            organization_id,
            month_number,
            cases_granted,
            valid_from,
            valid_until
        ) VALUES (
            p_organization_id,
            p_month_number,
            v_credits,
            NOW(),
            NOW() + INTERVAL '30 days'
        );

        INSERT INTO public.ai_wallet_transactions (
            organization_id,
            tx_type,
            promotional_amount,
            purchased_amount,
            total_case_amount,
            balance_after_promotional,
            balance_after_purchased,
            cost_usd,
            description
        ) VALUES (
            p_organization_id,
            'promo_credit',
            v_credits,
            0.00,
            v_credits,
            v_new_promo,
            v_wallet.purchased_case_balance,
            0.00,
            'Créditos promocionales otorgados para el Mes ' || p_month_number || ' (Esquema 10/5/3).'
        );
    END IF;

    RETURN QUERY SELECT 
        TRUE, 
        v_credits, 
        v_new_promo, 
        ('Créditos promocionales de Mes ' || p_month_number || ' aplicados: ' || v_credits || ' CASOS.')::TEXT;
END;
$$;

-- ------------------------------------------------------------------------------
-- 14. RPC: BÚSQUEDA RAG EN MEMORIA GLOBAL ANONIMIZADA
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_global_memory(
    query_embedding vector(1536),
    match_threshold NUMERIC DEFAULT 0.65,
    match_count INT DEFAULT 5,
    filter_department VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    memory_type VARCHAR,
    department VARCHAR,
    locality VARCHAR,
    property_type VARCHAR,
    pattern_summary TEXT,
    sanitized_insight TEXT,
    metrics JSONB,
    similarity NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.memory_type,
        m.department,
        m.locality,
        m.property_type,
        m.pattern_summary,
        m.sanitized_insight,
        m.metrics,
        ROUND((1 - (m.embedding <=> query_embedding))::NUMERIC, 4) AS similarity
    FROM public.ai_global_memory m
    WHERE (1 - (m.embedding <=> query_embedding)) > match_threshold
      AND (filter_department IS NULL OR m.department = filter_department OR m.department = 'Todos')
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) ESTRICTO
-- ------------------------------------------------------------------------------
ALTER TABLE public.ai_model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_promotional_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_case_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_case_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_case_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_semaphore_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_global_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_case_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

-- Modelos y Precios: Lectura para usuarios autenticados, gestión para Super Admin
CREATE POLICY "Read model settings" ON public.ai_model_settings
    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Manage model settings" ON public.ai_model_settings
    FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Read model pricing" ON public.ai_model_pricing
    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Manage model pricing" ON public.ai_model_pricing
    FOR ALL TO authenticated USING (public.is_super_admin());

-- Aislamiento de Tenant en Wallets y Transacciones
CREATE POLICY "Tenant read wallet" ON public.ai_wallets
    FOR SELECT TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

CREATE POLICY "Tenant read wallet transactions" ON public.ai_wallet_transactions
    FOR SELECT TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

CREATE POLICY "Tenant read promo credits" ON public.ai_promotional_credits
    FOR SELECT TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

-- Aislamiento de Tenant en Runs, Documentos y Hechos
CREATE POLICY "Tenant access runs" ON public.ai_case_runs
    FOR ALL TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

CREATE POLICY "Tenant access document analyses" ON public.ai_document_analyses
    FOR ALL TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

CREATE POLICY "Tenant access case facts" ON public.ai_case_facts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
        )
    );

-- Aislamiento de Tenant en Resúmenes, Tasaciones, Semáforos y Comparables
CREATE POLICY "Tenant access summaries" ON public.ai_case_summaries
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
        )
    );

CREATE POLICY "Tenant access valuations" ON public.ai_valuations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
        )
    );

CREATE POLICY "Tenant access semaphore" ON public.ai_semaphore_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
        )
    );

CREATE POLICY "Tenant access comparables" ON public.ai_comparables
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
        )
    );

CREATE POLICY "Tenant access corrections" ON public.ai_corrections
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
        )
    );

CREATE POLICY "Tenant access feedback" ON public.ai_feedback
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
        )
    );

CREATE POLICY "Tenant access usage" ON public.ai_case_usage
    FOR ALL TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

CREATE POLICY "Tenant access usage events" ON public.ai_usage_events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_case_runs r
            WHERE r.id = run_id AND (public.is_member_of_org(r.organization_id) OR public.is_super_admin())
        )
    );

-- Memoria Global Compartida: Lectura para todos los usuarios autenticados (datos sanitizados)
CREATE POLICY "Authenticated read global memory" ON public.ai_global_memory
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "System manage global memory" ON public.ai_global_memory
    FOR ALL TO authenticated USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 16. SEED INICIAL: CONFIGURACIÓN OFICIAL, TARIFAS Y TENANT PILOTO
-- ------------------------------------------------------------------------------
INSERT INTO public.ai_model_settings (
    setting_key,
    extraction_model,
    reasoning_model,
    deep_model,
    description
) VALUES (
    'default',
    'gpt-5.6-luna',
    'gpt-5.6-terra',
    'gpt-5.6-sol',
    'Configuración oficial de modelos por perfil para Hipotecaly AI Core'
) ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.ai_model_pricing (
    model_name,
    cost_input_per_million_usd,
    cost_cached_input_per_million_usd,
    cost_output_per_million_usd,
    cost_per_search_usd,
    standard_case_cost_usd
) VALUES
    ('gpt-5.6-luna', 0.1500, 0.0750, 0.6000, 0.0100, 0.5000),
    ('gpt-5.6-terra', 2.5000, 1.2500, 10.0000, 0.0100, 0.5000),
    ('gpt-5.6-sol', 5.0000, 2.5000, 20.0000, 0.0100, 0.5000),
    ('gpt-4o-mini', 0.1500, 0.0750, 0.6000, 0.0100, 0.5000),
    ('gpt-4o', 2.5000, 1.2500, 10.0000, 0.0100, 0.5000),
    ('o3-mini', 1.1000, 0.5500, 4.4000, 0.0100, 0.5000)
ON CONFLICT (model_name) DO NOTHING;

-- Inicializar billetera con 10 CASOS promocionales de Mes 1 para el tenant NOVA Demo
INSERT INTO public.ai_wallets (
    organization_id,
    promotional_case_balance,
    purchased_case_balance,
    current_promo_month
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    10.00,
    0.00,
    1
) ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO public.ai_promotional_credits (
    organization_id,
    month_number,
    cases_granted,
    valid_until
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    1,
    10.00,
    NOW() + INTERVAL '30 days'
) ON CONFLICT (organization_id, month_number) DO NOTHING;

-- Seed inicial de conocimiento en Memoria Global Sanitizada
INSERT INTO public.ai_global_memory (
    memory_type,
    department,
    locality,
    property_type,
    price_range,
    pattern_summary,
    sanitized_insight,
    metrics
) VALUES
(
    'valuation_pattern',
    'Montevideo',
    'Pocitos',
    'apartamento',
    '150k-250k',
    'En apartamentos en Pocitos de 60 a 90m2, las tasaciones profesionales se sitúan habitualmente entre USD 2.300 y USD 2.650 por m2.',
    'Ajuste por antigüedad superior a 35 años requiere castigo conservador del 8% al 12% por mantenimiento de áreas comunes si no hay reformas declaradas.',
    '{"sample_size": 28, "median_deviation_pct": -4.2, "conservative_factor": 0.85}'::jsonb
),
(
    'document_pattern',
    'Canelones',
    'Ciudad de la Costa',
    'casa',
    '100k-200k',
    'Casas en Ciudad de la Costa frecuentemente presentan ampliaciones no regularizadas en el plano de mensura original.',
    'Verificar concordancia entre la superficie edificada informada en la cédula catastral y el plano registrado ante la Intendencia de Canelones.',
    '{"warning_rate": 0.35, "category": "titularidad_planos"}'::jsonb
),
(
    'underwriting_pattern',
    'Todos',
    'Nacional',
    'Todos',
    'Todos',
    'Inmuebles con declaratoria de herederos en trámite no pueden formalizarse sin testimonio de la protocolización o certificado de resultas de juicio.',
    'Marcar semáforo Titularidad en AMARILLO/ROJO hasta presentación de testimonio notarial de protocolización definitiva.',
    '{"category": "riesgo_juridico", "risk_level": "high"}'::jsonb
);
