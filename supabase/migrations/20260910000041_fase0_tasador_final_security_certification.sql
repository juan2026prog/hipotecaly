-- ==============================================================================
-- MIGRACIÓN 20260910000041: Fase0 Tasador IA - Certificación Final de Seguridad y RLS
-- Resolución de los 4 Puntos Críticos de Seguridad:
-- 1. Despliegue e integración real en Supabase Remoto.
-- 2. Eliminación de contradicción en policies RLS (SuperAdmin exclusivo server-side, 0 direct SELECT en browser).
-- 3. Cierre estricto de EXECUTE a `PUBLIC` y `anon` en funciones/RPCs.
-- 4. Corrección de permisos de secuencias del core (application_public_seq) para evitar efectos secundarios.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CREACIÓN / VERIFICACIÓN DE LAS 19 TABLAS DE FASE 0 EN EL ESQUEMA PÚBLICO
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.property_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(150),
    country_code VARCHAR(5) DEFAULT 'UY',
    source_type VARCHAR(50) DEFAULT 'portal',
    base_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    enabled BOOLEAN NOT NULL DEFAULT true,
    ingestion_enabled BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER DEFAULT 100,
    trust_level NUMERIC(3, 2) DEFAULT 1.00,
    rate_limit_per_minute INTEGER DEFAULT 60,
    crawler_config JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_address TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    sub_neighborhood VARCHAR(100),
    street_name VARCHAR(150),
    street_number VARCHAR(50),
    unit VARCHAR(50),
    floor VARCHAR(20),
    postal_code VARCHAR(20),
    country_code VARCHAR(5) DEFAULT 'UY',
    location_precision VARCHAR(50) DEFAULT 'UNKNOWN',
    cadastral_number VARCHAR(50),
    horizontal_property_unit VARCHAR(50),
    property_type VARCHAR(50) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    toilets INTEGER,
    parking_spaces INTEGER,
    property_floor INTEGER,
    total_area_m2 NUMERIC(10, 2),
    built_area_m2 NUMERIC(10, 2),
    land_area_m2 NUMERIC(10, 2),
    internal_area_m2 NUMERIC(10, 2),
    semi_covered_area_m2 NUMERIC(10, 2),
    terrace_area_m2 NUMERIC(10, 2),
    balcony_area_m2 NUMERIC(10, 2),
    garden_area_m2 NUMERIC(10, 2),
    garage_area_m2 NUMERIC(10, 2),
    other_area_m2 NUMERIC(10, 2),
    construction_year INTEGER,
    approximate_age INTEGER,
    condition VARCHAR(50),
    orientation VARCHAR(50),
    disposition VARCHAR(50),
    occupancy_status VARCHAR(50),
    furnished BOOLEAN,
    pets_allowed BOOLEAN,
    pool BOOLEAN,
    barbecue BOOLEAN,
    garden BOOLEAN,
    terrace BOOLEAN,
    balcony BOOLEAN,
    elevator BOOLEAN,
    doorman BOOLEAN,
    security BOOLEAN,
    heating BOOLEAN,
    air_conditioning BOOLEAN,
    fireplace BOOLEAN,
    laundry BOOLEAN,
    storage BOOLEAN,
    gym BOOLEAN,
    common_area BOOLEAN,
    playground BOOLEAN,
    waterfront BOOLEAN,
    sea_view BOOLEAN,
    covered_parking BOOLEAN,
    accessibility BOOLEAN,
    solar_panels BOOLEAN,
    underfloor_heating BOOLEAN,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    dedup_hash VARCHAR(64) UNIQUE,
    canonical_status VARCHAR(50) DEFAULT 'ACTIVE',
    data_quality_score NUMERIC(5, 2),
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.property_sources(id) ON DELETE CASCADE,
    source_listing_id VARCHAR(255) NOT NULL,
    source_listing_key VARCHAR(255),
    original_url TEXT NOT NULL,
    canonical_url TEXT,
    source_agency_name TEXT,
    source_agent_id TEXT,
    title_raw TEXT,
    title_normalized TEXT,
    description_raw TEXT,
    description_normalized TEXT,
    operation_type VARCHAR(50) DEFAULT 'SALE',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REMOVED', 'EXPIRED', 'RELISTED', 'UNKNOWN', 'SOLD_OR_REMOVED_UNKNOWN', 'POSSIBLE_SOLD', 'CONFIRMED_SOLD', 'active', 'inactive', 'sold', 'removed')),
    department_raw TEXT,
    department_normalized TEXT,
    city_raw TEXT,
    city_normalized TEXT,
    locality_raw TEXT,
    locality_normalized TEXT,
    neighborhood_raw TEXT,
    neighborhood_normalized TEXT,
    sub_neighborhood_raw TEXT,
    sub_neighborhood_normalized TEXT,
    address_raw TEXT,
    address_normalized TEXT,
    street_name VARCHAR(150),
    street_number VARCHAR(50),
    unit VARCHAR(50),
    floor VARCHAR(20),
    postal_code VARCHAR(20),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    location_precision VARCHAR(50) DEFAULT 'UNKNOWN',
    cadastral_number VARCHAR(50),
    current_price NUMERIC(15, 2),
    current_currency VARCHAR(5) DEFAULT 'USD',
    original_price NUMERIC(15, 2),
    original_currency VARCHAR(5),
    price_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    price_usd NUMERIC(15, 2),
    price_uyu NUMERIC(15, 2),
    price_usd_normalized NUMERIC(15, 2),
    price_per_m2 NUMERIC(10, 2),
    price_per_m2_usd NUMERIC(10, 2),
    expenses_amount NUMERIC(15, 2),
    expenses_currency VARCHAR(5),
    taxes_amount NUMERIC(15, 2),
    taxes_currency VARCHAR(5),
    price_text_raw TEXT,
    total_area_m2 NUMERIC(10, 2),
    built_area_m2 NUMERIC(10, 2),
    land_area_m2 NUMERIC(10, 2),
    internal_area_m2 NUMERIC(10, 2),
    covered_area_m2 NUMERIC(10, 2),
    semi_covered_area_m2 NUMERIC(10, 2),
    uncovered_area_m2 NUMERIC(10, 2),
    terrace_area_m2 NUMERIC(10, 2),
    balcony_area_m2 NUMERIC(10, 2),
    garden_area_m2 NUMERIC(10, 2),
    garage_area_m2 NUMERIC(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    toilets INTEGER,
    garages INTEGER,
    parking_spaces INTEGER,
    property_floor INTEGER,
    condition VARCHAR(50),
    condition_raw TEXT,
    furnished BOOLEAN,
    pets_allowed BOOLEAN,
    pool BOOLEAN,
    barbecue BOOLEAN,
    garden BOOLEAN,
    terrace BOOLEAN,
    balcony BOOLEAN,
    elevator BOOLEAN,
    doorman BOOLEAN,
    security BOOLEAN,
    heating BOOLEAN,
    air_conditioning BOOLEAN,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_scraped_at TIMESTAMPTZ,
    source_published_at TIMESTAMPTZ,
    source_updated_at TIMESTAMPTZ,
    removed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_source_listing UNIQUE (source_id, source_listing_id)
);

