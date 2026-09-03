-- ==============================================================================
-- HIPOTECALY: Migración Fase SaaS Multi-Tenant Real, Módulos y Tenant Demo NOVA
-- ==============================================================================

-- 1. Ampliar tabla applications con columnas de origen y modalidad
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'source') THEN
    ALTER TABLE public.applications ADD COLUMN source VARCHAR(50) DEFAULT 'native_white_label';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'source_mode') THEN
    ALTER TABLE public.applications ADD COLUMN source_mode VARCHAR(50) DEFAULT 'full';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'repayment_mode') THEN
    ALTER TABLE public.applications ADD COLUMN repayment_mode VARCHAR(50) DEFAULT 'solo_intereses';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'raw_simulator_params') THEN
    ALTER TABLE public.applications ADD COLUMN raw_simulator_params JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 2. Tabla de Módulos / Feature Flags por Tenant
CREATE TABLE IF NOT EXISTS public.tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, module_key)
);

-- 3. Tabla de Reglas Crediticias Parametrizables por Tenant
CREATE TABLE IF NOT EXISTS public.tenant_lending_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  min_loan_amount NUMERIC(14,2) NOT NULL DEFAULT 10000.00,
  max_loan_amount NUMERIC(14,2) NOT NULL DEFAULT 250000.00,
  max_financed_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00, -- 50%
  min_term_months INT NOT NULL DEFAULT 12,
  max_term_months INT NOT NULL DEFAULT 60,
  available_terms INT[] NOT NULL DEFAULT '{12, 24, 36, 48, 60}',
  default_rate NUMERIC(5,2) NOT NULL DEFAULT 11.50,
  rate_type VARCHAR(50) NOT NULL DEFAULT 'anual_fija',
  repayment_modes TEXT[] NOT NULL DEFAULT '{solo_intereses, amortizable}',
  accepted_property_types TEXT[] NOT NULL DEFAULT '{vivienda, local_comercial, terreno, rural}',
  accepted_regions TEXT[] NOT NULL DEFAULT '{Montevideo, Canelones, Maldonado, Colonia, San Jose, Rocha, Todos}',
  early_cancellation_policy TEXT DEFAULT 'Cancelación anticipada permitida sin penalidad a partir del mes 6.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Configuración de Costos de Formalización por Tenant
CREATE TABLE IF NOT EXISTS public.tenant_cost_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cost_key VARCHAR(50) NOT NULL, -- 'notary', 'appraisal', 'certificates', 'registry', 'administrative', 'other', 'cancellation'
  cost_type VARCHAR(50) NOT NULL DEFAULT 'percentage', -- 'fixed', 'percentage', 'manual_estimate', 'disabled'
  fixed_amount NUMERIC(14,2) DEFAULT 0.00,
  percentage_rate NUMERIC(5,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, cost_key)
);

-- 5. Tabla de Reglas de Privacidad y Desbloqueo por Etapa
CREATE TABLE IF NOT EXISTS public.tenant_privacy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reveal_phone_at_status VARCHAR(50) NOT NULL DEFAULT 'approved',
  reveal_email_at_status VARCHAR(50) NOT NULL DEFAULT 'approved',
  allow_document_download_at_status VARCHAR(50) NOT NULL DEFAULT 'formalization',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_lending_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_cost_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_privacy_rules ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para resolución del frontend del tenant
CREATE POLICY "Public read for tenant modules" ON public.tenant_modules
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read for tenant lending rules" ON public.tenant_lending_rules
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read for tenant cost configurations" ON public.tenant_cost_configurations
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read for tenant privacy rules" ON public.tenant_privacy_rules
  FOR SELECT USING (TRUE);

-- Políticas de escritura para miembros del tenant o super admins
CREATE POLICY "Tenant admin manage modules" ON public.tenant_modules
  FOR ALL TO authenticated
  USING (public.is_member_of_org(tenant_id) OR public.is_super_admin());

CREATE POLICY "Tenant admin manage lending rules" ON public.tenant_lending_rules
  FOR ALL TO authenticated
  USING (public.is_member_of_org(tenant_id) OR public.is_super_admin());

CREATE POLICY "Tenant admin manage cost configurations" ON public.tenant_cost_configurations
  FOR ALL TO authenticated
  USING (public.is_member_of_org(tenant_id) OR public.is_super_admin());

CREATE POLICY "Tenant admin manage privacy rules" ON public.tenant_privacy_rules
  FOR ALL TO authenticated
  USING (public.is_member_of_org(tenant_id) OR public.is_super_admin());

-- ==============================================================================
-- 6. SEED: TENANT DEMO PERMANENTE "NOVA Crédito Hipotecario"
-- ==============================================================================

