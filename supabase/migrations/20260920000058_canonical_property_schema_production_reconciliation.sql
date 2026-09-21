-- ==============================================================================
-- MIGRACIÓN 20260920000058: Reconciliación de Propiedad Canónica en Producción
-- Agrega columnas físicas, catastrales, superficies granulares, garages y provenance
-- Idempotente (ADD COLUMN IF NOT EXISTS), no destructivo, sin pérdida de datos.
-- ==============================================================================

-- 1. EXTENSIÓN IDEMPOTENTE DE COLUMNAS EN PUBLIC.PROPERTIES
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS street_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS street_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS padron VARCHAR(100),
    ADD COLUMN IF NOT EXISTS parent_padron VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cadastral_regime VARCHAR(50) DEFAULT 'UNKNOWN',
    ADD COLUMN IF NOT EXISTS legal_regime_details TEXT,
    ADD COLUMN IF NOT EXISTS unit_or_apartment VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tower_or_building VARCHAR(50),
    ADD COLUMN IF NOT EXISTS floor VARCHAR(20),
    ADD COLUMN IF NOT EXISTS cadastral_unit VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cadastral_block VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cadastral_level VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cadastral_section VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cadastral_locality VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cadastral_manzana VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cadastral_solar VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cadastral_plan VARCHAR(100),
    ADD COLUMN IF NOT EXISTS total_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS built_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS covered_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS land_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS uncovered_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS garages INTEGER,
    ADD COLUMN IF NOT EXISTS legal_status_notes TEXT,
    ADD COLUMN IF NOT EXISTS field_provenance JSONB DEFAULT '{}'::jsonb;

-- 2. MIGRAR DATOS EXISTENTES DE CADASTRAL_NUMBER -> PADRON (SOLO SI PADRON ES NULL)
UPDATE public.properties
SET padron = cadastral_number
WHERE padron IS NULL AND cadastral_number IS NOT NULL AND cadastral_number <> '';

-- 3. ÍNDICES DE CONSULTA Y OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_properties_padron ON public.properties(padron);
CREATE INDEX IF NOT EXISTS idx_properties_parent_padron ON public.properties(parent_padron);
CREATE INDEX IF NOT EXISTS idx_properties_cadastral_regime ON public.properties(cadastral_regime);
CREATE INDEX IF NOT EXISTS idx_properties_field_provenance ON public.properties USING gin (field_provenance);