CREATE TABLE IF NOT EXISTS public.property_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
    observed_at TIMESTAMPTZ DEFAULT NOW(),
    price NUMERIC(15, 2),
    price_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    price_usd NUMERIC(15, 2),
    price_uyu NUMERIC(15, 2),
    price_usd_normalized NUMERIC(15, 2),
    price_per_m2 NUMERIC(10, 2),
    price_per_m2_usd NUMERIC(10, 2),
    previous_price_usd NUMERIC(15, 2),
    price_change_percentage NUMERIC(5, 2),
    event_type VARCHAR(50) DEFAULT 'OBSERVED',
    source_snapshot_id UUID,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sha256_hash VARCHAR(64),
    perceptual_hash VARCHAR(64),
    is_main BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_listing_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    master_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    media_type VARCHAR(20) NOT NULL DEFAULT 'IMAGE' CHECK (media_type IN ('IMAGE', 'VIDEO', 'FLOOR_PLAN', 'DOCUMENT', 'OTHER')),
    original_url TEXT NOT NULL,
    cached_url TEXT,
    position INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type VARCHAR(50),
    sha256_hash VARCHAR(64),
    perceptual_hash VARCHAR(64),
    source_media_id VARCHAR(255),
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_listing_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
    attribute_key VARCHAR(100) NOT NULL,
    raw_value TEXT,
    normalized_value TEXT,
    value_type VARCHAR(50) DEFAULT 'string',
    unit VARCHAR(20),
    confidence NUMERIC(5, 2),
    source_id UUID REFERENCES public.property_sources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_duplicate_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_a_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    property_b_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    listing_a_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    listing_b_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2),
    address_score NUMERIC(5, 2),
    geo_score NUMERIC(5, 2),
    photo_score NUMERIC(5, 2),
    price_score NUMERIC(5, 2),
    area_score NUMERIC(5, 2),
    bedrooms_score NUMERIC(5, 2),
    text_score NUMERIC(5, 2),
    cadastral_score NUMERIC(5, 2),
    decision VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (decision IN ('PENDING', 'MATCH', 'NO_MATCH', 'UNCERTAIN')),
    decision_source VARCHAR(50) NOT NULL DEFAULT 'AUTOMATED',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_field_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    raw_value TEXT,
    normalized_value TEXT,
    source_id UUID REFERENCES public.property_sources(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) DEFAULT 'listing_text',
    confidence NUMERIC(5, 2),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_listing_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_hash VARCHAR(64),
    structured_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    parser_version VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_cadastral_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    cadastral_number VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    locality VARCHAR(100),
    horizontal_property_unit VARCHAR(50),
    land_area_m2 NUMERIC(10, 2),
    built_area_m2 NUMERIC(10, 2),
    official_address TEXT,
    source VARCHAR(100) DEFAULT 'Dirección Nacional de Catastro',
    source_updated_at TIMESTAMPTZ,
    retrieved_at TIMESTAMPTZ DEFAULT NOW(),
    raw_payload JSONB
);

