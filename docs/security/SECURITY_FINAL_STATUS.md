# HIPOTECALY SECURITY — ESTADO FINAL Y CIERRE DEFINITIVO

**Fecha de Cierre:** 8 de Septiembre de 2026  
**Versión de Seguridad:** 3.0 (Pass 1, Pass 2 y Pass 3 Completadas)  
**Estado Operativo:** MODO MANTENIMIENTO (MAINTENANCE MODE)  
**Costo en Servicios de Seguridad Adicionales:** $0.00 USD  

---

## 1. Declaración de Estado y Alcance

HIPOTECALY ha completado de forma integral su ciclo interno de endurecimiento de seguridad (*Security Hardening*) estructurado en 3 pasadas progresivas:
1. **PASS 1:** Hardening de base, Row Level Security (RLS) en PostgreSQL, protección multi-tenant por `organization_id`, auditoría inmutable en base de datos y desinfección de APIs.
2. **PASS 2:** Auditoría adversarial Red Team, mitigación estricta de SSRF (bloqueo CIDR privado/loopback y DNS rebind), Storage RLS con verificación MIME/mágica, revocación de privilegios `PUBLIC` y confinamiento de `service_role`.
3. **PASS 3:** Forzado de MFA con nivel AAL2 para operaciones y roles privilegiados, política de reautenticación crítica por antigüedad de sesión, validación determinística de recuperación de base de datos, estrategia y verificación criptográfica de Storage (SHA-256), rate limiting en Edge/Memoria, escaneo de supply chain y CI Security automatizado.

> **Descripción Comercial y Técnica Oficial:**  
> *“HIPOTECALY es una plataforma diseñada con seguridad y privacidad desde el diseño, utilizando controles técnicos de nivel financiero y buenas prácticas alineadas con OWASP, NIST, CIS, ISO/IEC 27001 y el Marco de Ciberseguridad de AGESIC.”*  
> *“Arquitectura de seguridad de nivel fintech.”*

---

## 2. Matriz de Arquitectura de Seguridad Implementada

| Dominio | Control Técnico Implementado | Mecanismo de Defensa |
| :--- | :--- | :--- |
| **Autenticación** | Supabase Auth + JWT | Validación estricta en servidor, expiración controlada y revocación de sesión. |
| **MFA (AAL2)** | TOTP de 6 dígitos vía Supabase | AAL2 exigido obligatoriamente para `super_admin`, `tenant_owner`, `tenant_admin`, `notary`, `bank_admin` y operaciones críticas. |
| **Reautenticación** | Time-based step-up authentication | Operaciones destructivas y cambios de seguridad exigen confirmación si la sesión tiene >15 min. |
| **Control de Acceso (RLS)** | PostgreSQL Row Level Security | Todas las tablas sensibles auditadas actualmente se encuentran protegidas mediante Row Level Security y políticas de mínimo privilegio. |
| **Multi-Tenant** | Particionamiento lógico por `organization_id` | RLS y validaciones en backend impiden lectura o mutación cruzada entre organizaciones. |
| **Storage Privado** | Supabase Storage Buckets Privados | Acceso exclusivo mediante Signed URLs temporales con validación RLS en `storage.objects`, extensiones permitidas y chequeo de bytes mágicos. |
| **Auditoría** | Bitácora de eventos inmutable | Auditoría append-only protegida contra modificación desde la aplicación mediante RLS, permisos PostgreSQL y triggers de integridad (`UPDATE`, `DELETE`, `TRUNCATE` denegados). |
| **Defensa SSRF** | Validación perimetral de URLs externas | Bloqueo de IPv4/IPv6 loopback, rangos RFC 1918, RFC 3927 (link-local), AWS/Cloud metadata (`169.254.169.254`) y esquemas no-HTTP/S. |
| **Rate Limiting** | Sliding Window en Middleware/Edge y Memoria | HIPOTECALY implementa protección contra ráfagas y abuso mediante rate limiting por instancia, IP, tenant y credenciales, sin infraestructura distribuida adicional. |
| **Integridad Documental** | Hash Criptográfico SHA-256 | Cada documento generado o firmado almacena su huella digital SHA-256 para verificación de no-repudio. |
| **Supply Chain & CI** | Dependabot + GitHub CI Pipeline | Análisis de dependencias con `npm audit`, chequeo TypeScript sin errores (`tsc --noEmit`), compilación limpia y ejecución de 142 tests de seguridad. |

---

## 3. Acceso Administrador Temporal para QA y Bloqueo de Producción

Para facilitar las etapas de desarrollo y pruebas funcionales de la plataforma:

* **Identificador / Email:** `admin` o `admin@test.com`
* **Contraseña:** `admin123`

### Política Estricta de Aislamiento de Entorno:
* **Entornos DEV / LOCAL / QA (`!import.meta.env.PROD`):**  
  Genera una sesión especial `[QA_ADMIN_SESSION]` con rol `super_admin` y membresías completas para validar el constructor No-Code de DocFlow, Portal de Clientes, Portal de Inversores, Escribanía, KYC, Firmas, IA y Seguridad.
