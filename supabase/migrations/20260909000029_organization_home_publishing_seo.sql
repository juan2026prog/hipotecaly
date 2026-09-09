-- ==============================================================================
-- HIPOTECALY: Migración Fase 6 — Publicación, SEO y Versionado de Home
-- ==============================================================================

-- 1. Agregar campos de estado de publicación, snapshot y SEO a organization_home_settings
ALTER TABLE public.organization_home_settings
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS published_by UUID,
  ADD COLUMN IF NOT EXISTS published_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS has_unpublished_changes BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS seo_canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT;

-- Comentarios explicativos
COMMENT ON COLUMN public.organization_home_settings.status IS 'Estado actual del registro: draft o published';
COMMENT ON COLUMN public.organization_home_settings.version_number IS 'Número de versión publicada activa';
COMMENT ON COLUMN public.organization_home_settings.published_snapshot IS 'Snapshot inmutable de la configuración actualmente visible para el público general';
COMMENT ON COLUMN public.organization_home_settings.has_unpublished_changes IS 'Indica si existen modificaciones guardadas en borrador pendientes de publicar';

-- 2. Crear tabla de historial inmutable de versiones de la Home
CREATE TABLE IF NOT EXISTS public.organization_home_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label VARCHAR(100) NOT NULL,
  changelog_notes TEXT,
  author_name VARCHAR(255) NOT NULL DEFAULT 'Admin',
  author_id UUID,
  snapshot JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_home_version UNIQUE (organization_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_org_home_versions_org_id ON public.organization_home_versions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_home_versions_active ON public.organization_home_versions(organization_id, is_active);

-- 3. Habilitar RLS en organization_home_versions
ALTER TABLE public.organization_home_versions ENABLE ROW LEVEL SECURITY;

-- Política de lectura para miembros de la organización
DROP POLICY IF EXISTS "Org members view home versions" ON public.organization_home_versions;
CREATE POLICY "Org members view home versions"
  ON public.organization_home_versions
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = organization_home_versions.organization_id
        AND organization_members.is_active = true
    )
  );

-- Política de escritura (crear o actualizar versiones) restringida a tenant_admin, tenant_owner y super_admin
DROP POLICY IF EXISTS "Org admins manage home versions" ON public.organization_home_versions;
CREATE POLICY "Org admins manage home versions"
  ON public.organization_home_versions
  FOR ALL
  TO authenticated
  USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = organization_home_versions.organization_id
        AND organization_members.role IN ('tenant_admin'::tenant_role, 'tenant_owner'::tenant_role)
        AND organization_members.is_active = true
    )
  )
  WITH CHECK (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = organization_home_versions.organization_id
        AND organization_members.role IN ('tenant_admin'::tenant_role, 'tenant_owner'::tenant_role)
        AND organization_members.is_active = true
    )
  );

-- 4. Inicializar published_snapshot y versión 1 inicial para Estudio Nova si no existe
DO $$
DECLARE
  v_org_id UUID := 'd0000000-0000-0000-0000-000000000001';
  v_settings RECORD;
  v_snapshot JSONB;