CREATE TABLE IF NOT EXISTS public.property_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    application_id UUID,
    valuation_type VARCHAR(50) NOT NULL DEFAULT 'HIPOTECALY_AUTOMATED',
    valuation_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    market_value NUMERIC(15, 2),
    probable_min_value NUMERIC(15, 2),
    probable_max_value NUMERIC(15, 2),
    conservative_value NUMERIC(15, 2),
    currency VARCHAR(5) DEFAULT 'USD',
    confidence_score NUMERIC(5, 2),
    methodology_version VARCHAR(50),
    settings_version_id UUID,
    generated_by VARCHAR(100) DEFAULT 'HIPOTECALY_AI_ENGINE',
    professional_id UUID,
    valuation_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_valuation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valuation_id UUID NOT NULL REFERENCES public.property_valuations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    values JSONB NOT NULL DEFAULT '{}'::jsonb,
    methodology_version VARCHAR(50),
    settings_version VARCHAR(50),
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_valuation_comparables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valuation_id UUID NOT NULL REFERENCES public.property_valuations(id) ON DELETE CASCADE,
    comparable_property_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    comparable_listing_id UUID REFERENCES public.property_listings(id) ON DELETE SET NULL,
    similarity_score NUMERIC(5, 2),
    distance_meters NUMERIC(10, 2),
    selected BOOLEAN DEFAULT false,
    selection_reason TEXT,
    source_price NUMERIC(15, 2),
    adjusted_price NUMERIC(15, 2),
    adjustment_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_ai_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.property_listing_media(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    value TEXT,
    confidence NUMERIC(5, 2),
    model VARCHAR(100),
    model_version VARCHAR(50),
    evidence JSONB,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) DEFAULT 'SALE',
    transaction_date DATE NOT NULL,
    transaction_price NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'USD',
    evidence_type VARCHAR(50) DEFAULT 'PUBLIC_REGISTRY',
    evidence_reference TEXT,
    confidence NUMERIC(5, 2) DEFAULT 100.00,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appraisal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    asking_price_adjustment NUMERIC(5, 4) DEFAULT 0.1200,
    safety_margin_percentage NUMERIC(5, 2) DEFAULT 12.00,
    max_dedup_distance_meters INTEGER DEFAULT 100,
    similarity_threshold NUMERIC(5, 2) DEFAULT 85.00,
    min_comparables_count INTEGER DEFAULT 3,
    max_comparables_age_days INTEGER DEFAULT 180,
    outlier_std_dev_threshold NUMERIC(3, 2) DEFAULT 2.00,
    weights JSONB NOT NULL DEFAULT '{"surface": 0.40, "location": 0.30, "rooms": 0.15, "age": 0.15}'::jsonb,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    configuration JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID,
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

-- ------------------------------------------------------------------------------
-- 2. SEED DE FUENTES URUGUAYAS Y CONFIGURACIÓN V1 (12%)
-- ------------------------------------------------------------------------------

