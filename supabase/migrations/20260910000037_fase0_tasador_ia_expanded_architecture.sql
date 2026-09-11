-- ==============================================================================
-- MIGRACIÓN 20260910000037: Fase0 Tasador IA - Ampliación de Arquitectura de Datos
-- Base Inmobiliaria Global, Candidatos de Deduplicación, Evidencia, Snapshots,
-- Catastro Preparado, Valuaciones/Comparables Preparadas y Ajuste Asking Price (12%)
-- ==============================================================================

-- 1. AMPLIACIÓN DE FUENTES Y CONFIGURACIÓN DEFINITIVA DE TOP 20 PORTALES LOCALES URUGUAYOS
ALTER TABLE public.property_sources
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'portal',
  ADD COLUMN IF NOT EXISTS base_url TEXT,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ingestion_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS trust_level NUMERIC(3, 2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Limpiar semillas anteriores que no coincidan con las 20 uruguayas definitivas
DELETE FROM public.property_sources
WHERE code NOT IN (
  'mercadolibre_uy', 'infocasas', 'gallito_uy', 'remax_uy', 'engel_volkers_uy',
  'sothebys_uy', 'acs_uy', 'kosak_uy', 'meikle_uy', 'caldeiro_uy',
  'pallares_bruzzone_uy', 'bado_asociados_uy', 'braglia_uy', 'canepa_uy',
  'nicolas_modena_uy', 'nieto_paez_uy', 'terramar_uy', 'puntamar_uy',
  'century21_uy', 'varela_uy'
);

-- Insertar o actualizar exactamente las 20 fuentes iniciales con ingestion_enabled = false
INSERT INTO public.property_sources (code, name, domain, country_code, is_active, enabled, ingestion_enabled, priority, rate_limit_per_minute, notes)
VALUES
  ('mercadolibre_uy', 'Mercado Libre Inmuebles', 'inmuebles.mercadolibre.com.uy', 'UY', true, true, false, 1, 60, 'Portal líder generalista en Uruguay'),
  ('infocasas', 'InfoCasas', 'infocasas.com.uy', 'UY', true, true, false, 2, 60, 'Portal especializado en residencial y desarrollos UY'),
  ('gallito_uy', 'Gallito Luis', 'gallito.com.uy', 'UY', true, true, false, 3, 30, 'Clasificado tradicional uruguayo'),
  ('remax_uy', 'RE/MAX Uruguay', 'remax.com.uy', 'UY', true, true, false, 4, 40, 'Red inmobiliaria de franquicias en Uruguay'),
  ('engel_volkers_uy', 'Engel & Völkers Uruguay', 'engelvoelkers.com.uy', 'UY', true, true, false, 5, 20, 'Inmobiliaria de segmento residencial alto'),
  ('sothebys_uy', 'Sotheby’s International Realty Uruguay', 'sothebysrealty.com.uy', 'UY', true, true, false, 6, 20, 'Bienes raíces luxury costeros y urbanos'),
  ('acs_uy', 'ACS Inmobiliaria', 'acs.com.uy', 'UY', true, true, false, 7, 20, 'Operador tradicional en Montevideo'),
  ('kosak_uy', 'Kosak Inversiones Inmobiliarias', 'kosak.com.uy', 'UY', true, true, false, 8, 20, 'Inmobiliaria corporativa y residencial'),
  ('meikle_uy', 'Meikle Bienes Raíces', 'meikle.com.uy', 'UY', true, true, false, 9, 20, 'Especializado en Carrasco y franja este'),
  ('caldeiro_uy', 'Caldeiro Victorica Bienes Raíces', 'caldeyro.com', 'UY', true, true, false, 10, 20, 'Operador inmobiliario corporativo y rural'),
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
  ingestion_enabled = EXCLUDED.ingestion_enabled,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes;

-- 2. AMPLIACIÓN DE UBICACIÓN E IDENTIDAD EN `property_master`
ALTER TABLE public.property_master
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(5) DEFAULT 'UY',
  ADD COLUMN IF NOT EXISTS locality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sub_neighborhood VARCHAR(100),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS street_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS street_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
  ADD COLUMN IF NOT EXISTS floor VARCHAR(20),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS location_precision VARCHAR(50) DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS horizontal_property_unit VARCHAR(50),
  ADD COLUMN IF NOT EXISTS construction_year INTEGER,
  ADD COLUMN IF NOT EXISTS approximate_age INTEGER,
  ADD COLUMN IF NOT EXISTS canonical_status VARCHAR(50) DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS data_quality_score NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 3. AMPLIACIÓN DE LISTING (RAW + NORMALIZADO, UBICACIÓN, PRECIOS EXPLICITOS) EN `property_listings`
ALTER TABLE public.property_listings
  ADD COLUMN IF NOT EXISTS source_listing_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_listing_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS original_url TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS source_agency_name TEXT,
  ADD COLUMN IF NOT EXISTS source_agent_id TEXT,
  ADD COLUMN IF NOT EXISTS title_raw TEXT,
  ADD COLUMN IF NOT EXISTS title_normalized TEXT,
  ADD COLUMN IF NOT EXISTS description_raw TEXT,
  ADD COLUMN IF NOT EXISTS description_normalized TEXT,
  ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50) DEFAULT 'SALE',
  ADD COLUMN IF NOT EXISTS department_raw TEXT,
  ADD COLUMN IF NOT EXISTS department_normalized TEXT,
  ADD COLUMN IF NOT EXISTS city_raw TEXT,
  ADD COLUMN IF NOT EXISTS city_normalized TEXT,
  ADD COLUMN IF NOT EXISTS locality_raw TEXT,
  ADD COLUMN IF NOT EXISTS locality_normalized TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood_raw TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood_normalized TEXT,
  ADD COLUMN IF NOT EXISTS sub_neighborhood_raw TEXT,
  ADD COLUMN IF NOT EXISTS sub_neighborhood_normalized TEXT,
  ADD COLUMN IF NOT EXISTS address_raw TEXT,
  ADD COLUMN IF NOT EXISTS address_normalized TEXT,
  ADD COLUMN IF NOT EXISTS street_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS street_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
  ADD COLUMN IF NOT EXISTS floor VARCHAR(20),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS location_precision VARCHAR(50) DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS cadastral_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS current_price NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS current_currency VARCHAR(5) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS original_currency VARCHAR(5),
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS price_uyu NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS price_per_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS expenses_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS expenses_currency VARCHAR(5),
  ADD COLUMN IF NOT EXISTS taxes_amount NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS taxes_currency VARCHAR(5),
  ADD COLUMN IF NOT EXISTS price_text_raw TEXT,
  ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

