-- ==============================================================================
-- HIPOTECALY: Row Level Security (RLS) y Aislamiento Estricto Multi-Tenant
-- Migración 00002: Políticas de Autorización y Seguridad
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ACTIVACIÓN DE RLS EN TODAS LAS TABLAS
-- ------------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrower_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. FUNCIONES DE AYUDA DE AUTORIZACIÓN (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_borrower_id_for_user()
RETURNS UUID AS $$
DECLARE
    b_id UUID;
BEGIN
    SELECT id INTO b_id FROM borrowers WHERE user_id = auth.uid() LIMIT 1;
    RETURN b_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS: PROFILES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS: ORGANIZATIONS & BRANDING
-- ------------------------------------------------------------------------------
CREATE POLICY "Members or super admins can view their organization"
ON organizations FOR SELECT
TO authenticated
USING (public.is_member_of_org(id) OR public.is_super_admin());

CREATE POLICY "Public read for organization branding"
ON organization_branding FOR SELECT
TO anon, authenticated
USING (TRUE);

CREATE POLICY "Tenant admins can update their organization branding"
ON organization_branding FOR ALL
TO authenticated
USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

CREATE POLICY "Members can view their organization members"
ON organization_members FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS: BORROWERS & APPLICATIONS (AISLAMIENTO ESTRICTO)
-- ------------------------------------------------------------------------------
CREATE POLICY "Borrowers can view and edit their own borrower profile"
ON borrowers FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_member_of_org(organization_id) OR public.is_super_admin());

CREATE POLICY "Borrower sees only own applications; Tenant members see tenant apps"
ON applications FOR SELECT
TO authenticated
USING (
    borrower_id = public.get_borrower_id_for_user()
    OR public.is_member_of_org(organization_id)
    OR public.is_super_admin()
);

CREATE POLICY "Borrower can insert draft application"
ON applications FOR INSERT
TO authenticated
WITH CHECK (
    borrower_id = public.get_borrower_id_for_user()
    OR public.is_member_of_org(organization_id)
    OR public.is_super_admin()
);

CREATE POLICY "Borrower can update own draft application; Tenant staff can update"
ON applications FOR UPDATE
TO authenticated
USING (
    (borrower_id = public.get_borrower_id_for_user() AND status = 'draft')
    OR public.is_member_of_org(organization_id)
    OR public.is_super_admin()
);

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS: PROPERTIES & PHOTOS & DOCUMENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "Property access matches application access"
ON properties FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = properties.application_id
        AND (a.borrower_id = public.get_borrower_id_for_user()
             OR public.is_member_of_org(a.organization_id)
             OR public.is_super_admin())
    )
);

CREATE POLICY "Property photos access matches application"
ON property_photos FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM properties p
        JOIN applications a ON a.id = p.application_id
        WHERE p.id = property_photos.property_id
        AND (a.borrower_id = public.get_borrower_id_for_user()
             OR public.is_member_of_org(a.organization_id)
             OR public.is_super_admin())
    )
);

CREATE POLICY "Property documents strictly private"
ON property_documents FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM properties p
        JOIN applications a ON a.id = p.application_id
        WHERE p.id = property_documents.property_id
        AND (a.borrower_id = public.get_borrower_id_for_user()
             OR public.is_member_of_org(a.organization_id)
             OR public.is_super_admin())
    )
);

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS: LENDER RULES (SIMULADOR Y REGLAS ACTIVAS)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read for active lender rules"
ON lender_rules FOR SELECT
TO anon, authenticated
USING (active = TRUE);

CREATE POLICY "Tenant admins manage lender rules"
ON lender_rules FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM lenders l
        WHERE l.id = lender_rules.lender_id
        AND (public.is_member_of_org(l.organization_id) OR public.is_super_admin())
    )
);

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS: AUDIT LOGS & NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users read own notifications"
ON notifications FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Staff can view audit logs for their organization"
ON audit_logs FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id) OR public.is_super_admin());
