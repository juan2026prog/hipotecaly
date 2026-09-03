# HIPOTECALY — Guía de Migración a Supabase Cloud y Despliegue en Vercel

Este documento detalla el procedimiento estándar y seguro para transicionar el entorno desde **Supabase Local (CLI)** hacia **Supabase Cloud**, manteniendo intacta toda la arquitectura, RLS y datos estructurales.

---

## 1. Requisitos Previos

1. Cuenta activa en [supabase.com](https://supabase.com).
2. Proyecto creado en la región más cercana a Uruguay (`sa-east-1` São Paulo para menor latencia).
3. Supabase CLI autenticado localmente: `supabase login`.
4. Proyecto vinculado: `supabase link --project-ref <PROJECT_ID>`.

---

## 2. Ejecución de Migraciones en Supabase Cloud

Todas las migraciones desarrolladas y certificadas en las Fases 1 a 5 se encuentran versionadas en `supabase/migrations/`:

- `20260902000001_initial_schema.sql` (Schema Core, tablas y RLS base)
- `20260902000002_fix_rls_recursion.sql` (Corrección de recursión infinita en funciones de autenticación)
- `20260902000003_security_hardening.sql` (Hardening de Security Definer, auditoría inmutable y buckets privados)
- `20260902000004_fase4_marketplace_matching.sql` (Motor de matching, scoring, oportunidades, ofertas y anti-bypass)
- `20260902000005_fase5_saas_multitenant.sql` (Multi-tenancy, planes, suscripciones y branding white-label)

### Comando de Aplicación:
```bash
supabase db push
```

Este comando aplicará en orden determinístico cada archivo SQL en la base de datos de producción.

---

## 3. Configuración de Buckets de Storage en Supabase Cloud

Asegurarse de que los dos buckets existan y sean **estrictamente privados**:

```sql
-- Verificar estado de buckets
SELECT id, name, public FROM storage.buckets;

-- Asegurar privacidad
UPDATE storage.buckets SET public = FALSE WHERE id IN ('property-photos', 'application-documents');
```

---

## 4. Configuración de Variables de Entorno en Vercel

En el panel de Vercel (**Project Settings > Environment Variables**):

| Variable | Valor / Descripción | Entornos |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<PROJECT_ID>.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Clave Pública Anónima (`anon` key) de Supabase Cloud | Production, Preview, Development |

> ⚠️ **REGLA ESTRICTA DE SEGURIDAD:**
> **NUNCA** configurar `SUPABASE_SERVICE_ROLE_KEY` como variable `VITE_` ni exponerla al cliente.
> Si se despliegan Edge Functions, las claves de servicio viven únicamente en el backend seguro de Supabase.

---

## 5. Despliegue en Vercel

1. Vincular el repositorio de GitHub con Vercel.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Los headers de seguridad, compresión y soporte PWA se aplicarán automáticamente desde `vercel.json`.

---

## 6. Verificación Post-Despliegue

1. Ejecutar la suite de pruebas completa apuntando al entorno productivo:
   ```bash
   VITE_SUPABASE_URL=https://<PROJECT_ID>.supabase.co VITE_SUPABASE_ANON_KEY=<ANON_KEY> npx playwright test
   ```
2. Validar que los certificados SSL y el manifest PWA se carguen correctamente.
3. Verificar que 0 datos de prestatarios sean visibles a prestamistas sin autorización explícita.