-- 4. AMPLIACIÓN DE DESGLOSE DE SUPERFICIES Y AMENITIES EN `property_master` Y `property_listings`
ALTER TABLE public.property_master
  ADD COLUMN IF NOT EXISTS total_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS built_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS land_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS internal_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS semi_covered_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS terrace_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS balcony_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS garden_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS garage_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS other_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS toilets INTEGER,
  ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
  ADD COLUMN IF NOT EXISTS property_floor INTEGER,
  ADD COLUMN IF NOT EXISTS condition VARCHAR(50),
  ADD COLUMN IF NOT EXISTS orientation VARCHAR(50),
  ADD COLUMN IF NOT EXISTS disposition VARCHAR(50),
  ADD COLUMN IF NOT EXISTS occupancy_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS furnished BOOLEAN,
  ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN,
  ADD COLUMN IF NOT EXISTS pool BOOLEAN,
  ADD COLUMN IF NOT EXISTS barbecue BOOLEAN,
  ADD COLUMN IF NOT EXISTS garden BOOLEAN,
  ADD COLUMN IF NOT EXISTS terrace BOOLEAN,
  ADD COLUMN IF NOT EXISTS balcony BOOLEAN,
  ADD COLUMN IF NOT EXISTS elevator BOOLEAN,
  ADD COLUMN IF NOT EXISTS doorman BOOLEAN,
  ADD COLUMN IF NOT EXISTS security BOOLEAN,
  ADD COLUMN IF NOT EXISTS heating BOOLEAN,
  ADD COLUMN IF NOT EXISTS air_conditioning BOOLEAN,
  ADD COLUMN IF NOT EXISTS fireplace BOOLEAN,
  ADD COLUMN IF NOT EXISTS laundry BOOLEAN,
  ADD COLUMN IF NOT EXISTS storage BOOLEAN,
  ADD COLUMN IF NOT EXISTS gym BOOLEAN,
  ADD COLUMN IF NOT EXISTS common_area BOOLEAN,
  ADD COLUMN IF NOT EXISTS playground BOOLEAN,
  ADD COLUMN IF NOT EXISTS waterfront BOOLEAN,
  ADD COLUMN IF NOT EXISTS sea_view BOOLEAN,
  ADD COLUMN IF NOT EXISTS covered_parking BOOLEAN,
  ADD COLUMN IF NOT EXISTS accessibility BOOLEAN,
  ADD COLUMN IF NOT EXISTS solar_panels BOOLEAN,
  ADD COLUMN IF NOT EXISTS underfloor_heating BOOLEAN;

