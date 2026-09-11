-- ==============================================================================
-- MIGRACIÓN 20260910000036: Fase0 Tasador IA - Arquitectura y Modelo de Datos
-- Base Inmobiliaria Global independiente de Expedientes (applications)
-- ==============================================================================

-- 1. FUENTES Y PORTALES INMOBILIARIOS (Top 20 Configuración)
CREATE TABLE IF NOT EXISTS public.property_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    country_code VARCHAR(5) NOT NULL DEFAULT 'UY',
    is_active BOOLEAN NOT NULL DEFAULT true,
    crawler_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. REGISTRO MAESTRO CANÓNICO DE PROPIEDADES (Global y separado de expedientes)
CREATE TABLE IF NOT EXISTS public.property_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_address TEXT NOT NULL,
    normalized_address TEXT NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Montevideo',
    city VARCHAR(100) NOT NULL DEFAULT 'Montevideo',
    neighborhood VARCHAR(100),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    property_type VARCHAR(50) NOT NULL DEFAULT 'apartamento',
    covered_surface_m2 NUMERIC(10, 2),
    uncovered_surface_m2 NUMERIC(10, 2) DEFAULT 0.00,
    total_surface_m2 NUMERIC(10, 2),
    rooms INTEGER,
    bathrooms INTEGER,
    garages INTEGER DEFAULT 0,
    year_built INTEGER,
    building_condition VARCHAR(50) DEFAULT 'bueno',
    cadastral_number VARCHAR(50), -- Padrón catastral
    dedup_hash VARCHAR(64) UNIQUE,
    dedup_confidence NUMERIC(5, 2) DEFAULT 100.00,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ANUNCIOS Y LISTINGS DE PORTALES (N Listings -> 1 Master Property)
CREATE TABLE IF NOT EXISTS public.property_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    source_id UUID NOT NULL REFERENCES public.property_sources(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    price_usd_normalized NUMERIC(15, 2) NOT NULL,
    price_per_m2_usd NUMERIC(10, 2),
    publication_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'removed')),
    raw_data JSONB DEFAULT '{}'::jsonb,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT property_listings_source_external_unique UNIQUE (source_id, external_id)
);

-- 4. HISTORIAL DE PRECIOS POR LISTING Y MAESTRO
CREATE TABLE IF NOT EXISTS public.property_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    price_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(5) NOT NULL DEFAULT 'USD',
    price_usd_normalized NUMERIC(15, 2) NOT NULL,
    price_per_m2_usd NUMERIC(10, 2),
    previous_price_usd NUMERIC(15, 2),
    price_change_percentage NUMERIC(7, 2),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FOTOS CON HASHES DE DEDUPLICACIÓN VISUAL
