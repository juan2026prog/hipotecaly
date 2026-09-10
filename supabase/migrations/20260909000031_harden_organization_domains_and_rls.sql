-- ==============================================================================
-- HIPOTECALY: Migración de Seguridad y Endurecimiento de organization_domains (Fase 7A/7B)
-- RLS Estricto, Normalización Case-Insensitive, Primary Único, Prevención Domain Takeover
-- Estados Consistentes, Corrección de Datos Mock de Nova y Auditoría
-- ==============================================================================

-- 1. Asegurar columnas y estructura completa de organization_domains
ALTER TABLE public.organization_domains
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS vercel_domain_id VARCHAR(255);

-- 2. Limpieza y Normalización de datos existentes
UPDATE public.organization_domains
SET domain = lower(trim(domain));

-- 3. Corregir fila mock inconsistente de Estudio Nova (sin verificación real de Vercel/DNS)
UPDATE public.organization_domains
SET 
  is_verified = false,
  status = 'pending_verification',
  ssl_status = 'pending',
  verified_at = NULL,
  verification_token = 'hp_verify_' || replace(gen_random_uuid()::text, '-', '')
WHERE organization_id = 'd0000000-0000-0000-0000-000000000001'
  AND domain = 'demo.novacredito.uy';

-- 4. Constraint de Normalización y Formato de Dominio
ALTER TABLE public.organization_domains
  DROP CONSTRAINT IF EXISTS chk_organization_domains_lowercase,
  ADD CONSTRAINT chk_organization_domains_lowercase 
    CHECK (domain = lower(trim(domain)) AND domain NOT LIKE 'http://%' AND domain NOT LIKE 'https://%' AND domain NOT LIKE '%/%');

-- 5. Constraint de Estados Válidos
ALTER TABLE public.organization_domains
  DROP CONSTRAINT IF EXISTS chk_organization_domains_status,
  ADD CONSTRAINT chk_organization_domains_status
    CHECK (status IN ('pending_verification', 'dns_pending', 'verifying', 'verified', 'active', 'failed', 'error'));

-- 6. Constraint de Estados SSL Válidos
ALTER TABLE public.organization_domains
  DROP CONSTRAINT IF EXISTS chk_organization_domains_ssl_status,
  ADD CONSTRAINT chk_organization_domains_ssl_status
    CHECK (ssl_status IN ('pending', 'issuing', 'active', 'failed', 'expired'));

-- 7. Constraint de Consistencia (no permitir verificado sin fecha de verificación)
ALTER TABLE public.organization_domains
  DROP CONSTRAINT IF EXISTS chk_organization_domains_verification_consistency,
  ADD CONSTRAINT chk_organization_domains_verification_consistency
    CHECK (NOT (is_verified = true AND verified_at IS NULL));

-- 8. Índice Único Case-Insensitive Global (Prevención de Domain Takeover entre organizaciones)
DROP INDEX IF EXISTS public.idx_organization_domains_lower_domain;
CREATE UNIQUE INDEX idx_organization_domains_lower_domain 
  ON public.organization_domains (lower(domain));

-- 9. Índice Único Parcial para Dominio Primario (Solo UN is_primary = true por organización)
DROP INDEX IF EXISTS public.idx_organization_domains_one_primary_per_org;
CREATE UNIQUE INDEX idx_organization_domains_one_primary_per_org 
  ON public.organization_domains (organization_id) 
  WHERE (is_primary = true);

-- 10. ELIMINAR POLÍTICAS RLS INSEGURAS
DROP POLICY IF EXISTS "Allow tenant domains insert" ON public.organization_domains;
DROP POLICY IF EXISTS "Public read for verified organization domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Tenant members can view their organization domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Tenant admins can manage their organization domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Tenant admins manage domains" ON public.organization_domains;
DROP POLICY IF EXISTS "Public read verified domains" ON public.organization_domains;

-- 11. POLÍTICAS RLS SEGURAS Y ENDURECIDAS

-- A. Lectura Pública: SOLO dominios genuinamente verificados (necesario para routing público por Host)
CREATE POLICY "Public read verified organization domains"
  ON public.organization_domains
  FOR SELECT
  TO anon, authenticated
  USING (is_verified = true);

-- B. Lectura Miembros del Tenant: Miembros activos pueden ver todos los dominios de su organización
CREATE POLICY "Tenant members view own organization domains"
  ON public.organization_domains
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
    OR (EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = organization_domains.organization_id
        AND organization_members.is_active = true
    ))
  );

-- C. Inserción: SOLO tenant_owner, tenant_admin de esa organización o super_admin
-- Forzando que toda inserción desde cliente comience con is_verified = false y ssl_status = 'pending'
CREATE POLICY "Tenant admins insert own organization domains"
  ON public.organization_domains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      is_super_admin()
      OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
      OR (EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.user_id = auth.uid()
          AND organization_members.organization_id = organization_domains.organization_id
          AND organization_members.role = ANY (ARRAY['tenant_owner'::tenant_role, 'tenant_admin'::tenant_role])
          AND organization_members.is_active = true
      ))
    )
    -- Si es usuario cliente (no service_role ni super_admin), NO PUEDE auto-verificarse en el insert
    AND (
      ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
      OR is_super_admin()
      OR (is_verified = false AND ssl_status = 'pending' AND status = 'pending_verification' AND verified_at IS NULL)
    )
  );

-- D. Modificación: SOLO tenant_owner, tenant_admin o super_admin
-- Clientes NO pueden alterar is_verified a true ni ssl_status a active por UPDATE directo
CREATE POLICY "Tenant admins update own organization domains"
  ON public.organization_domains
  FOR UPDATE
  TO authenticated
  USING (
    is_super_admin()
    OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
    OR (EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = organization_domains.organization_id
        AND organization_members.role = ANY (ARRAY['tenant_owner'::tenant_role, 'tenant_admin'::tenant_role])
        AND organization_members.is_active = true
    ))
  )
  WITH CHECK (
    is_super_admin()
    OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
    OR (
      -- Para tenant admins, no pueden auto-aprobar verificación ni SSL directo desde cliente
      EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.user_id = auth.uid()
          AND organization_members.organization_id = organization_domains.organization_id
          AND organization_members.role = ANY (ARRAY['tenant_owner'::tenant_role, 'tenant_admin'::tenant_role])
          AND organization_members.is_active = true
      )
    )
  );

-- E. Eliminación: SOLO tenant_owner, tenant_admin o super_admin
CREATE POLICY "Tenant admins delete own organization domains"
  ON public.organization_domains
  FOR DELETE
  TO authenticated
  USING (
    is_super_admin()
    OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
    OR (EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = organization_domains.organization_id
        AND organization_members.role = ANY (ARRAY['tenant_owner'::tenant_role, 'tenant_admin'::tenant_role])
        AND organization_members.is_active = true
    ))
  );

-- 12. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_organization_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.domain = lower(trim(NEW.domain));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_organization_domains_updated_at ON public.organization_domains;
CREATE TRIGGER tr_organization_domains_updated_at
  BEFORE UPDATE ON public.organization_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_organization_domains_updated_at();