ALTER TABLE public.property_listings
  ADD COLUMN IF NOT EXISTS total_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS built_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS land_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS internal_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS covered_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS semi_covered_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS uncovered_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS terrace_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS balcony_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS garden_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS garage_area_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
  ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
  ADD COLUMN IF NOT EXISTS toilets INTEGER,
  ADD COLUMN IF NOT EXISTS garages INTEGER,
  ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
  ADD COLUMN IF NOT EXISTS property_floor INTEGER,
  ADD COLUMN IF NOT EXISTS condition VARCHAR(50),
  ADD COLUMN IF NOT EXISTS condition_raw TEXT,
  ADD COLUMN IF NOT EXISTS furnished BOOLEAN,
  ADD COLUMN IF NOT EXISTS pets_allowed BOOLEAN,
  ADD COLUMN IF NOT EXISTS pool BOOLEAN,
  ADD COLUMN IF NOT EXISTS barbecue BOOLEAN,
  ADD COLUMN IF NOT EXISTS garden BOOLEAN,
  ADD COLUMN IF NOT EXISTS terrace BOOLEAN,
  ADD COLUMN IF NOT EXISTS balcony BOOLEAN,
  ADD COLUMN IF NOT EXISTS elevator BOOLEAN,
  ADD COLUMN IF NOT EXISTS doorman BOOLEAN,
  ADD COLUMN IF NOT EXISTS security BOOLEAN,
  ADD COLUMN IF NOT EXISTS heating BOOLEAN,
  ADD COLUMN IF NOT EXISTS air_conditioning BOOLEAN;

-- 5. AMPLIACIÓN DE `property_price_history` (INMUTABLE APPEND-ONLY CON EVENT_TYPE)
ALTER TABLE public.property_price_history
  ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS price_uyu NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS price_per_m2 NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'OBSERVED',
  ADD COLUMN IF NOT EXISTS source_snapshot_id UUID;

-- 6. TABLA DE CANDIDATOS DE DEDUPLICACIÓN (SIN FUSIONES DESTRUCTIVAS AUTOMÁTICAS)
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

-- 7. TABLA DE MEDIOS / FOTOS DE PUBLICACIONES (`property_listing_media` GENERALIZADO)
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

-- 8. TABLA DE ATRIBUTOS FLEXIBLES (`property_listing_attributes`)
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

-- 9. TABLA DE EVIDENCIA POR CAMPO (`property_field_evidence`)
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

-- 10. TABLA DE SNAPSHOTS DE PUBLICACIÓN (`property_listing_snapshots`)
CREATE TABLE IF NOT EXISTS public.property_listing_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_hash VARCHAR(64),
    structured_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    parser_version VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABLA DE DATOS CATASTRALES (PREPARADA PERO NO CONECTADA)
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

