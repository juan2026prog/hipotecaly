# Guía Maestra de Migración: Supabase Local → Supabase Cloud

Esta guía detalla el procedimiento operativo estándar para transferir la base de datos, autenticación, almacenamiento de archivos, políticas RLS y configuraciones de **HIPOTECALY** desde el entorno de desarrollo local a **Supabase Cloud** (Producción).

---

## 1. Crear el Proyecto en Supabase Cloud
1. Iniciar sesión en [Supabase Dashboard](https://supabase.com/dashboard).
2. Seleccionar la Organización correspondiente (ej. `juan2026prog's Org`).
3. Hacer clic en **New Project**.
4. Nombre del proyecto: `HIPOTECALY`.
5. Asignar una contraseña segura y almacenarla de forma protegida en el gestor de contraseñas.
6. Seleccionar la región más cercana a Uruguay (ej. `sa-east-1` São Paulo o `us-east-1`).

---

## 2. Obtener Credenciales Públicas
En el Dashboard de Supabase, ir a **Project Settings** > **API**:
- **Project URL**: `https://<project-ref>.supabase.co`
- **anon / public key**: `eyJhbGciOiJIUz...`

> [!CAUTION]
> NUNCA exponer la clave `service_role` en el repositorio ni en variables que comiencen con `VITE_`.

---

## 3. Vincular Supabase CLI al Proyecto Cloud
Desde la terminal en la raíz del proyecto `c:\Projects\Hipotecaly`:

```bash
# Iniciar sesión en Supabase CLI con tu token de acceso personal
supabase login

# Vincular el repositorio local con el proyecto en la nube
supabase link --project-ref <project-ref>
```

---

## 4. Aplicar Migraciones Versionadas
Aplicar todo el esquema multi-tenant y las políticas de seguridad:

```bash
# Aplica todas las migraciones en orden cronológico
supabase db push
```

Verificar que todas las tablas y tipos hayan sido creados correctamente sin errores.

---

## 5. Crear y Configurar Buckets de Almacenamiento
En **Storage** de Supabase Cloud, asegurar la existencia y privacidad de los siguientes buckets:

1. **`property-photos`**:
   - Acceso: Público para lectura de miniaturas de marketing / Privado para fotos de expedientes confidenciales.
   - Restricciones: MIME types de imágenes (`image/jpeg`, `image/png`, `image/webp`), tamaño máximo 10MB.
2. **`application-documents`**:
   - Acceso: **ESTRICTAMENTE PRIVADO**.
   - Ningún documento debe poder descargarse sin una Signed URL generada bajo sesión autenticada con RLS.
   - Restricciones: MIME types (`application/pdf`, `image/jpeg`, `image/png`), tamaño máximo 15MB.
3. **`organization-assets`**:
   - Acceso: Público para logos y favicons institucionales.

---

## 6. Verificar y Aplicar Row Level Security (RLS)
Comprobar en **Table Editor** o ejecutando el script `00002_rls_policies.sql` que:
- RLS esté activado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) en las 23 tablas.
- La función de aislamiento por tenant (`is_tenant_member`, `is_platform_admin`) funcione correctamente.

---

## 7. Configuración de Supabase Auth
En **Authentication** > **URL Configuration**:
- **Site URL**: `https://hipotecaly.uy` (o URL de producción en Vercel).
- **Redirect URLs**:
  - `https://hipotecaly.uy/auth/callback`
  - `https://hipotecaly.uy/mi-cuenta`
  - `https://hipotecaly.uy/recuperar-password`
  - `https://*.vercel.app/auth/callback` (para Preview Deployments de Vercel).

En **Authentication** > **Providers**:
- Email habilitado.
- Confirmación de email activada o desactivada según el flujo definido para el piloto.

---

## 8. Configuración de Secrets en Supabase Edge Functions
Si se utilizan Edge Functions (por ejemplo, para el motor de matching o notificaciones):

```bash
supabase secrets set SENDGRID_API_KEY=xxx --project-ref <project-ref>
supabase secrets set WHATSAPP_API_KEY=xxx --project-ref <project-ref>
```

---

## 9. Despliegue de Edge Functions
```bash
supabase functions deploy match-application --project-ref <project-ref>
```

---

## 10. Configurar Variables de Entorno en Vercel
1. Ingresar al proyecto en **Vercel Dashboard** > **Settings** > **Environment Variables**.
2. Agregar:
   - `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<tu-anon-key>`
3. Asignar los entornos: **Production**, **Preview**, y **Development**.
4. Disparar un nuevo despliegue (Redeploy).

---

## 11. Batería de Pruebas de Seguridad y RLS
Ejecutar las siguientes verificaciones obligatorias antes de abrir el tráfico:

1. **Aislamiento Multi-Tenant**:
   - Crear una solicitud en Organización A.
   - Con la sesión de un analista de Organización B, verificar que la API devuelva 0 resultados (`HTTP 200` con array vacío) o `403 Forbidden`.
2. **Privacidad del Solicitante (Anti-Bypass)**:
   - Con la sesión de un prestamista, consultar el endpoint/tabla de oportunidades y verificar que los campos de datos personales (cédula, nombre, teléfono, padrón) no sean visibles.
3. **Storage Seguro**:
   - Intentar acceder a un archivo de `application-documents` mediante su URL directa sin token de firma. Debe responder `403 Forbidden` / `400 Invalid signature`.

---

## 12. Carga de Datos Iniciales (Seed Piloto)
Para inicializar la organización matriz HIPOTECALY y las reglas del prestamista piloto:

```bash
# Ejecutar el seed piloto sobre la base de producción
supabase db execute --file ./supabase/seed/pilot.sql --project-ref <project-ref>
```

> [!WARNING]
> NUNCA ejecutar `./supabase/seed/demo.sql` en el entorno de producción Cloud. Ese archivo está reservado exclusivamente para demostraciones locales y tests automatizados.
