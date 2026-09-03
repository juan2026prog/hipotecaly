-- ==============================================================================
-- HIPOTECALY: Migración Fase 5 - SaaS Multi-Tenant & White Label
-- ==============================================================================

-- 1. Tabla de Planes SaaS
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  monthly_price_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_applications INTEGER NOT NULL DEFAULT 50,
  max_users INTEGER NOT NULL DEFAULT 5,
  allows_custom_domain BOOLEAN NOT NULL DEFAULT FALSE,
  allows_white_label BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Asegurar campos en organizations si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'slug') THEN
    ALTER TABLE organizations ADD COLUMN slug VARCHAR(100) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'rut') THEN
    ALTER TABLE organizations ADD COLUMN rut VARCHAR(30);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'status') THEN
    ALTER TABLE organizations ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- 3. Tabla de Suscripciones
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Branding White Label
CREATE TABLE IF NOT EXISTS organization_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  public_name VARCHAR(150) NOT NULL,
  tag_line VARCHAR(255),
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(20) NOT NULL DEFAULT '#0B8A5A',
  secondary_color VARCHAR(20) NOT NULL DEFAULT '#0F1E36',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Dominios Personalizados
CREATE TABLE IF NOT EXISTS organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain VARCHAR(255) UNIQUE NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(100),
  ssl_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Miembros e Invitaciones de Organización
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'analyst',
  token VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Configuración de Organización
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  allow_borrower_portal BOOLEAN NOT NULL DEFAULT TRUE,
  default_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  sender_name VARCHAR(100) DEFAULT 'Hipotecaly Notificaciones',
  sender_email VARCHAR(255) DEFAULT 'notificaciones@hipotecaly.uy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS en tablas Fase 5
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública para resolución de branding y dominios
CREATE POLICY "Public read for active plans" ON plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read for tenant branding resolution" ON organization_branding
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read for verified organization domains" ON organization_domains
  FOR SELECT USING (is_verified = TRUE);

-- Acceso tenant isolated para miembros
CREATE POLICY "Members read their organization subscriptions" ON organization_subscriptions
  FOR SELECT TO authenticated
  USING (organization_id = get_auth_organization_id());

CREATE POLICY "Members read their organization invitations" ON organization_invitations
  FOR ALL TO authenticated
  USING (organization_id = get_auth_organization_id());

CREATE POLICY "Members manage their organization branding" ON organization_branding
  FOR ALL TO authenticated
  USING (organization_id = get_auth_organization_id());

CREATE POLICY "Members manage their organization settings" ON organization_settings
  FOR ALL TO authenticated
  USING (organization_id = get_auth_organization_id());

-- Inserción de Planes Estándar
INSERT INTO plans (id, code, name, description, monthly_price_usd, max_applications, max_users, allows_custom_domain, allows_white_label)
VALUES 
  ('p0000000-0000-0000-0000-000000000001', 'starter', 'Starter', 'Para tasadores independientes y pequeños estudios notariales', 99.00, 20, 2, FALSE, FALSE),
  ('p0000000-0000-0000-0000-000000000002', 'pro', 'Professional', 'Para estudios inmobiliarios, jurídicos y mesas de crédito', 249.00, 100, 10, TRUE, TRUE),
  ('p0000000-0000-0000-0000-000000000003', 'enterprise', 'Enterprise White-Label', 'Para fondos de inversión, financieras e instituciones', 599.00, 500, 50, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Inserción de Tenant Piloto en organizations
INSERT INTO organizations (id, slug, name, legal_name, rut, status)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'hipotecaly', 'Hipotecaly Central', 'Hipotecaly Tech S.A.S.', '219999990014', 'active')
ON CONFLICT (id) DO UPDATE SET slug = 'hipotecaly';

-- Branding para Hipotecaly Central
INSERT INTO organization_branding (organization_id, public_name, tag_line, primary_color, secondary_color)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'HIPOTECALY', 'Préstamos con Garantía Hipotecaria en Uruguay', '#0B8A5A', '#0F1E36')
ON CONFLICT (organization_id) DO NOTHING;