INSERT INTO public.property_sources (code, name, domain, country_code, is_active, enabled, ingestion_enabled, priority, rate_limit_per_minute, notes)
VALUES
  ('mercadolibre_uy', 'Mercado Libre Inmuebles', 'inmuebles.mercadolibre.com.uy', 'UY', true, true, false, 1, 60, 'Portal líder generalista en Uruguay'),
  ('infocasas', 'InfoCasas', 'infocasas.com.uy', 'UY', true, true, false, 2, 60, 'Portal especializado en residencial y desarrollos UY'),
  ('gallito_uy', 'Gallito Luis', 'gallito.com.uy', 'UY', true, true, false, 3, 30, 'Clasificado tradicional uruguayo'),
  ('remax_uy', 'RE/MAX Uruguay', 'remax.com.uy', 'UY', true, true, false, 4, 40, 'Red inmobiliaria de franquicias en Uruguay'),
  ('engel_volkers_uy', 'Engel & Völkers Uruguay', 'engelvoelkers.com.uy', 'UY', true, true, false, 5, 20, 'Inmobiliaria de segmento residencial alto'),
  ('sothebys_uy', 'Sotheby’s International Realty Uruguay', 'sothebysrealty.com.uy', 'UY', true, true, false, 6, 20, 'Bienes raíces luxury costeros y urbanos'),
  ('acs_uy', 'ACSA Inmobiliaria', 'acs.com.uy', 'UY', true, true, false, 7, 20, 'Operador tradicional en Montevideo'),
  ('kosak_uy', 'Kosak Inversiones Inmobiliarias', 'kosak.com.uy', 'UY', true, true, false, 8, 20, 'Inmobiliaria corporativa y residencial'),
  ('meikle_uy', 'Meikle Bienes Raíces', 'meikle.com.uy', 'UY', true, true, false, 9, 20, 'Especializado en Carrasco y franja este'),
  ('caldeiro_uy', 'Caldeyro Victorica Bienes Raíces', 'caldeyro.com', 'UY', true, true, false, 10, 20, 'Operador inmobiliario corporativo y rural'),
  ('pallares_bruzzone_uy', 'Pallares y Bruzzone', 'pallaresbruzzone.com.uy', 'UY', true, true, false, 11, 20, 'Inmobiliaria con foco en Montevideo norte y oeste'),
  ('bado_asociados_uy', 'Bado y Asociados', 'badoyasociados.com.uy', 'UY', true, true, false, 12, 20, 'Inmobiliaria residencial en Montevideo'),
  ('braglia_uy', 'Braglia Inmobiliaria', 'braglia.com.uy', 'UY', true, true, false, 13, 20, 'Operador inmobiliario local'),
  ('canepa_uy', 'Cánepa y Cánepa', 'canepa.com.uy', 'UY', true, true, false, 14, 20, 'Inmobiliaria tradicional uruguaya'),
  ('nicolas_modena_uy', 'Nicolás de Módena Inmobiliaria', 'nicolasdemodena.com.uy', 'UY', true, true, false, 15, 20, 'Operador residencial este y Maldonado'),
  ('nieto_paez_uy', 'Nieto y Páez', 'nietoypaez.com.uy', 'UY', true, true, false, 16, 20, 'Inmobiliaria montevideana'),
  ('terramar_uy', 'Terramar Corporate & Residential', 'terramar.com.uy', 'UY', true, true, false, 17, 20, 'Especializado en Punta del Este y Maldonado'),
  ('puntamar_uy', 'Puntamar Real Estate', 'puntamar.com.uy', 'UY', true, true, false, 18, 20, 'Inmobiliaria costera Maldonado / Rocha'),
  ('century21_uy', 'Century 21 Uruguay', 'century21.com.uy', 'UY', true, true, false, 19, 40, 'Franquicia internacional con presencia nacional'),
  ('varela_uy', 'Varela Inmobiliaria', 'varela.com.uy', 'UY', true, true, false, 20, 20, 'Operador inmobiliario tradicional')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  country_code = EXCLUDED.country_code,
  is_active = EXCLUDED.is_active,
  enabled = EXCLUDED.enabled,
  ingestion_enabled = false,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes;

