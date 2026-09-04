# HIPOTECALY — INFORME DE ACCESO QA / INSPECCIÓN CONTROLADA DESDE SUPER ADMIN

**Fecha:** 2026-09-04  
**Entorno:** Producción / Staging / Preview  
**Módulo:** Super Admin Platform Control & QA Inspection Engine  
**Estado:** ✅ CERTIFICADO Y EN PRODUCCIÓN (100% PASS)

---

## 1. Arquitectura Implementada

Se implementó el sistema de **Acceso QA / Inspección Directa Controlada** para Super Administradores en HIPOTECALY. 

El principio rector es la **seguridad estricta y zero auth-bypass**:
- **No es un bypass de frontend:** No se utilizan condicionales del tipo `if (qaMode) return children` ni variables `VITE_BYPASS_AUTH`.
- **Sesiones Supabase Auth Reales:** Toda sesión QA es emitida server-side mediante endpoints protegidos, validada por Super Admin, e inyectada como un token JWT Supabase normal (`access_token`, `refresh_token`).
- **RLS & Aislamiento Intactos:** Las políticas de Row Level Security (RLS) en PostgreSQL, el aislamiento multi-tenant y la validación de roles en `ProtectedRoute` y `AuthContext` permanecen activas y operando al 100%.

```
Super Admin Autenticado (/platform-admin)
                  │
                  ▼
   Selecciona Rol + Tenant + Duración (1h/4h/8h/24h)
                  │
                  ▼
   POST /api/admin/qa/create-session
   (Valida rol SUPER_ADMIN vía verifySuperAdmin)
                  │
                  ▼
   Aprovisiona/resuelve usuario QA real en Supabase Auth
   y genera registro en qa_access_sessions + qa_audit_logs
                  │
                  ▼
   Retorna authSession { access_token, refresh_token, user }
                  │
                  ▼
   Frontend ejecuta supabase.auth.setSession(...)
                  │
                  ▼
   Navega al portal correspondiente con QaSessionBanner activo
```

---

## 2. Flujo de Autenticación y Ciclo de Vida

1. **Activación:** Super Admin ingresa a `/platform-admin` o `/admin/qa` y selecciona el rol deseado (Solicitante, Operador, Administrador de Tenant, Prestamista, Super Admin), el tenant (HIPOTECALY Central, NOVA, etc.) y la duración.
2. **Generación Segura:** La Serverless Function valida los permisos de Super Admin, crea la sesión en base de datos (`qa_access_sessions`), registra el evento `QA_SESSION_CREATED` en `qa_audit_logs`, y genera tokens de sesión Supabase Auth para el usuario QA correspondiente.
3. **Persistencia en Dispositivo:** Se almacena una referencia no sensible en `localStorage` (`hipotecaly_qa_session_ref`) para no requerir login repetido mientras la sesión esté vigente.
4. **Inspección Visual con Banner:** Durante toda la navegación en modo QA se muestra el `<QaSessionBanner />` en la parte superior con badge `SESIÓN QA`, indicación de Rol, Tenant y acciones de `Cambiar Rol`, `Volver a Super Admin` y `Revocar`.
5. **Detección de Discrepancia de Rol:** Si una sesión QA intenta acceder a una ruta de otro rol (ej. QA Solicitante entrando a `/lender`), la pantalla `AccessDenied` muestra el contexto QA y un botón de cambio rápido: *"Esta sesión QA corresponde al rol Solicitante. [ Cambiar a Prestamista ]"*.
6. **Protección contra Acciones Peligrosas:** `QaActionGuard` intercepta cualquier llamada con efectos externos irreversibles (cobros reales, webhooks externos, envíos reales de WhatsApp/Email) emitiendo el aviso *"Acción no ejecutada porque estás utilizando una sesión QA"*.

---

## 3. Archivos Creados y Modificados

### Base de Datos & Migraciones
- `supabase/migrations/20260904000012_qa_access_control_system.sql` (Tablas `qa_access_settings`, `qa_access_sessions`, `qa_audit_logs`, índices y RLS).

### Backend Server-Side
- `server/qa/qaUserService.ts` (Aprovisionamiento e identidades QA dedicadas).
- `server/qa/qaSessionService.ts` (Lógica de sesiones, revocación, validación y auditoría).

### Endpoints Serverless (Vercel API)
- `api/admin/qa/create-session.ts` (Creación de sesión QA con autenticación Super Admin).
- `api/admin/qa/revoke.ts` (Revocación inmediata de sesión QA).
- `api/admin/qa/status.ts` (Consulta de estado, configuración y sesiones activas).
- `api/admin/qa/validate-session.ts` (Validación de vigencia de sesión).
- `api/admin/qa/toggle-feature.ts` (Master switch global de acceso QA).

### Frontend Core & Guards
- `src/lib/adminQaService.ts` (Cliente de comunicación con API QA).
- `src/lib/qaActionGuard.ts` (Interceptor de seguridad contra efectos externos).
- `src/contexts/AuthContext.tsx` (Gestión de estado QA, auto-restore y `exitQaSession`).
- `src/components/auth/ProtectedRoute.tsx` (Protección estricta de rutas intacta).
- `src/components/auth/AccessDenied.tsx` (Pantalla 403 con soporte contextual para sesiones QA).

