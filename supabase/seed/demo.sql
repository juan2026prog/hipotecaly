-- ==============================================================================
-- HIPOTECALY: Seed DEMO (Datos Ficticios Separados para Pruebas y Entornos Demo)
-- NUNCA EJECUTAR EN PRODUCCIÓN
-- ==============================================================================

-- 1. Organización Demo
INSERT INTO organizations (id, name, slug, organization_type, status)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'Estudio Inmobiliario Demo',
    'estudio-demo',
    'estudio',
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Solicitudes Demo (Marcadas con prefijo HIP-DEMO-)
INSERT INTO applications (
    id,
    public_id,
    organization_id,
    status,
    requested_amount,
    currency,
    term_months,
    purpose,
    notes
) VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'HIP-DEMO-00124',
    'd0000000-0000-0000-0000-000000000001',
    'info_review',
    80000.00,
    'USD',
    36,
    'Refacción integral de vivienda y consolidación',
    'Solicitante dependiente con ingresos comprobables'
), (
    'e0000000-0000-0000-0000-000000000002',
    'HIP-DEMO-00125',
    'd0000000-0000-0000-0000-000000000001',
    'property_analysis',
    120000.00,
    'USD',
    48,
    'Expansión comercial para local',
    'Apartamento en Pocitos libre de gravámenes'
), (
    'e0000000-0000-0000-0000-000000000003',
    'HIP-DEMO-00126',
    'd0000000-0000-0000-0000-000000000001',
    'offer_available',
    70000.00,
    'USD',
    24,
    'Capital de trabajo para empresa',
    'Propuesta emitida por prestamista piloto'
) ON CONFLICT (public_id) DO NOTHING;

-- 3. Propiedades Demo Asociadas
INSERT INTO properties (
    id,
    application_id,
    property_type,
    department,
    city,
    neighborhood,
    estimated_value,
    legal_status
) VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'casa',
    'Montevideo',
    'Montevideo',
    'Carrasco',
    240000.00,
    'libre_gravamenes'
), (
    'f0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000002',
    'apartamento',
    'Montevideo',
    'Montevideo',
    'Pocitos',
    310000.00,
    'libre_gravamenes'
), (
    'f0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000003',
    'local_comercial',
    'Canelones',
    'Ciudad de la Costa',
    'Solymar',
    195000.00,
    'libre_gravamenes'
) ON CONFLICT (id) DO NOTHING;
