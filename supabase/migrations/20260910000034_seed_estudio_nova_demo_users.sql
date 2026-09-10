-- ==============================================================================
-- HIPOTECALY: Migración 00034 - Seed Oficial de 5 Usuarios Demo para Estudio Nova
-- ==============================================================================

DO $$
DECLARE
  v_org_id UUID := 'd0000000-0000-0000-0000-000000000001';
  v_admin_id UUID := 'u0000000-0000-0000-0000-000000000001';
  v_op_id UUID    := 'u0000000-0000-0000-0000-000000000002';
  v_cli_id UUID   := 'u0000000-0000-0000-0000-000000000003';
  v_inv_id UUID   := 'u0000000-0000-0000-0000-000000000004';
  v_esc_id UUID   := 'u0000000-0000-0000-0000-000000000005';
BEGIN
  -- 1. Asegurar organización Estudio Nova
  INSERT INTO public.organizations (id, slug, name, legal_name, status, created_at)
  VALUES (v_org_id, 'estudio-nova', 'Estudio Nova', 'Estudio Nova S.A.', 'active', NOW())
  ON CONFLICT (id) DO UPDATE SET status = 'active';

  -- 2. Asegurar Perfiles en public.profiles
  INSERT INTO public.profiles (id, email, first_name, last_name, role, is_super_admin, updated_at)
  VALUES
    (v_admin_id, 'admin@estudionova.uy', 'Administrador', 'Estudio Nova', 'tenant_admin', FALSE, NOW()),
    (v_op_id,    'operador@estudionova.uy', 'Operador', 'Estudio Nova', 'analyst', FALSE, NOW()),
    (v_cli_id,   'cliente@estudionova.uy', 'Cliente', 'Estudio Nova', 'borrower', FALSE, NOW()),
    (v_inv_id,   'inversor@estudionova.uy', 'Inversor', 'Estudio Nova', 'lender', FALSE, NOW()),
    (v_esc_id,   'escribano@estudionova.uy', 'Escribano', 'Estudio Nova', 'notary', FALSE, NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, role = EXCLUDED.role, is_super_admin = FALSE;

  -- 3. Membresías en public.organization_members
  INSERT INTO public.organization_members (organization_id, user_id, email, role, status, is_active, created_at)
  VALUES
    (v_org_id, v_admin_id, 'admin@estudionova.uy', 'tenant_admin', 'active', TRUE, NOW()),
    (v_org_id, v_op_id,    'operador@estudionova.uy', 'analyst', 'active', TRUE, NOW()),
    (v_org_id, v_esc_id,   'escribano@estudionova.uy', 'notary', 'active', TRUE, NOW())
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET role = EXCLUDED.role, status = 'active', is_active = TRUE;

  -- 4. Perfil Borrower y Solicitud Demo para Cliente
  INSERT INTO public.borrowers (id, user_id, organization_id, email, first_name, last_name, id_type, id_number, phone, status, kyc_status, created_at)
  VALUES (v_cli_id, v_cli_id, v_org_id, 'cliente@estudionova.uy', 'Cliente', 'Estudio Nova', 'CI', '1.234.567-8', '+598 99 123 456', 'verified', 'verified', NOW())
  ON CONFLICT (user_id) DO UPDATE SET status = 'verified', kyc_status = 'verified';

  INSERT INTO public.applications (
    id, organization_id, borrower_id, public_id, status, requested_amount, currency, property_address, estimated_property_value, ltv_percentage, term_months, created_at
  ) VALUES (
    'app-demo-cliente-nova-001', v_org_id, v_cli_id, 'APP-NOVA-2026-001', 'under_review', 120000, 'USD', 'Av. Brasil 2840, Apt 502, Pocitos, Montevideo', 180000, 66.6, 180, NOW()
  ) ON CONFLICT (id) DO UPDATE SET status = 'under_review';

  -- 5. Perfil Lender para Inversor
  INSERT INTO public.lenders (id, user_id, organization_id, email, name, investor_type, status, min_ticket_usd, max_ticket_usd, created_at)
  VALUES (v_inv_id, v_inv_id, v_org_id, 'inversor@estudionova.uy', 'Inversor Demo Estudio Nova', 'private', 'active', 25000, 500000, NOW())
  ON CONFLICT (user_id) DO UPDATE SET status = 'active';

END $$;
