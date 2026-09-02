-- ==============================================================================
-- HIPOTECALY: Seed Piloto (Configuración Inicial de Producción / Piloto Real)
-- ==============================================================================

-- 1. Organización Matriz HIPOTECALY
INSERT INTO organizations (id, name, slug, organization_type, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'HIPOTECALY',
    'hipotecaly',
    'hipotecaly',
    'active'
) ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, organization_type = EXCLUDED.organization_type;

-- 2. Branding Oficial de la Plataforma HIPOTECALY
INSERT INTO organization_branding (
    organization_id,
    company_name,
    public_name,
    primary_color,
    secondary_color,
    accent_color,
    support_email,
    hide_hipotecaly_branding
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'HIPOTECALY S.A.',
    'HIPOTECALY',
    '#071A35',
    '#2DA674',
    '#E9F6F0',
    'contacto@hipotecaly.uy',
    FALSE
) ON CONFLICT (organization_id) DO UPDATE
SET primary_color = EXCLUDED.primary_color, secondary_color = EXCLUDED.secondary_color;

-- 3. Prestamista Piloto Inicial (Registrado bajo HIPOTECALY)
INSERT INTO lenders (
    id,
    organization_id,
    internal_name,
    legal_name,
    contact_name,
    contact_email,
    status,
    notes
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Fondo Privado Piloto Uruguay',
    'Financiación Hipotecaria Piloto S.A.S.',
    'Mesa de Créditos',
    'operaciones@hipotecaly.uy',
    'active',
    'Prestamista inicial para el piloto en Uruguay'
) ON CONFLICT (id) DO NOTHING;

-- 4. Reglas del Prestamista Piloto (Motor de Elegibilidad Inicial)
-- LTV Máximo: 40%
-- Préstamo Máximo: USD 200.000 (Mínimo USD 10.000)
-- Plazo Máximo: 5 años (60 meses)
-- Admite Clearing: Sí
-- Inmuebles: Casa, Apartamento, Local comercial, Terreno, Campo
-- Cobertura: Uruguay
INSERT INTO lender_rules (
    id,
    lender_id,
    max_ltv,
    min_loan,
    max_loan,
    min_term_months,
    max_term_months,
    accepts_clearing,
    accepted_property_types,
    accepted_departments,
    accepted_currencies,
    income_requirements,
    active
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    40.00,
    10000.00,
    200000.00,
    12,
    60,
    TRUE,
    '{casa,apartamento,local_comercial,terreno,campo}',
    '{Montevideo,Canelones,Maldonado,Colonia,San Jose,Rocha,Todos}',
    '{USD}',
    'Recibo de sueldo o certificado de ingresos emitido por contador público',
    TRUE
) ON CONFLICT (id) DO NOTHING;
