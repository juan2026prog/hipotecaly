-- ==============================================================================
-- HIPOTECALY: Migración Macrofase 7.1 - Enterprise API, Webhooks & Billing Persistence
-- ==============================================================================

-- 1. Tabla de API Keys Seguras (Hashed CSPRNG, Scoped, Tenant-Isolated)
CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- ej. hpt_live_a1b2c3...
  key_hash VARCHAR(64) NOT NULL,   -- SHA-256 hash hex del secreto completo
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:simulations']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_hash ON tenant_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant ON tenant_api_keys(tenant_id);

-- 2. Tabla de Webhooks de Tenant
CREATE TABLE IF NOT EXISTS tenant_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['application.created']::TEXT[],
  secret_hash VARCHAR(64) NOT NULL, -- SHA-256 o secret encriptado
  signing_secret TEXT NOT NULL,     -- Secreto compartido para HMAC-SHA256
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhooks_tenant ON tenant_webhooks(tenant_id);

-- 3. Tabla de Auditoría y Entregas Reales de Webhooks
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES tenant_webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(100) NOT NULL,
  payload_summary TEXT,
  status_code INTEGER,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant ON webhook_deliveries(tenant_id);

-- 4. Configuración Fiscal y Facturación de Tenant (Sin supuestos tributarios inventados)
CREATE TABLE IF NOT EXISTS tenant_billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_status VARCHAR(50) NOT NULL DEFAULT 'NOT_CONFIGURED', -- NOT_CONFIGURED | EXEMPT | STANDARD
  tax_rate NUMERIC(5, 2) DEFAULT NULL,
  jurisdiction VARCHAR(50) DEFAULT 'UY',
  invoice_type VARCHAR(50) DEFAULT 'ELECTRONIC_INVOICE_PROVISIONAL',
  billing_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Facturas y Comprobantes Persistentes de Tenant
CREATE TABLE IF NOT EXISTS tenant_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending | paid | overdue | canceled
  plan_code VARCHAR(50) NOT NULL,
  subtotal_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_usd NUMERIC(12, 2) DEFAULT NULL, -- NULL si tax_status = NOT_CONFIGURED
  total_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer_manual',
  paid_at TIMESTAMPTZ,
  line_items JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invoices_tenant ON tenant_invoices(tenant_id);

-- 6. Row Level Security (RLS) Mandatorio
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento: los usuarios del tenant solo leen/escriben sus propios registros
CREATE POLICY tenant_api_keys_isolation ON tenant_api_keys
  FOR ALL
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

CREATE POLICY tenant_webhooks_isolation ON tenant_webhooks
  FOR ALL
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

CREATE POLICY webhook_deliveries_isolation ON webhook_deliveries
  FOR ALL
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

CREATE POLICY tenant_billing_settings_isolation ON tenant_billing_settings
  FOR ALL
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);

CREATE POLICY tenant_invoices_isolation ON tenant_invoices
  FOR ALL
  USING (tenant_id = (current_setting('app.current_tenant_id', true))::UUID)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::UUID);