CREATE TABLE IF NOT EXISTS public.property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.property_listings(id) ON DELETE CASCADE,
    master_id UUID REFERENCES public.property_master(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    phash VARCHAR(64), -- Perceptual image hash
    image_hash VARCHAR(64), -- Content/SHA hash for dedup
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CONFIGURACIÓN VERSIONADA DEL TASADOR IA (Parámetro del 12% preservado sin ejecutar)
CREATE TABLE IF NOT EXISTS public.appraisal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT false,
    safety_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00, -- Factor 12% configurable de resguardo/liquidación
    max_dedup_distance_meters INTEGER NOT NULL DEFAULT 100,
    similarity_threshold NUMERIC(5, 2) NOT NULL DEFAULT 85.00,
    min_comparables_count INTEGER NOT NULL DEFAULT 3,
    max_comparables_age_days INTEGER NOT NULL DEFAULT 180,
    outlier_std_dev_threshold NUMERIC(4, 2) NOT NULL DEFAULT 2.00,
    weights JSONB NOT NULL DEFAULT '{"surface": 0.40, "location": 0.30, "rooms": 0.15, "age": 0.15}'::jsonb,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES PARA OPTIMIZACIÓN DE BÚSQUEDA Y DEDUPLICACIÓN
CREATE INDEX IF NOT EXISTS idx_property_master_location ON public.property_master(department, city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_property_master_dedup_hash ON public.property_master(dedup_hash);
CREATE INDEX IF NOT EXISTS idx_property_listings_master ON public.property_listings(master_id);
CREATE INDEX IF NOT EXISTS idx_property_listings_status ON public.property_listings(status);
CREATE INDEX IF NOT EXISTS idx_property_price_history_listing ON public.property_price_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_price_history_master ON public.property_price_history(master_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_hashes ON public.property_photos(phash, image_hash);

-- TRIGGER PARA REGISTRO AUTOMÁTICO EN HISTORIAL DE PRECIOS
CREATE OR REPLACE FUNCTION public.fn_track_property_price_change()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_usd NUMERIC(15, 2);
    v_change_pct NUMERIC(7, 2);
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.property_price_history (
            listing_id, master_id, price_amount, currency, price_usd_normalized, price_per_m2_usd, previous_price_usd, price_change_percentage
        ) VALUES (
            NEW.id, NEW.master_id, NEW.price_amount, NEW.currency, NEW.price_usd_normalized, NEW.price_per_m2_usd, NULL, 0.00
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.price_usd_normalized IS DISTINCT FROM NEW.price_usd_normalized) THEN
        v_prev_usd := OLD.price_usd_normalized;
        IF (v_prev_usd > 0) THEN
            v_change_pct := ROUND(((NEW.price_usd_normalized - v_prev_usd) / v_prev_usd) * 100.00, 2);
        ELSE
            v_change_pct := 0.00;
        END IF;

        INSERT INTO public.property_price_history (
            listing_id, master_id, price_amount, currency, price_usd_normalized, price_per_m2_usd, previous_price_usd, price_change_percentage
        ) VALUES (
            NEW.id, NEW.master_id, NEW.price_amount, NEW.currency, NEW.price_usd_normalized, NEW.price_per_m2_usd, v_prev_usd, v_change_pct
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_track_property_price_change ON public.property_listings;
CREATE TRIGGER trg_track_property_price_change
AFTER INSERT OR UPDATE ON public.property_listings
FOR EACH ROW EXECUTE FUNCTION public.fn_track_property_price_change();

-- FUNCIÓN RPC: HASH DEDUPLICADOR DE PROPIEDAD
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
$$ LANGUAGE plpgsql IMMUTABLE;

-- FUNCIÓN RPC: OBTENER PARÁMETROS VIGENTES DE TASACIÓN
CREATE OR REPLACE FUNCTION public.get_active_appraisal_settings()
RETURNS SETOF public.appraisal_settings AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.appraisal_settings
    WHERE is_active = true
    ORDER BY version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- SEED DATA DE LOS TOP 20 PORTALES INMOBILIARIOS (SOLO CONFIGURACIÓN)
INSERT INTO public.property_sources (code, name, domain, country_code, is_active, rate_limit_per_minute, crawler_config)
VALUES
  ('infocasas', 'InfoCasas Uruguay', 'infocasas.com.uy', 'UY', true, 60, '{"scraper_type": "api", "selectors": {}}'::jsonb),
  ('mercadolibre_uy', 'MercadoLibre Inmuebles Uruguay', 'inmuebles.mercadolibre.com.uy', 'UY', true, 60, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('gallito_uy', 'Gallito Luis Inmuebles', 'gallito.com.uy', 'UY', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('casaseneleste_uy', 'Casas en el Este', 'casaseneleste.com.uy', 'UY', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('zonaprop_uy', 'ZonaProp Uruguay', 'zonaprop.com.uy', 'UY', true, 45, '{"scraper_type": "api", "selectors": {}}'::jsonb),
  ('properati_uy', 'Properati Uruguay', 'properati.com.uy', 'UY', true, 45, '{"scraper_type": "api", "selectors": {}}'::jsonb),
  ('remax_uy', 'RE/MAX Uruguay', 'remax.com.uy', 'UY', true, 40, '{"scraper_type": "api", "selectors": {}}'::jsonb),
  ('century21_uy', 'Century 21 Uruguay', 'century21.com.uy', 'UY', true, 40, '{"scraper_type": "api", "selectors": {}}'::jsonb),
  ('buscandocasa_uy', 'Buscandocasa', 'buscandocasa.com.uy', 'UY', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('argenprop', 'Argenprop Latam', 'argenprop.com', 'AR', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('inmuebles24', 'Inmuebles24 Regional', 'inmuebles24.com', 'MX', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('plusvalia', 'Plusvalia Latam', 'plusvalia.com', 'EC', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('sothebys_uy', 'Sothebys Realty Uruguay', 'sothebysrealty.com.uy', 'UY', true, 20, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('engel_volkers_uy', 'Engel & Völkers Uruguay', 'engelvoelkers.com.uy', 'UY', true, 20, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('tucasa_uy', 'TuCasa Uruguay', 'tucasa.com.uy', 'UY', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('portales_ar', 'Portales Inmobiliarios AR', 'portalesinmobiliarios.com.ar', 'AR', true, 30, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('clarin_inmuebles', 'Clarín Inmuebles', 'clarin.com/inmuebles', 'AR', true, 20, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('fincaraiz_latam', 'FincaRaíz Latam', 'fincaraiz.com.co', 'CO', true, 20, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('brio_uy', 'Brio Inmobiliaria', 'brio.com.uy', 'UY', true, 20, '{"scraper_type": "html", "selectors": {}}'::jsonb),
  ('caldeyro_uy', 'Caldeyro Victorica Bienes Raíces', 'caldeyro.com', 'UY', true, 20, '{"scraper_type": "html", "selectors": {}}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- SEED DATA DE CONFIGURACIÓN VERSIONADA V1 (Con el parámetro del 12.00% preservado)
INSERT INTO public.appraisal_settings (
    version, is_active, safety_margin_percentage, max_dedup_distance_meters, similarity_threshold, min_comparables_count, max_comparables_age_days, outlier_std_dev_threshold, weights, notes
) VALUES (
    1,
    true,
    12.00, -- 12% Parámetro configurable de margen de seguridad / liquidación rápida
    100,
    85.00,
    3,
    180,
    2.00,
    '{"surface": 0.40, "location": 0.30, "rooms": 0.15, "age": 0.15}'::jsonb,
    'Configuración Inicial Fase0 - Parámetro del 12% configurado sin ejecución.'
) ON CONFLICT (version) DO NOTHING;

-- RLS Y POLÍTICAS DE SEGURIDAD
ALTER TABLE public.property_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_settings ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: LECTURA PÚBLICA / USUARIOS AUTENTICADOS
CREATE POLICY "Allow read access to property_sources for authenticated users"
  ON public.property_sources FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow read access to property_master for authenticated users"
  ON public.property_master FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow read access to property_listings for authenticated users"
  ON public.property_listings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow read access to property_price_history for authenticated users"
  ON public.property_price_history FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow read access to property_photos for authenticated users"
  ON public.property_photos FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow read access to appraisal_settings for authenticated users"
  ON public.appraisal_settings FOR SELECT
  TO authenticated, anon
  USING (true);

-- POLÍTICAS: ESCRITURA PARA SERVICE_ROLE Y ADMINS
CREATE POLICY "Allow service_role full control on property_sources"
  ON public.property_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_master"
  ON public.property_master FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_listings"
  ON public.property_listings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_price_history"
  ON public.property_price_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full control on property_photos"
  ON public.property_photos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full control on appraisal_settings"
  ON public.appraisal_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- CONCEDER PERMISOS BÁSICOS A ROLES SUPABASE
GRANT SELECT ON public.property_sources TO authenticated, anon;
GRANT SELECT ON public.property_master TO authenticated, anon;
GRANT SELECT ON public.property_listings TO authenticated, anon;
GRANT SELECT ON public.property_price_history TO authenticated, anon;
GRANT SELECT ON public.property_photos TO authenticated, anon;
GRANT SELECT ON public.appraisal_settings TO authenticated, anon;

GRANT ALL ON public.property_sources TO service_role;
GRANT ALL ON public.property_master TO service_role;
GRANT ALL ON public.property_listings TO service_role;
GRANT ALL ON public.property_price_history TO service_role;
GRANT ALL ON public.property_photos TO service_role;
GRANT ALL ON public.appraisal_settings TO service_role;
