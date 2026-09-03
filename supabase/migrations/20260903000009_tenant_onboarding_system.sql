-- ==============================================================================
-- HIPOTECALY: Migración Fase SaaS Multi-Tenant - Sistema de Onboarding Real,
-- Plantillas de Tenant, Auditoría y Versionado de Configuración
-- ==============================================================================

-- 1. Versionado de Esquema de Configuración y Modo Demo en organizations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'config_schema_version') THEN
    ALTER TABLE public.organizations ADD COLUMN config_schema_version INT NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'demo_mode') THEN
    ALTER TABLE public.organizations ADD COLUMN demo_mode BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'commercial_name') THEN
    ALTER TABLE public.organizations ADD COLUMN commercial_name VARCHAR(150);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'country') THEN
    ALTER TABLE public.organizations ADD COLUMN country VARCHAR(10) DEFAULT 'UY';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'timezone') THEN
    ALTER TABLE public.organizations ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/Montevideo';
  END IF;
END $$;

-- Marcar tenant demo NOVA explícitamente con demo_mode = true
UPDATE public.organizations 
SET demo_mode = TRUE 
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- 2. Tabla de Plantillas de Tenant Reutilizables (Sin marcas ni datos ficticios)
CREATE TABLE IF NOT EXISTS public.tenant_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  implementation_type VARCHAR(50) NOT NULL, -- 'basic', 'complete', 'whitelabel'
  modules_config JSONB NOT NULL,
  default_rules JSONB NOT NULL,
  ui_defaults JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Estado de Onboarding Post-Venta
CREATE TABLE IF NOT EXISTS public.tenant_onboarding_status (
  tenant_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  step_company_data BOOLEAN NOT NULL DEFAULT FALSE,
  step_branding BOOLEAN NOT NULL DEFAULT FALSE,
  step_rules BOOLEAN NOT NULL DEFAULT FALSE,
  step_modules BOOLEAN NOT NULL DEFAULT FALSE,
  step_costs BOOLEAN NOT NULL DEFAULT FALSE,
  step_users BOOLEAN NOT NULL DEFAULT FALSE,
  step_domain BOOLEAN NOT NULL DEFAULT FALSE,
  step_privacy BOOLEAN NOT NULL DEFAULT FALSE,
  step_qa BOOLEAN NOT NULL DEFAULT FALSE,
  overall_status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'configuration', 'testing', 'ready', 'active', 'suspended'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Registro Inmutable de Auditoría de Operaciones de Tenant
CREATE TABLE IF NOT EXISTS public.tenant_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID, -- NULL si es del sistema o Super Admin
  action VARCHAR(80) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RLS en Nuevas Tablas
ALTER TABLE public.tenant_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_onboarding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de plantillas de tenant"
  ON public.tenant_templates FOR SELECT
  USING (true);

CREATE POLICY "Acceso a estado de onboarding por organización o super admin"
  ON public.tenant_onboarding_status FOR ALL
  USING (
    tenant_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin')
    ) OR (auth.jwt() ->> 'role') = 'service_role' OR public.is_super_admin()
  );

CREATE POLICY "Acceso a logs de auditoría por organización o super admin"
  ON public.tenant_audit_logs FOR ALL
  USING (
    tenant_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin')
    ) OR (auth.jwt() ->> 'role') = 'service_role' OR public.is_super_admin()
  );

-- 6. Semilla de Plantillas Oficiales de Arquitectura
INSERT INTO public.tenant_templates (code, name, description, implementation_type, modules_config, default_rules, ui_defaults)
VALUES
(
  'integration_basic',
  'Integración Básica',
  'Para clientes con sitio web existente que solo requieren botón de solicitud, checklist y recepción hacia legajo.',
  'basic',
  '{
    "application_module_enabled": true,
    "documents_enabled": true,
    "external_simulator_integration_enabled": true,
    "simulator_enabled": false,
    "client_portal_enabled": false,
    "staff_portal_enabled": false,
    "ai_enabled": false,
    "valuations_enabled": false,
    "signatures_enabled": false,
    "servicing_enabled": false,
    "payments_tracking_enabled": false,
    "reminders_enabled": false,
    "cancellations_enabled": false,
    "notifications_enabled": false,
    "protected_contact_enabled": false,
    "cost_breakdown_enabled": false
  }'::jsonb,
  '{
    "min_loan_amount": 10000,
    "max_loan_amount": 250000,
    "max_financed_percentage": 50,
    "min_term_months": 12,
    "max_term_months": 60,
    "default_rate": 12.0
  }'::jsonb,
  '{
    "primary_color": "#0B8A5A",
    "secondary_color": "#0F1E36"
  }'::jsonb
),
(
  'integration_complete',
  'Integración Completa',
  'Conecta la web existente del cliente con el portal del prestatario y backoffice operativo completo.',
  'complete',
  '{
    "application_module_enabled": true,
    "client_portal_enabled": true,
    "staff_portal_enabled": true,
    "documents_enabled": true,
    "notifications_enabled": true,
    "external_simulator_integration_enabled": true,
    "protected_contact_enabled": true,
    "simulator_enabled": false,
    "ai_enabled": false,
    "valuations_enabled": false,
    "signatures_enabled": false,
    "servicing_enabled": false,
    "payments_tracking_enabled": false,
    "reminders_enabled": false,
    "cancellations_enabled": false,
    "cost_breakdown_enabled": false
  }'::jsonb,
  '{
    "min_loan_amount": 10000,
    "max_loan_amount": 250000,
    "max_financed_percentage": 50,
    "min_term_months": 12,
    "max_term_months": 60,
    "default_rate": 11.5
  }'::jsonb,
  '{
    "primary_color": "#0A3A60",
    "secondary_color": "#16A184"
  }'::jsonb
),
(
  'full_whitelabel',
  'Full White-Label Llave en Mano',
  'Ecosistema digital 100% bajo la marca del cliente: sitio institucional, simulador en tiempo real, legajo, portal cliente, backoffice, copiloto IA y seguimiento de cartera.',
  'whitelabel',
  '{
    "simulator_enabled": true,
    "application_module_enabled": true,
    "client_portal_enabled": true,
    "staff_portal_enabled": true,
    "documents_enabled": true,
    "ai_enabled": true,
    "valuations_enabled": true,
    "signatures_enabled": true,
    "servicing_enabled": true,
    "payments_tracking_enabled": true,
    "reminders_enabled": true,
    "cancellations_enabled": true,
    "notifications_enabled": true,
    "protected_contact_enabled": true,
    "cost_breakdown_enabled": true,
    "external_simulator_integration_enabled": false
  }'::jsonb,
  '{
    "min_loan_amount": 10000,
    "max_loan_amount": 250000,
    "max_financed_percentage": 50,
    "min_term_months": 12,
    "max_term_months": 60,
    "default_rate": 11.5
  }'::jsonb,
  '{
    "primary_color": "#0B8A5A",
    "secondary_color": "#0F1E36"
  }'::jsonb
)
ON CONFLICT (code) DO NOTHING;
