-- ==============================================================================
-- HIPOTECALY: Migración de Hardening RLS para SaaS Multi-Tenant y Privacidad
-- ==============================================================================

-- 1. Permitir lectura pública de organizaciones activas para resolución de marca white-label
DROP POLICY IF EXISTS "Public read for active organizations resolution" ON public.organizations;
CREATE POLICY "Public read for active organizations resolution"
  ON public.organizations FOR SELECT
  USING (status = 'active');

-- 2. Proteger reglas de privacidad para que solo los miembros del tenant o super admin puedan leerlas
DROP POLICY IF EXISTS "Public read for tenant privacy rules" ON public.tenant_privacy_rules;
DROP POLICY IF EXISTS "Tenant members can read tenant privacy rules" ON public.tenant_privacy_rules;
CREATE POLICY "Tenant members can read tenant privacy rules"
  ON public.tenant_privacy_rules FOR SELECT TO authenticated
  USING (public.is_member_of_org(tenant_id) OR public.is_super_admin());
