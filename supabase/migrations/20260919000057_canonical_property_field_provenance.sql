-- ==============================================================================
-- MIGRACIÓN 20260919000057: Extensión de Propiedad Canónica y Provenance Granular
-- Soporta separación de Padrón / Padrón Matriz, Físico vs Catastral y Provenance
-- ==============================================================================

-- 1. EXTENSIÓN NO DESTRUCTIVA DE LA TABLA PROPERTIES
ALTER TABLE public.properties
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
    ADD COLUMN IF NOT EXISTS built_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS land_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS uncovered_surface_m2 NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS field_provenance JSONB DEFAULT '{}'::jsonb;

-- 2. MIGRAR DATOS EXISTENTES DE cadastral_number -> padron SI APLICA
UPDATE public.properties
SET padron = cadastral_number
WHERE padron IS NULL AND cadastral_number IS NOT NULL AND cadastral_number <> '';

-- 3. ÍNDICES DE CONSULTA CATASTRAL
CREATE INDEX IF NOT EXISTS idx_properties_padron ON public.properties(padron);
CREATE INDEX IF NOT EXISTS idx_properties_parent_padron ON public.properties(parent_padron);
CREATE INDEX IF NOT EXISTS idx_properties_cadastral_regime ON public.properties(cadastral_regime);