INSERT INTO public.appraisal_settings (
    version, is_active, asking_price_adjustment, safety_margin_percentage, max_dedup_distance_meters, similarity_threshold, min_comparables_count, max_comparables_age_days, outlier_std_dev_threshold, weights, status, notes
) VALUES (
    1,
    true,
    0.1200, -- 12.00% factor configurable asking price
    12.00,
    100,
    85.00,
    3,
    180,
    2.00,
    '{"surface": 0.40, "location": 0.30, "rooms": 0.15, "age": 0.15}'::jsonb,
    'ACTIVE',
    'V1 - asking_price_adjustment = 12.00% (Factor inicial configurable de diferencia entre asking price y precio real de mercado).'
) ON CONFLICT (version) DO UPDATE SET
  is_active = true,
  asking_price_adjustment = 0.1200,
  safety_margin_percentage = 12.00,
  status = 'ACTIVE';

-- ------------------------------------------------------------------------------
-- 3. RESOLUCIÓN DE LOS 4 PUNTOS CRÍTICOS DE SEGURIDAD Y LOCKDOWN RLS
-- ------------------------------------------------------------------------------

-- PUNTO 1 & 2: REVOCACIÓN ABSOLUTA DE GRANTS A `PUBLIC`, `anon` Y `authenticated`
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

-- HABILITAR RLS EN TODAS LAS TABLAS
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

-- ELIMINACIÓN DE POLÍTICAS ANTERIORES (INCLUYENDO LAS POLÍTICAS CONTRADICTORIAS "superadmin_select")
DROP POLICY IF EXISTS "Allow read access to property_sources for authenticated users" ON public.property_sources;
DROP POLICY IF EXISTS "authenticated_select_property_sources" ON public.property_sources;
DROP POLICY IF EXISTS "superadmin_select_property_sources" ON public.property_sources;
DROP POLICY IF EXISTS "service_role_all_property_sources" ON public.property_sources;

DROP POLICY IF EXISTS "Allow read access to property_master for authenticated users" ON public.property_master;
DROP POLICY IF EXISTS "authenticated_select_property_master" ON public.property_master;
DROP POLICY IF EXISTS "superadmin_select_property_master" ON public.property_master;
DROP POLICY IF EXISTS "service_role_all_property_master" ON public.property_master;

DROP POLICY IF EXISTS "Allow read access to property_listings for authenticated users" ON public.property_listings;
DROP POLICY IF EXISTS "authenticated_select_property_listings" ON public.property_listings;
DROP POLICY IF EXISTS "superadmin_select_property_listings" ON public.property_listings;
DROP POLICY IF EXISTS "service_role_all_property_listings" ON public.property_listings;

DROP POLICY IF EXISTS "Allow read access to property_price_history for authenticated users" ON public.property_price_history;
DROP POLICY IF EXISTS "authenticated_select_property_price_history" ON public.property_price_history;
DROP POLICY IF EXISTS "superadmin_select_property_price_history" ON public.property_price_history;
DROP POLICY IF EXISTS "service_role_all_property_price_history" ON public.property_price_history;

DROP POLICY IF EXISTS "Allow read access to property_photos for authenticated users" ON public.property_photos;
DROP POLICY IF EXISTS "authenticated_select_property_photos" ON public.property_photos;
DROP POLICY IF EXISTS "superadmin_select_property_photos" ON public.property_photos;
DROP POLICY IF EXISTS "service_role_all_property_photos" ON public.property_photos;

DROP POLICY IF EXISTS "Allow read access to property_listing_media" ON public.property_listing_media;
DROP POLICY IF EXISTS "authenticated_select_property_listing_media" ON public.property_listing_media;
DROP POLICY IF EXISTS "superadmin_select_property_listing_media" ON public.property_listing_media;
DROP POLICY IF EXISTS "service_role_all_property_listing_media" ON public.property_listing_media;

DROP POLICY IF EXISTS "Allow read access to property_listing_attributes" ON public.property_listing_attributes;
DROP POLICY IF EXISTS "authenticated_select_property_listing_attributes" ON public.property_listing_attributes;
DROP POLICY IF EXISTS "superadmin_select_property_listing_attributes" ON public.property_listing_attributes;
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
DROP POLICY IF EXISTS "superadmin_select_property_valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "service_role_all_property_valuations" ON public.property_valuations;