### Componentes Visuales & Páginas
- `src/components/qa/QaSessionBanner.tsx` (Banner persistente de sesión QA).
- `src/components/admin/SuperAdminQaToolsCard.tsx` (Card de Herramientas QA / Inspección Directa).
- `src/pages/admin/PlatformAdminPage.tsx` (Página `/platform-admin` y `/admin/qa`).
- `src/pages/admin/SuperAdminTenantsPage.tsx` (Banner de acceso a Herramientas QA).
- `src/components/backoffice/BackofficeLayout.tsx` (Enlace a Herramientas QA en sidebar).
- `src/App.tsx` (Rutas `/platform-admin`, `/admin/qa` e inyección global de `<QaSessionBanner />`).
- `eslint.config.js` (Definición de globals DOM para TypeScript/ESLint).

### Testing & E2E
- `tests/helpers/qaSession.ts` (Helper para tests Playwright).
- `tests/qa-access.spec.ts` (Suite de certificación automatizada con 32 tests).

---

## 4. Usuarios QA y Roles Soportados

| Rol del Sistema | Usuario QA Aprovisionado | Portal Destino | Alcance / Permisos |
|---|---|---|---|
| **Solicitante** | `qa.applicant@hipotecaly.local` | `/mi-cuenta` | Perfil de prestatario, legajo digital, simulaciones |
| **Operador / Backoffice** | `qa.operator@hipotecaly.local` | `/app` | Expedientes, análisis, tasaciones, matching |
| **Administrador de Tenant** | `qa.tenantadmin@hipotecaly.local` | `/app` | Configuración de organización, usuarios del tenant |
| **Prestamista** | `qa.lender@hipotecaly.local` | `/lender` | Feed de oportunidades anonimizadas, ofertas |
| **Super Admin** | `qa.superadmin@hipotecaly.local` | `/platform-admin` | Control global de plataforma, tenants e IA |

---

## 5. Tenants Soportados

- **HIPOTECALY Central** (`a0000000-0000-0000-0000-000000000001`) — Matriz oficial.
- **NOVA Crédito Hipotecario** (`d0000000-0000-0000-0000-000000000001`) — Showroom / White-Label demo.
- **Tenants Dinámicos:** Compatible con cualquier tenant creado mediante el Asistente de Onboarding.

---

## 6. Expiración, Revocación y Auditoría

- **Duraciones seleccionables:** 1 hora, 4 horas, 8 horas (default), 24 horas (máximo permitido).
- **Auto-expiración:** El backend y el cliente invalidan la sesión automáticamente al vencer el plazo.
- **Revocación manual:** Disponible con 1-click desde el banner QA o desde la tabla de sesiones activas en `/platform-admin`.
- **Eventos auditados en `qa_audit_logs`:**
  - `QA_SESSION_CREATED`
  - `QA_SESSION_USED`
  - `QA_SESSION_ROLE_CHANGED`
  - `QA_SESSION_REVOKED`
  - `QA_SESSION_EXPIRED`

---

## 7. Verificación de Seguridad y Zero Secret Leakage

- [x] **Zero Service Role en Cliente:** Ningún endpoint ni bundle exporta `SUPABASE_SERVICE_ROLE_KEY` ni `VITE_SUPABASE_SERVICE_ROLE_KEY`.
- [x] **Zero Passwords en Frontend:** Las contraseñas temporales se generan exclusivamente en memoria server-side y jamás se retornan en las respuestas JSON.
- [x] **RLS Estricto:** Tablas `qa_access_settings`, `qa_access_sessions` y `qa_audit_logs` solo pueden ser accedidas por usuarios con rol `super_admin`.
- [x] **Fail-Closed RBAC:** Peticiones anónimas reciben 401 Unauthorized; peticiones de usuarios regulares o administradores de estudio reciben 403 Forbidden.

---

## 8. Resultados de la Suite de Certificación Playwright

```text
Running 32 tests using 8 workers (Desktop Chrome & Mobile 390px)

  ✓ 1. RBAC: Rechaza creación de sesión QA anónima con 401 Unauthorized
  ✓ 2. RBAC: Rechaza creación de sesión QA por usuario regular con 403 Forbidden
  ✓ 3. RBAC: Rechaza creación de sesión QA por admin de inquilino con 403 Forbidden
  ✓ 4. RBAC: Super Admin puede generar sesión QA para Solicitante con tokens reales
  ✓ 5. RBAC: Super Admin puede generar sesión QA para Operador / Backoffice
  ✓ 6. RBAC: Super Admin puede generar sesión QA para Prestamista
  ✓ 7. Revocación: Sesión revocada es invalidada inmediatamente
  ✓ 8. Expiración: Sesión con tiempo vencido es rechazada
  ✓ 9. Cero Filtración: No se exponen service_role ni passwords en los tokens QA
  ✓ 10. UI: Usuario QA Solicitante puede entrar a /mi-cuenta con banner visible
  ✓ 11. UI: Usuario QA Operador puede entrar a /app con banner visible
  ✓ 12. UI: Usuario QA Prestamista puede entrar a /lender con banner visible
  ✓ 13. Seguridad: Usuario QA Solicitante no puede acceder a portal Prestamistas (/lender)
  ✓ 14. Seguridad: Usuario QA Prestamista no puede acceder a Backoffice (/app)
  ✓ 15. Seguridad: Usuario QA Operador no puede acceder a /platform-admin
  ✓ 16. Super Admin UI: Panel /platform-admin contiene card de Acceso QA

32 passed (100% PASS)
```

---

## 9. Estado Final

- **Build:** `npm run build` → PASS (0 errores).
- **Linter:** `npm run lint` → PASS (0 errores).
- **Tests QA:** `npx playwright test tests/qa-access.spec.ts` → 32/32 PASS.
- **Estado de Entrega:** Listo para producción inmediata.
