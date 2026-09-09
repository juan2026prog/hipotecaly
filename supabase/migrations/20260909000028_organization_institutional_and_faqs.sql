-- ==============================================================================
-- HIPOTECALY MIGRATION: 20260909000028_organization_institutional_and_faqs.sql
-- Ampliación de campos institucionales, secciones dinámicas de Home y tabla de FAQs
-- ==============================================================================

-- 1. EXTENDER organization_branding CON DATOS INSTITUCIONALES COMPARTIDOS
ALTER TABLE public.organization_branding
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'Montevideo, Uruguay',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Montevideo',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Uruguay',
  ADD COLUMN IF NOT EXISTS business_hours TEXT DEFAULT 'Lun a Vie 09:00 – 18:00 hs',
  ADD COLUMN IF NOT EXISTS social_instagram TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_linkedin TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_description TEXT DEFAULT 'Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.';

-- 2. EXTENDER organization_home_settings CON SECCIONES CENTRALES CONFIGURABLES
ALTER TABLE public.organization_home_settings
  ADD COLUMN IF NOT EXISTS property_types_eyebrow TEXT DEFAULT 'GARANTÍAS INMOBILIARIAS',
  ADD COLUMN IF NOT EXISTS property_types_title TEXT DEFAULT 'Inmuebles admitidos para estructuración',
  ADD COLUMN IF NOT EXISTS property_types_description TEXT DEFAULT 'Analizamos operaciones respaldadas por diversos tipos de activos con títulos en regla y tasación técnica.',
  ADD COLUMN IF NOT EXISTS property_types_items JSONB DEFAULT '[
    {
      "id": "viviendas",
      "icon": "HomeIcon",
      "title": "Viviendas",
      "description": "Propiedades residenciales utilizadas como garantía: casas urbanas, apartamentos en propiedad horizontal y chalets.",
      "bullets": ["Zonas consolidadas de todo el país", "Evaluación según estado y metraje"],
      "visible": true
    },
    {
      "id": "locales",
      "icon": "Building",
      "title": "Locales comerciales",
      "description": "Inmuebles comerciales, oficinas céntricas, depósitos industriales y unidades aptas para renta u operativa comercial.",
      "bullets": ["Puntos comerciales estratégicos", "Análisis de flujo y tasación comercial"],
      "visible": true
    },
    {
      "id": "campos",
      "icon": "Trees",
      "title": "Campos",
      "description": "Propiedades rurales, chacras productivas y fracciones de campo con potencial productivo o de inversión.",
      "bullets": ["Índice CONEAT y aptitud del suelo", "Estudio de antecedentes dominiales"],
      "visible": true
    }
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS how_it_works_eyebrow TEXT DEFAULT 'PASO A PASO',
  ADD COLUMN IF NOT EXISTS how_it_works_title TEXT DEFAULT 'Cómo funciona el proceso',
  ADD COLUMN IF NOT EXISTS how_it_works_description TEXT DEFAULT 'Cuatro etapas ordenadas desde la primera simulación hasta la recepción de la propuesta definitiva.',
  ADD COLUMN IF NOT EXISTS how_it_works_steps JSONB DEFAULT '[
    {
      "step": 1,
      "title": "Simulá",
      "description": "Ingresá el valor del inmueble y el monto necesario para conocer las cuotas y plazos de referencia.",
      "visible": true
    },
    {
      "step": 2,
      "title": "Completá tu solicitud",
      "description": "Cargá los datos del bien y la documentación básica en tu expediente digital protegido.",
      "visible": true
    },
    {
      "step": 3,
      "title": "Evaluamos",
      "description": "Realizamos el análisis pericial de tasación y el estudio notarial preliminar del título.",
      "visible": true
    },
    {
      "step": 4,
      "title": "Recibí la propuesta",
      "description": "Te presentamos las condiciones formales para coordinar la firma notarial y formalización.",
      "visible": true
    }
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS operation_eyebrow TEXT DEFAULT 'UNA OPERACIÓN, TODO ORDENADO',
  ADD COLUMN IF NOT EXISTS operation_title TEXT DEFAULT 'Información clara desde el primer paso.',
  ADD COLUMN IF NOT EXISTS operation_description TEXT DEFAULT 'Estructuramos cada operación para que solicitantes, profesionales y escribanos cuenten con un flujo predecible y documentado.',
  ADD COLUMN IF NOT EXISTS operation_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
  ADD COLUMN IF NOT EXISTS operation_features JSONB DEFAULT '[
    {
      "icon": "FileSpreadsheet",
      "title": "Evaluación preliminar de la propiedad",
      "description": "Cotejo de valores de mercado y análisis de relación préstamo/garantía."
    },
    {
      "icon": "FileText",
      "title": "Documentación en un único expediente",
      "description": "Títulos, planos, certificados y recibos organizados digitalmente."
    },
    {
      "icon": "Layers",
      "title": "Seguimiento de estados",
      "description": "Visualización del avance de cada etapa sin incertidumbre ni llamados innecesarios."
    },
    {
      "icon": "FileCheck2",
      "title": "Proceso preparado para validaciones y firma",
      "description": "Coordinación notarial lista para la confección de escrituras e inscripciones."
    }
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS investor_eyebrow TEXT DEFAULT 'ÁREA DE INVERSIÓN',
  ADD COLUMN IF NOT EXISTS investor_title TEXT DEFAULT 'Capital respaldado por activos reales.',
  ADD COLUMN IF NOT EXISTS investor_description TEXT DEFAULT 'Estructuración de operaciones de financiamiento con garantía hipotecaria formalizada en Uruguay.',
  ADD COLUMN IF NOT EXISTS investor_cta_text TEXT DEFAULT 'Acceder al Panel Inversor',
  ADD COLUMN IF NOT EXISTS investor_cards JSONB DEFAULT '[
    {
      "tag": "GARANTÍA",
      "title": "Inmueble identificado",
      "description": "Cada operación cuenta con una propiedad raíz determinada con títulos verificados por escribano."
    },
    {
      "tag": "VALUACIÓN",
      "title": "Análisis de respaldo",
      "description": "Peritaje técnico para asegurar una adecuada relación entre el capital financiado y el activo."
    },
    {
      "tag": "EXPEDIENTE",
      "title": "Información estructurada",
      "description": "Legajo completo con antecedentes del solicitante, certificados registrales y condiciones."
    },
    {
      "tag": "SEGUIMIENTO",
      "title": "Proceso documentado",
      "description": "Trazabilidad notarial y contractual continua a lo largo de toda la vigencia de la operación."
    }
  ]'::jsonb;