* **Entorno de PRODUCCIÓN (`import.meta.env.PROD === true` o `VERCEL_ENV === 'production'`):**  
  **ESTRICTAMENTE BLOQUEADO con HTTP 401 Unauthorized.**  
  - No existe usuario ni contraseña `admin123` en la base de datos de producción.
  - No existen variables de entorno ni secretos con estas credenciales en Vercel ni Supabase.
  - Cualquier intento de bypass mediante `localStorage.role`, parámetros de URL (`?role=super_admin`, `?admin=true`) o modificación de `user_metadata` en cliente es denegado server-side.

---

## 4. Estrategia de Backup y Disaster Recovery

La arquitectura mantiene una estricta separación entre el motor de base de datos relacional y los archivos binarios:

1. **Base de Datos PostgreSQL:**
   - 19 migraciones idempotentes y determinísticas en `supabase/migrations/`.
   - Procedimiento de restauración validado en entornos aislados con aplicación de esquemas y RLS.
2. **Supabase Storage:**
   - Herramientas automatizadas:
     - `scripts/security/storage-backup.ts`: Exportación de buckets con generación de `storage-manifest.json` y cálculo de hash SHA-256 por archivo.
     - `scripts/security/storage-restore.ts`: Restauración determinística de objetos y jerarquía tenant.
     - `scripts/security/storage-verify.ts`: Verificación de integridad `SHA256(original) === SHA256(restored)`.

---

## 5. Resultados de las Suites de Tests Automatizados

La suite integral de seguridad contiene **142 tests automáticos**, todos ellos pasando satisfactoriamente:

| Suite | Archivo de Test | Cobertura | Resultado |
| :--- | :--- | :--- | :---: |
| **Pass 3 Security Hardening** | `tests/pass3-security-hardening.spec.ts` | QA Isolation, PROD Lockdown, MFA AAL2, Reauth, Storage Manifest, Flood Limiter | **20 / 20 PASS** |
| **Pass 2 Adversarial Suite** | `tests/adversarial-security-hardening.spec.ts` | SSRF, Storage RLS, Tenant Cross-Access, SQL injection vectors, Privileged roles | **52 / 52 PASS** |
| **Fintech Security Suite** | `tests/fintech-security-hardening.spec.ts` | RLS isolation, Data masking, Document SHA-256, API Key security | **24 / 24 PASS** |
| **Mock Bypass & Parameter Tampering** | `tests/security-mock-bypass-attack.spec.ts` | Inyecciones en URL, localStorage tamper, metadata escalation | **16 / 16 PASS** |
| **RLS & Access Hardening** | `tests/rls-security.spec.ts` | IDOR prevention, Cross-tenant isolation, Anon block, Borrower limits | **30 / 30 PASS** |
| **TOTAL GENERAL** | | | **142 / 142 PASS (100%)** |

---

## 6. Riesgos Residuales Conocidos y Aceptados

En estricto cumplimiento con la transparencia técnica y la regla de $0 de costo adicional:

1. **Rate Limiting Distribuido:**  
   La protección contra ráfagas opera a nivel de instancia / edge en middleware y memoria local. No se cuenta con un almacén en memoria distribuido globalmente (ej. clúster Redis / Upstash dedicado de pago). Este riesgo residual es aceptado para la etapa actual.
2. **Auditoría Externa:**  
   No se ha llevado a cabo un penetration test externo independiente por parte de una firma de ciberseguridad tercera.
3. **Certificaciones Formales:**  
   HIPOTECALY no cuenta actualmente con certificados formales emitidos por entidades acreditadoras (ISO 27001, AGESIC, NIST, etc.), sino con controles técnicos y arquitectura inspirados en sus marcos de buenas prácticas.

---

## 7. Plan de Futuro Pentest

> *“Como etapa futura opcional, HIPOTECALY podrá someterse a un penetration test externo independiente antes de trabajar con instituciones que lo requieran contractualmente.”*

---

## 8. Transición a Modo Mantenimiento (Maintenance Mode)

Concluido el Security Hardening PASS 3:
- **No se abrirán nuevas fases ni pasadas de hardening.**
- **No se integrarán nuevos proveedores ni dependencias de seguridad pagas.**
- Las futuras actividades de seguridad se limitarán al **Modo Mantenimiento**:
  - Actualización periódica de parches mediante Dependabot.
  - Ejecución obligatoria de la suite de 142 tests ante cualquier cambio funcional en Auth, RLS, Storage o APIs.
  - Respuesta a vulnerabilidades concretas reportadas.

---

```text
=====================================================
HIPOTECALY SECURITY HARDENING

PASS 1 ✅
PASS 2 ✅
PASS 3 ✅

Internal Security Hardening: COMPLETE
Automated Security Tests: 142 / 142 PASS
Additional Security Services: $0
External Pentest: Future / Optional
Formal Certifications: Not currently held
=====================================================
```