BEGIN
  -- Obtener registro actual de Estudio Nova
  SELECT * INTO v_settings FROM public.organization_home_settings WHERE organization_id = v_org_id;

  IF FOUND THEN
    -- Construir snapshot base
    v_snapshot := jsonb_build_object(
      'heroEyebrow', v_settings.hero_eyebrow,
      'heroTitle', v_settings.hero_title,
      'heroDescription', v_settings.hero_description,
      'heroPrimaryCtaText', v_settings.hero_primary_cta_text,
      'heroPrimaryCtaTarget', v_settings.hero_primary_cta_target,
      'heroPrimaryCtaVisible', v_settings.hero_primary_cta_visible,
      'heroSecondaryCtaText', v_settings.hero_secondary_cta_text,
      'heroSecondaryCtaTarget', v_settings.hero_secondary_cta_target,
      'heroSecondaryCtaVisible', v_settings.hero_secondary_cta_visible,
      'heroTrustLine', v_settings.hero_trust_line,
      'heroBackgroundMode', v_settings.hero_background_mode,
      'heroBackgroundColor', v_settings.hero_background_color,
      'heroBackgroundImageUrl', v_settings.hero_background_image_url,
      'heroOverlayColor', v_settings.hero_overlay_color,
      'heroOverlayOpacity', v_settings.hero_overlay_opacity,
      'heroImagePosition', v_settings.hero_image_position,
      'heroPatternEnabled', v_settings.hero_pattern_enabled,
      'showMetrics', v_settings.show_metrics,
      'showPropertyTypes', v_settings.show_property_types,
      'showSimulator', v_settings.show_simulator,
      'showHowItWorks', v_settings.show_how_it_works,
      'showOperationSection', v_settings.show_operation_section,
      'showInvestorSection', v_settings.show_investor_section,
      'showFaq', v_settings.show_faq,
      'showContact', v_settings.show_contact,
      'propertyTypesEyebrow', v_settings.property_types_eyebrow,
      'propertyTypesTitle', v_settings.property_types_title,
      'propertyTypesDescription', v_settings.property_types_description,
      'propertyTypesItems', v_settings.property_types_items,
      'howItWorksEyebrow', v_settings.how_it_works_eyebrow,
      'howItWorksTitle', v_settings.how_it_works_title,
      'howItWorksDescription', v_settings.how_it_works_description,
      'howItWorksSteps', v_settings.how_it_works_steps,
      'operationEyebrow', v_settings.operation_eyebrow,
      'operationTitle', v_settings.operation_title,
      'operationDescription', v_settings.operation_description,
      'operationImageUrl', v_settings.operation_image_url,
      'operationFeatures', v_settings.operation_features,
      'investorEyebrow', v_settings.investor_eyebrow,
      'investorTitle', v_settings.investor_title,
      'investorDescription', v_settings.investor_description,
      'investorCtaText', v_settings.investor_cta_text,
      'investorCards', v_settings.investor_cards,
      'seoTitle', 'Estudio Nova — Financiación & Inversión Hipotecaria en Uruguay',
      'seoDescription', 'Estructuración de operaciones de crédito con respaldo en activos inmobiliarios en Uruguay. Evaluación ágil y formalización notarial.',
      'seoOgImageUrl', v_settings.hero_background_image_url,
      'seoCanonicalUrl', 'https://hipotecaly.vercel.app/demo/estudio-nova',
      'seoKeywords', 'créditos hipotecarios uruguay, préstamos con garantía hipotecaria montevideo, estudio nova, financiamiento inmobiliario'
    );

    -- Actualizar settings con el snapshot y valores SEO iniciales
    UPDATE public.organization_home_settings
    SET
      status = 'published',
      version_number = 1,
      published_at = now(),
      published_snapshot = v_snapshot,
      has_unpublished_changes = false,
      seo_title = 'Estudio Nova — Financiación & Inversión Hipotecaria en Uruguay',
      seo_description = 'Estructuración de operaciones de crédito con respaldo en activos inmobiliarios en Uruguay. Evaluación ágil y formalización notarial.',
      seo_og_image_url = v_settings.hero_background_image_url,
      seo_canonical_url = 'https://hipotecaly.vercel.app/demo/estudio-nova',
      seo_keywords = 'créditos hipotecarios uruguay, préstamos con garantía hipotecaria montevideo, estudio nova, financiamiento inmobiliario'
    WHERE organization_id = v_org_id;

    -- Insertar versión 1 en el historial si no existe
    INSERT INTO public.organization_home_versions (
      organization_id,
      version_number,
      version_label,
      changelog_notes,
      author_name,
      snapshot,
      published_at,
      is_active
    )
    VALUES (
      v_org_id,
      1,
      'Versión 1.0 — Configuración Inicial Aprobada',
      'Versión canónica aprobada de Estudio Nova con diseño Golden Master y secciones dinámicas conectadas.',
      'Sistema Hipotecaly',
      v_snapshot,
      now(),
      true
    )
    ON CONFLICT (organization_id, version_number) DO NOTHING;
  END IF;
END $$;