-- 3. TABLA DE PREGUNTAS FRECUENTES (FAQS) POR ORGANIZACIÓN
CREATE TABLE IF NOT EXISTS public.organization_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.organization_faqs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para organization_faqs
DROP POLICY IF EXISTS "Public read active organization faqs" ON public.organization_faqs;
CREATE POLICY "Public read active organization faqs"
  ON public.organization_faqs
  FOR SELECT
  TO public, anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Org admins manage organization faqs" ON public.organization_faqs;
CREATE POLICY "Org admins manage organization faqs"
  ON public.organization_faqs
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
        AND organization_id = public.organization_faqs.organization_id
        AND role IN ('tenant_admin', 'tenant_owner')
        AND is_active = TRUE
    )
  )
  WITH CHECK (
    public.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
        AND organization_id = public.organization_faqs.organization_id
        AND role IN ('tenant_admin', 'tenant_owner')
        AND is_active = TRUE
    )
  );

-- 4. SEED DE FAQS INICIALES DE ESTUDIO NOVA
INSERT INTO public.organization_faqs (organization_id, question, answer, sort_order, is_active)
SELECT 
  'd0000000-0000-0000-0000-000000000001',
  faq.question,
  faq.answer,
  faq.sort_order,
  TRUE
FROM (
  VALUES 
    (1, '¿Qué porcentaje del inmueble se puede financiar?', 'Como referencia inicial hasta el {maxFinancedPercentage}%, sujeto a la evaluación técnica del inmueble y capacidad de pago.'),
    (2, '¿Qué propiedades pueden utilizarse como garantía?', 'Viviendas, locales comerciales y campos situados en el territorio nacional con títulos en condiciones de escrituración.'),
    (3, '¿Puedo iniciar una solicitud si estoy en Clearing?', 'Sí. El Clearing no bloquea automáticamente el inicio de la evaluación; se analiza el contexto global de la operación y el activo de garantía.'),
    (4, '¿Qué documentación de ingresos se solicita?', 'Recibo de sueldo o certificado de contador según corresponda a la actividad del solicitante (dependiente o independiente).'),
    (5, '¿Cómo funciona el proceso para inversionistas?', 'Presentación de la operación estructurada, tasación de la garantía y antecedentes legales para su debido análisis previo.')
) AS faq(sort_order, question, answer)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_faqs WHERE organization_id = 'd0000000-0000-0000-0000-000000000001'
);

-- Actualizar branding institucional de Estudio Nova en Supabase
UPDATE public.organization_branding
SET 
  support_phone = '+598 2916 4455',
  support_email = 'contacto@estudionova.uy',
  address = 'Montevideo, Uruguay',
  business_hours = 'Lun a Vie 09:00 – 18:00 hs',
  footer_description = 'Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.'
WHERE organization_id = 'd0000000-0000-0000-0000-000000000001';