-- 6.1 Asegurar organización NOVA en organizations
INSERT INTO public.organizations (id, slug, name, legal_name, rut, status)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'nova-demo',
  'NOVA Crédito Hipotecario',
  'NOVA Inversiones Hipotecarias S.A.S.',
  '218888880015',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  slug = 'nova-demo',
  name = 'NOVA Crédito Hipotecario';

-- 6.2 Branding White-Label de NOVA
INSERT INTO public.organization_branding (
  organization_id,
  public_name,
  tag_line,
  primary_color,
  secondary_color,
  accent_color,
  support_email,
  support_phone,
  custom_domain
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'NOVA Crédito Hipotecario',
  'Soluciones financieras con respaldo inmobiliario.',
  '#0A3A60', -- Azul profundo corporativo
  '#16A184', -- Verde esmeralda de respaldo
  '#E0F2FE', -- Celeste suave
  'contacto@novacredito.uy',
  '+598 2916 4455',
  'demo.novacredito.uy'
) ON CONFLICT (organization_id) DO UPDATE SET
  public_name = EXCLUDED.public_name,
  tag_line = EXCLUDED.tag_line,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color;

-- 6.3 Dominio personalizado de NOVA
INSERT INTO public.organization_domains (
  organization_id,
  domain,
  is_primary,
  is_verified,
  ssl_status
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'demo.novacredito.uy',
  TRUE,
  TRUE,
  'active'
) ON CONFLICT (domain) DO NOTHING;

-- 6.4 Reglas Crediticias de NOVA Demo (50% max, 250k, 60m, solo_intereses + amortizable)
INSERT INTO public.tenant_lending_rules (
  tenant_id,
  min_loan_amount,
  max_loan_amount,
  max_financed_percentage,
  min_term_months,
  max_term_months,
  available_terms,
  default_rate,
  repayment_modes,
  accepted_property_types,
  early_cancellation_policy
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  15000.00,
  250000.00,
  50.00, -- 50% Porcentaje Financiado Máximo
  12,
  60,
  ARRAY[12, 24, 36, 48, 60],
  11.50,
  ARRAY['solo_intereses', 'amortizable'],
  ARRAY['vivienda', 'local_comercial', 'terreno', 'rural'],
  'Cancelación anticipada permitida sin penalidad tras 6 meses.'
) ON CONFLICT (tenant_id) DO UPDATE SET
  max_financed_percentage = EXCLUDED.max_financed_percentage,
  max_loan_amount = EXCLUDED.max_loan_amount,
  max_term_months = EXCLUDED.max_term_months;

-- 6.5 Configuración de Costos de Formalización de NOVA
INSERT INTO public.tenant_cost_configurations (tenant_id, cost_key, cost_type, fixed_amount, percentage_rate, notes)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'notary', 'percentage', 0.00, 2.50, 'Honorarios profesionales de escribano interviniente (2.5% est.)'),
  ('d0000000-0000-0000-0000-000000000001', 'appraisal', 'fixed', 450.00, 0.00, 'Tasación técnica y visita ocular del inmueble'),
  ('d0000000-0000-0000-0000-000000000001', 'certificates', 'fixed', 280.00, 0.00, 'Certificados registrales e información registral'),
  ('d0000000-0000-0000-0000-000000000001', 'registry', 'fixed', 150.00, 0.00, 'Tasa de inscripción de hipoteca en Registro de la Propiedad'),
  ('d0000000-0000-0000-0000-000000000001', 'administrative', 'percentage', 0.00, 1.00, 'Gastos de estructuración y apertura de legajo (1%)')
ON CONFLICT (tenant_id, cost_key) DO UPDATE SET
  cost_type = EXCLUDED.cost_type,
  fixed_amount = EXCLUDED.fixed_amount,
  percentage_rate = EXCLUDED.percentage_rate;

-- 6.6 Reglas de Privacidad de NOVA
INSERT INTO public.tenant_privacy_rules (
  tenant_id,
  reveal_phone_at_status,
  reveal_email_at_status,
  allow_document_download_at_status
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'approved',
  'approved',
  'formalization'
) ON CONFLICT (tenant_id) DO NOTHING;

-- 6.7 Módulos de NOVA (todos los 16 módulos activos)
INSERT INTO public.tenant_modules (tenant_id, module_key, enabled)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'application_module_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'simulator_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'client_portal_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'staff_portal_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'documents_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'ai_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'valuations_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'signatures_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'servicing_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'payments_tracking_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'reminders_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'cancellations_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'notifications_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'protected_contact_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'cost_breakdown_enabled', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'external_simulator_integration_enabled', TRUE)
ON CONFLICT (tenant_id, module_key) DO UPDATE SET enabled = EXCLUDED.enabled;
