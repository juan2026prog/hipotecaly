# HIPOTECALY — Postura de Seguridad, Arquitectura RLS y Blindaje de Producción

## 1. Principio Rector de Seguridad

El sistema HIPOTECALY opera bajo el principio de **Privilegio Mínimo (Least Privilege)** y **Defensa en Profundidad**. La base de datos PostgreSQL/Supabase es la **única fuente autoritativa de verdad**. El frontend y los clientes móviles son tratados como entornos inherentemente no confiables.

Bajo ninguna circunstancia se admiten:
- Tokens o credenciales `service_role` en el frontend o código cliente.
- Variables que expongan secretos mediante `NEXT_PUBLIC` o `VITE_`.
- Archivos `.env`, respaldos, volcados SQL o logs en repositorios de Git.
- Bypass de intermediación que permita a prestamistas contactar directamente a prestatarios sin consentimiento formal.

---

## 2. Arquitectura de Row Level Security (RLS)

Todas las tablas del sistema tienen RLS activado (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`).

### 2.1 Aislamiento de Prestatarios (Borrower Isolation)
- `borrowers`: Los prestatarios únicamente pueden leer y modificar su propio registro mediante la política `id = auth.uid()`.
- `applications`: Los prestatarios solo consultan expedientes donde `borrower_id = auth.uid()`.
- `properties`: Los prestatarios solo acceden a inmuebles asociados a sus solicitudes.
- `property_documents` & `borrower_documents`: Los prestatarios solo acceden a metadatos de sus propios archivos.

### 2.2 Aislamiento Multi-Tenant (Tenant Isolation)
- Operadores, analistas y escribanos pertenecen a organizaciones específicas.
- Las consultas operativas filtran mediante funciones de seguridad con búsqueda de ruta explícita: `organization_id = get_auth_organization_id()`.
- Un operador de la Organización A no puede visualizar, editar ni inferir expedientes de la Organización B.

### 2.3 Blindaje Anti-Bypass para Prestamistas
- Los prestamistas **NUNCA** reciben inicialmente datos de contacto, nombre completo, cédula, dirección exacta, número de puerta ni padrón catastral del solicitante.
- Las consultas del prestamista se realizan a través de la vista segura `anonymized_opportunities_view` o tablas con RLS estricto (`status NOT IN ('matched', 'review_pending') AND lender_id = auth_lender_id()`).
- Los documentos originales en Storage (`application-documents` y `property-photos`) son 100% privados. Las URLs firmadas solo se emiten con tiempo de expiración corto (60 segundos) tras autorización expresa.

### 2.4 Controlled Data Disclosure (Revelación Controlada)
- La aceptación de una oferta económica **NO** desencadena revelación automática de datos.
- La revelación requiere una acción explícita registrada en la tabla `data_disclosures`, especificando categorías autorizadas (`contact`, `exact_address`, `property_documents`), motivo legal y usuario aprobador.
- Toda autorización queda registrada en `audit_logs`.

---

## 3. Inmutabilidad Criptográfica de Auditoría (`audit_logs`)

La tabla `audit_logs` es append-only:
- Se revocaron todos los permisos de `UPDATE` y `DELETE` (`REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC, anon, authenticated;`).
- Se implementó el trigger `prevent_audit_logs_tampering()` que aborta cualquier intento de modificación o borrado con excepción `RAISE EXCEPTION`.

---

## 4. Hardening de Storage y Signed URLs

- Los buckets `property-photos` y `application-documents` son estrictamente privados (`public = FALSE`).
- La descarga directa no autenticada devuelve `403 Forbidden`.
- Las carpetas internas siguen la convención `documents/<application_id>/<file_id>`.

---

## 5. Headers de Seguridad en Producción (`vercel.json`)

Se configuran cabeceras HTTP de grado bancario:
- `Content-Security-Policy`: Restringe scripts, conexiones y fuentes a orígenes verificados.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=()`

---

## 6. Blindaje de PWA y Cache de Service Worker

La configuración de Workbox (`vite.config.ts`) excluye explícitamente cualquier endpoint de API, autenticación, storage o rutas privadas:
- `NetworkOnly` para `/rest/v1/*`, `/auth/v1/*`, `/storage/v1/*`, `/app/*`, `/mi-cuenta/*`, `/lender/*`.
- Cero almacenamiento en caché de respuestas con información crediticia o datos personales de prestatarios.
