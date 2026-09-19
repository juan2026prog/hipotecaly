-- ==============================================================================
-- HIPOTECALY DOCFLOW: Ciclo de Vida de Plantillas, Trazabilidad e Inmutabilidad
-- Migración 00056: Soporte para Retiro de Plantillas, Snapshots Inmutables y Anulaciones
-- ==============================================================================

-- 1. ACTUALIZAR ENUMS (si se usan tipos ENUM en Postgres)
DO $$ BEGIN
    -- Agregar valor 'retired' a template_status_enum si existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_status_enum') THEN
        ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'retired';
    END IF;

    -- Agregar valor 'voided' a document_status_enum si existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status_enum') THEN
        ALTER TYPE document_status_enum ADD VALUE IF NOT EXISTS 'voided';
    END IF;
END $$;

-- 2. EXTENSIONES EN TABLA document_templates
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'usage_count') THEN
        ALTER TABLE public.document_templates ADD COLUMN usage_count INT NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. EXTENSIONES EN TABLA generated_documents (Snapshots Inmutables y Anulación)
DO $$ BEGIN
    -- Snapshot de HTML completo para reproducibilidad garantizada e independiente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'content_html') THEN
        ALTER TABLE public.generated_documents ADD COLUMN content_html TEXT;
    END IF;

    -- Datos de anulación / voiding con trazabilidad legal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'void_reason') THEN
        ALTER TABLE public.generated_documents ADD COLUMN void_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'voided_at') THEN
        ALTER TABLE public.generated_documents ADD COLUMN voided_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'replaces_document_id') THEN
        ALTER TABLE public.generated_documents ADD COLUMN replaces_document_id UUID REFERENCES public.generated_documents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. ÍNDICES DE AUDITORÍA Y TRAZABILIDAD
CREATE INDEX IF NOT EXISTS idx_gen_docs_replaces ON public.generated_documents(replaces_document_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_template_version ON public.generated_documents(template_id, template_version);
CREATE INDEX IF NOT EXISTS idx_doc_tpl_slug_version ON public.document_templates(slug, version);

-- 5. FUNCTION & TRIGGER: Sincronización automática de contador de uso de plantillas
CREATE OR REPLACE FUNCTION public.sync_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.document_templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.template_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.document_templates
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE id = OLD.template_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_template_usage ON public.generated_documents;
CREATE TRIGGER trg_sync_template_usage
    AFTER INSERT OR DELETE ON public.generated_documents
    FOR EACH ROW
    WHEN (NEW.template_id IS NOT NULL OR OLD.template_id IS NOT NULL)
    EXECUTE FUNCTION public.sync_template_usage_count();