-- 12. TABLAS DE VALUACIONES, VERSIONES Y COMPARABLES (PREPARADAS SIN EJECUTAR TASACIONES)
CREATE TABLE IF NOT EXISTS public.property_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 13. TABLA DE CARACTERÍSTICAS EXTRAÍDAS POR IA (`property_ai_features` - PREPARADA SIN EJECUCIÓN DE IA)
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

-- 14. TABLA DE OPERACIONES REALES Y TRANSACCIONES (`property_transactions` - PREPARADA SIN MOCK DATA)
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

-- 15. CORRECCIÓN CONCEPTUAL DEL 12% EN `appraisal_settings` (`asking_price_adjustment = 0.1200`)
ALTER TABLE public.appraisal_settings
  ADD COLUMN IF NOT EXISTS asking_price_adjustment NUMERIC(5, 4) DEFAULT 0.1200,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb;

-- Actualizar la versión V1 con la definición explícita de asking_price_adjustment = 0.1200 (12.00%)
UPDATE public.appraisal_settings
SET
  asking_price_adjustment = 0.1200,
  notes = 'V1 - asking_price_adjustment = 12.00% (Factor inicial configurable de diferencia entre asking price y precio real de mercado/operación, sujeto a calibración futura).'
WHERE version = 1;

-- 16. HABILITAR RLS Y RESTRINGIR PERMISOS (PRINCIPIO DE MÍNIMO PRIVILEGIO)
ALTER TABLE public.property_duplicate_candidates ENABLE ROW LEVEL SECURITY;
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

-- POLÍTICAS DE LECTURA PÚBLICA/AUTENTICADA AUTORIZADA
CREATE POLICY "Allow read access to property_duplicate_candidates"
  ON public.property_duplicate_candidates FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_listing_media"
  ON public.property_listing_media FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_listing_attributes"
  ON public.property_listing_attributes FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_field_evidence"
  ON public.property_field_evidence FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_listing_snapshots"
  ON public.property_listing_snapshots FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_cadastral_data"
  ON public.property_cadastral_data FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_valuations"
  ON public.property_valuations FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_valuation_versions"
  ON public.property_valuation_versions FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_valuation_comparables"
  ON public.property_valuation_comparables FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_ai_features"
  ON public.property_ai_features FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Allow read access to property_transactions"
  ON public.property_transactions FOR SELECT TO authenticated, anon USING (true);

-- POLÍTICAS DE ESCRITURA EXCLUSIVAS PARA SERVICE_ROLE
CREATE POLICY "Allow service_role full control on property_duplicate_candidates"
  ON public.property_duplicate_candidates FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_listing_media"
  ON public.property_listing_media FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_listing_attributes"
  ON public.property_listing_attributes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_field_evidence"
  ON public.property_field_evidence FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_listing_snapshots"
  ON public.property_listing_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_cadastral_data"
  ON public.property_cadastral_data FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_valuations"
  ON public.property_valuations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_valuation_versions"
  ON public.property_valuation_versions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_valuation_comparables"
  ON public.property_valuation_comparables FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_ai_features"
  ON public.property_ai_features FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_transactions"
  ON public.property_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CONCEDER PERMISOS BÁSICOS
GRANT SELECT ON public.property_duplicate_candidates TO authenticated, anon;
GRANT SELECT ON public.property_listing_media TO authenticated, anon;
GRANT SELECT ON public.property_listing_attributes TO authenticated, anon;
GRANT SELECT ON public.property_field_evidence TO authenticated, anon;
GRANT SELECT ON public.property_listing_snapshots TO authenticated, anon;
GRANT SELECT ON public.property_cadastral_data TO authenticated, anon;
GRANT SELECT ON public.property_valuations TO authenticated, anon;
GRANT SELECT ON public.property_valuation_versions TO authenticated, anon;
GRANT SELECT ON public.property_valuation_comparables TO authenticated, anon;
GRANT SELECT ON public.property_ai_features TO authenticated, anon;
GRANT SELECT ON public.property_transactions TO authenticated, anon;

GRANT ALL ON public.property_duplicate_candidates TO service_role;
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
