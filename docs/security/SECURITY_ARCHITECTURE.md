# ARQUITECTURA DE SEGURIDAD INTEGRAL — HIPOTECALY

> **Estado Técnico:** Operativo  
> **Ámbito de Aplicación:** Plataforma Fintech / Crédito Hipotecario Multi-Tenant  
> **Marcos de Referencia:** Ley N° 18.331 (Uruguay), Decreto 64/020, Marco de Ciberseguridad de AGESIC, OWASP ASVS v4.0, NIST Cybersecurity Framework, CIS Controls, principios de ISO/IEC 27001.

---

## 1. Visión General y Principio de Defensa en Profundidad

HIPOTECALY implementa un modelo de **Defensa en Profundidad (Defense-in-Depth)** estructurado en 6 capas independientes y complementarias:

`
[ Capa 1: Red y Tráfico Web (Vercel Edge, HSTS, CSP, Anti-SSRF, Rate Limiting) ]
                                      │
[ Capa 2: Control de Acceso Perimetral (Supabase Auth, JWT Verification) ]
                                      │
[ Capa 3: Lógica de Aplicación Serverless (Node.js Guards, Sanitization, Zod) ]
                                      │
[ Capa 4: Persistencia y Aislamiento RLS (PostgreSQL Deny-By-Default) ]
                                      │
[ Capa 5: Criptografía y Custodia de Secretos (Supabase Vault AEAD, CSPRNG) ]
                                      │
[ Capa 6: Auditoría Forense Inmutable (security_events & audit_logs) ]
`

---

## 2. Descripción de Capas de Seguridad

### Capa 1: Borde de Red y Cabeceras
- **Transport Security:** Forzado de HTTPS estricto mediante HSTS (max-age=63072000; includeSubDomains; preload).
- **Content-Security-Policy (CSP):** Restricción de orígenes para scripts, fuentes, conexiones (connect-src limitado a Supabase, OpenAI, Didit, Firma.gub).
- **Anti-Clickjacking:** X-Frame-Options: DENY y rame-ancestors 'none'.
- **Anti-MIME Sniffing:** X-Content-Type-Options: nosniff.
- **Rate Limiting:** Token-bucket serverless en memoria limitando peticiones abusivas (Auth: 10/min, AI: 30/min, Admin: 60/min, API v1: 120/min).

### Capa 2: Autenticación y Sesiones
- Tokens de sesión JWT criptográficamente firmados con clave simétrica/asimétrica.
- Manejo de Refresh Tokens con rotación automática y almacenamiento seguro.
- Control de expiración y revocación inmediata de sesiones.

### Capa 3: Autorización Server-Side
- Módulo server/security/authGuards.ts: equireAuth(), equireTenant(), equireRole(), equireApplicationAccess().
- Prohibición absoluta de confiar en atributos de rol, tenant_id o permisos enviados por el cliente.
- Sanitización de errores con safeError() para impedir fugas de esquemas SQL o stack traces.

### Capa 4: Row Level Security (RLS) en PostgreSQL
- Todas las tablas operativas (38 tablas) tienen RLS habilitado con directiva DENY BY DEFAULT.
- Políticas de aislamiento por 	enant_id y pertenencia a organización (is_member_of_org()).
- Inmutabilidad estricta en tablas de auditoría (udit_logs, security_events) bloqueando UPDATE y DELETE.

### Capa 5: Cifrado y Custodia
- Secretos de IA (OpenAI API Keys) cifrados mediante **Supabase Vault** (pgrx/pgsodium con AEAD).
- Hashes de API Keys generados mediante SHA-256 CSPRNG (crypto.randomBytes(32)).
- Documentos firmados e identificados por su hash criptográfico SHA-256 inmutable.

### Capa 6: Registro Inmutable y Forense
- Tabla public.security_events con severidades INFO, LOW, MEDIUM, HIGH, CRITICAL.
- Registro automático de accesos denegados, fallos de autenticación, mutaciones de roles y webhooks.

---

## 3. Declaración de Cumplimiento Técnico
HIPOTECALY aplica seguridad y privacidad desde el diseño, con controles técnicos alineados con buenas prácticas internacionales de seguridad como OWASP, NIST, CIS e ISO/IEC 27001, junto con principios del Marco de Ciberseguridad de AGESIC y la Ley 18.331 de la República Oriental del Uruguay.