DROP POLICY IF EXISTS "Allow read access to property_valuation_versions" ON public.property_valuation_versions;
DROP POLICY IF EXISTS "authenticated_select_property_valuation_versions" ON public.property_valuation_versions;
DROP POLICY IF EXISTS "superadmin_select_property_valuation_versions" ON public.property_valuation_versions;
DROP POLICY IF EXISTS "service_role_all_property_valuation_versions" ON public.property_valuation_versions;

DROP POLICY IF EXISTS "Allow read access to property_valuation_comparables" ON public.property_valuation_comparables;
DROP POLICY IF EXISTS "authenticated_select_property_valuation_comparables" ON public.property_valuation_comparables;
DROP POLICY IF EXISTS "superadmin_select_property_valuation_comparables" ON public.property_valuation_comparables;
DROP POLICY IF EXISTS "service_role_all_property_valuation_comparables" ON public.property_valuation_comparables;

DROP POLICY IF EXISTS "Allow read access to property_ai_features" ON public.property_ai_features;
DROP POLICY IF EXISTS "superadmin_select_property_ai_features" ON public.property_ai_features;
DROP POLICY IF EXISTS "service_role_all_property_ai_features" ON public.property_ai_features;

DROP POLICY IF EXISTS "Allow read access to property_transactions" ON public.property_transactions;
DROP POLICY IF EXISTS "superadmin_select_property_transactions" ON public.property_transactions;
DROP POLICY IF EXISTS "service_role_all_property_transactions" ON public.property_transactions;

DROP POLICY IF EXISTS "Allow read access to appraisal_settings for authenticated users" ON public.appraisal_settings;
DROP POLICY IF EXISTS "authenticated_select_appraisal_settings" ON public.appraisal_settings;
DROP POLICY IF EXISTS "superadmin_select_appraisal_settings" ON public.appraisal_settings;
DROP POLICY IF EXISTS "service_role_all_appraisal_settings" ON public.appraisal_settings;

DROP POLICY IF EXISTS "Allow read access to crawler_runs" ON public.crawler_runs;
DROP POLICY IF EXISTS "superadmin_select_crawler_runs" ON public.crawler_runs;
DROP POLICY IF EXISTS "service_role_all_crawler_runs" ON public.crawler_runs;

DROP POLICY IF EXISTS "Allow read access to ai_usage_events" ON public.ai_usage_events;
DROP POLICY IF EXISTS "authenticated_select_ai_usage_events" ON public.ai_usage_events;
DROP POLICY IF EXISTS "superadmin_select_ai_usage_events" ON public.ai_usage_events;
DROP POLICY IF EXISTS "service_role_all_ai_usage_events" ON public.ai_usage_events;

-- PUNTO 2: POLÍTICA ÚNICA Y COHERENTE EXCLUSIVAMENTE PARA SERVICE_ROLE (SUPER ADMIN ACCEDE VÍA SERVER-SIDE PRIVILEGED PATH)
CREATE POLICY "service_role_all_property_sources" ON public.property_sources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_master" ON public.property_master FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_listings" ON public.property_listings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_price_history" ON public.property_price_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_photos" ON public.property_photos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_listing_media" ON public.property_listing_media FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_listing_attributes" ON public.property_listing_attributes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_duplicate_candidates" ON public.property_duplicate_candidates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_field_evidence" ON public.property_field_evidence FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_listing_snapshots" ON public.property_listing_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_cadastral_data" ON public.property_cadastral_data FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_valuations" ON public.property_valuations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_valuation_versions" ON public.property_valuation_versions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_valuation_comparables" ON public.property_valuation_comparables FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_ai_features" ON public.property_ai_features FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_property_transactions" ON public.property_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_appraisal_settings" ON public.appraisal_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crawler_runs" ON public.crawler_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_ai_usage_events" ON public.ai_usage_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- OTORGAR GRANTS COMPLETOS EXCLUSIVAMENTE A SERVICE_ROLE
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

-- ------------------------------------------------------------------------------
-- PUNTO 3: HARDENING DEFINITIVO DE RPCs Y FUNCIONES (REVOKE EXECUTE DE PUBLIC, ANON Y AUTHENTICATED)
-- ------------------------------------------------------------------------------

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


CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- PUNTO 4: RESTAURACIÓN DE PERMISOS EN SECUENCIAS DEL CORE (application_public_seq)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public' AND sequence_name = 'application_public_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.application_public_seq TO authenticated, service_role;
    END IF;
END $$;
