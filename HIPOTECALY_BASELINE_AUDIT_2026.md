# HIPOTECALY — AUDITORÍA TÉCNICA, FUNCIONAL Y ARQUITECTÓNICA DE BASELINE OFICIAL (2026)
**Punto Cero / Baseline Oficial Previo a Etapa de Update, Mejoramiento y Add-Ons**

- **Fecha de Auditoría:** 03 de Septiembre de 2026
- **Auditoría ejecutada por:** Arquitecto Senior de Software, Product Manager SaaS, UX/UI Auditor y Auditor Técnico Full-Stack
- **Entorno Auditado:** Repositorio Local (`c:\Projects\Hipotecaly`), Base de Datos Cloud Supabase (`imzljdwsrsxyccgogfck`), Vercel Serverless Functions (`api/`), Suite de Pruebas E2E Playwright y Navegación Visual Responsive.
- **Regla Crítica Cumplida:** **NO SE REALIZARON MODIFICACIONES FUNCIONALES NI ESTRUCTURALES DURANTE ESTA FASE.**

---

## ÍNDICE GENERAL

1. [Objetivo Principal y Diagnóstico Basal](#1-objetivo-principal-y-diagnóstico-basal)
2. [Contexto de Producto y Posicionamiento Dual](#2-contexto-de-producto-y-posicionamiento-dual)
3. [Auditoría de Arquitectura SaaS y Multi-Tenancy](#3-auditoría-de-arquitectura-saas-y-multi-tenancy)
4. [Inventario Completo de Rutas](#4-inventario-completo-de-rutas)
5. [Navegación Visual Real y Responsive](#5-navegación-visual-real-y-responsive)
6. [Auditoría Específica del Posicionamiento SaaS Comercial](#6-auditoría-específica-del-posicionamiento-saas-comercial)
7. [Auditoría Detallada de `/plataforma` y `/saas`](#7-auditoría-detallada-de-plataforma-y-saas)
8. [Auditoría de la Home (`/`) y Desglose de Mensaje](#8-auditoría-de-la-home--y-desglose-de-mensaje)
9. [Auditoría de Navegación, Header y Footer](#9-auditoría-de-navegación-header-y-footer)
10. [Auditoría del Tenant Demo NOVA y Presentación](#10-auditoría-del-tenant-demo-nova-y-presentación)
11. [Auditoría del Onboarding White-Label](#11-auditoría-del-onboarding-white-label)
12. [Auditoría del Super Admin](#12-auditoría-del-super-admin)
13. [Auditoría Técnica de Multi-Tenancy y RLS](#13-auditoría-técnica-de-multi-tenancy-y-rls)
14. [Nivel Real de Personalización White-Label](#14-nivel-real-de-personalización-white-label)
15. [Inventario de Módulos del Sistema](#15-inventario-de-módulos-del-sistema)
16. [Auditoría de Inteligencia Artificial (HIPOTECALY AI CORE)](#16-auditoría-de-inteligencia-artificial-hipotecaly-ai-core)
17. [Auditoría del Marketplace Hipotecario E2E](#17-auditoría-del-marketplace-hipotecario-e2e)
18. [Auditoría de Base de Datos (Supabase PostgreSQL)](#18-auditoría-de-base-de-datos-supabase-postgresql)
19. [Auditoría de Serverless Functions (Backend Vercel API)](#19-auditoría-de-serverless-functions-backend-vercel-api)
20. [Auditoría de Integraciones Externas](#20-auditoría-de-integraciones-externas)
21. [Auditoría de Autenticación, Usuarios y Roles](#21-auditoría-de-autenticación-usuarios-y-roles)
22. [Auditoría SEO](#22-auditoría-seo)
23. [Auditoría de Analytics y Telemetría](#23-auditoría-de-analytics-y-telemetría)
24. [Deuda Visual y UX (P0, P1, P2, P3)](#24-deuda-visual-y-ux-p0-p1-p2-p3)
25. [Inventario de Hardcodeados](#25-inventario-de-hardcodeados)
26. [Inventario de Feature Flags](#26-inventario-de-feature-flags)
27. [Código Legacy, Huérfano y No Importado](#27-código-legacy-huérfano-y-no-importado)
28. [Contraste: Documentación vs. Realidad](#28-contraste-documentación-vs-realidad)
29. [Resultado de Compilación, Build y Tests](#29-resultado-de-compilación-build-y-tests)
30. [Comparación Repo vs. Producción Cloud](#30-comparación-repo-vs-producción-cloud)
31. [GAP Analysis — HIPOTECALY SaaS](#31-gap-analysis--hipotecaly-saas)
32. [Customer Journey B2B (SaaS Client)](#32-customer-journey-b2b-saas-client)
33. [Customer Journey B2C (Borrower / Solicitante)](#33-customer-journey-b2c-borrower--solicitante)
34. [Matriz Ejecutiva de Madurez de Estado](#34-matriz-ejecutiva-de-madurez-de-estado)
35. [Resumen Ejecutivo de Cierre (Puntos A - J)](#35-resumen-ejecutivo-de-cierre-puntos-a---j)
36. [Roadmap Preliminar para Etapas Posteriores](#36-roadmap-preliminar-para-etapas-posteriores)

---

## 1. OBJETIVO PRINCIPAL Y DIAGNÓSTICO BASAL

A continuación se responde puntualmente a los 15 interrogantes rectores de la auditoría basal:

1. **¿Qué existe realmente hoy en HIPOTECALY?:** Existe un repositorio SPA basado en Vite + React 18 + TypeScript + Tailwind CSS con un motor backend serverless en `/api` (Vercel) y una base de datos PostgreSQL en Supabase Cloud (`imzljdwsrsxyccgogfck`) con 55 tablas, 16 funciones PostgreSQL, 2 storage buckets privados y Row Level Security activada. Existen implementaciones visuales completas para Marketplace, portales SaaS `/saas` y `/plataforma`, experiencias demo de NOVA, wizard de onboarding de clientes White-Label de 10 pasos, panel Super Admin de organizaciones y consola de gobernanza de OpenAI Vault.
2. **¿Qué está funcionando?:** Compilación TypeScript (0 errores), Vite build (PASS en 11s), suite unitaria de IA (40/40 tests PASS), motor de evaluación crediticia por LTV y montos en simulador, cambio dinámico de límites de financiación en Supabase reflejados en caliente en UI, resolución de tenants por subpath `/org/:slug` y por hostname custom domain, inyección de colores CSS dinámicos de marca, subida privada a Storage de fotos y documentos, y barra comercial flotante para presentaciones (`?presentation=true`).
3. **¿Qué está implementado en código pero no visible / oculto?:**
   - El acceso al SaaS desde la Home (`/`) es prácticamente invisible en Desktop (no figura en la barra de navegación superior).
   - El Super Admin de organizaciones (`/admin/tenants`) y el Onboarding Wizard (`/admin/tenants/new`) no tienen enlaces directos en la interfaz pública general ni en el navbar de `/app`.
   - La consola de administración de IA (`/admin/ai` y `/app/ai-admin`) no tiene acceso desde el menú lateral del backoffice.
   - El motor de agentes de IA server-side (`DocumentIntelligence`, `PropertyValuation`, `Consistency`, `Underwriting`, `Risk`, `MemoryRetrieval`) está completo en `server/ai/` pero la pestaña de UI dentro del expediente (`HipotecalyAiTab.tsx`) requiere tener activa la clave en Vault y saldo en CASOS para desplegarse completamente.
4. **¿Qué está visible en producción?:** Está visible la Home del Marketplace (`/`), simulador de préstamos (`/simulador`), marketing pages (`/como-funciona`, `/prestamos`, `/preguntas-frecuentes`, `/nosotros`, `/contacto`), y si se tipea la URL directa, `/saas`, `/plataforma`, `/demo/nova/*` y `/app`.
5. **¿Qué está desarrollado parcialmente?:**
   - El portal del prestamista (`/lender/*`): Las oportunidades y ofertas son arrays estáticos hardcodeados en React State (`opp-1`, `opp-2`, `off-1`) en vez de alimentar desde la vista SQL de `opportunities`.
   - Los reportes del backoffice (`/app/reportes`): Muestran métricas fijas (`68.4%`, `48 hs`, `32.8%`) sin computar las aplicaciones reales.
   - La página de configuración de la organización (`/app/organizacion`): El guardado de branding es un toast simulado sin mutación en Supabase.
   - Formulario de contacto comercial (`/contacto`): El submit sólo cambia un booleano local en React; no guarda en Supabase ni despacha email.
6. **¿Qué está hardcodeado?:** El sidebar de `/app` dice estáticamente "HIPOTECALY Matriz / Tenant #1"; la página de usuarios `/app/usuarios` consulta e invita siempre a la organización fija `a0000000-0000-0000-0000-000000000001`; el registro de usuarios en `AuthContext.signUp` asigna obligatoriamente dicha organización matriz; en `LenderOpportunityDetailPage` los IDs de aplicación y prestamista están fijos en el payload de emisión.
7. **¿Qué depende de configuración?:** Las reglas crediticias por tenant (porcentaje financiado máximo, monto máximo, plazos, tasa base), los 16 módulos / feature flags por tenant en `tenant_modules`, el branding dinámico (colores, claim, logo, favicon) y la configuración de API Key de OpenAI en Supabase Vault.
8. **¿Qué partes corresponden al Marketplace?:** Rutas `/`, `/simulador`, `/como-funciona`, `/prestamos`, `/solicitar` (cuando no tiene parámetro `source`), `/mi-cuenta`, y la vista de matching de inversores privados.
9. **¿Qué partes corresponden al SaaS?:** Rutas `/saas`, `/saas/integracion`, `/saas/plataforma-completa`, `/saas/precios`, `/plataforma/*`, componentes comparativos B2B (`PipelineVisual`, `BrandComparisonMockup`, `CostBreakdownSimulator`), planes comerciales y modalidades de contratación.
10. **¿Qué partes corresponden al White-Label / Multi-Tenant?:** Rutas `/org/:slug`, `/org/:slug/simulador`, `TenantProvider`, `tenantService.ts`, tabla `tenant_modules`, motor de branding temático CSS, wizard de creación de tenants `/admin/tenants/new`, y las 3 experiencias de demostración de NOVA.
11. **¿Qué partes de la orientación SaaS llegaron realmente al frontend público?:** Llegaron páginas completas y visualmente muy ricas (`/saas`, `/saas/integracion`, `/saas/plataforma-completa`, `/plataforma`), con su propio `SaaSNavbar`. Sin embargo, **están desvinculadas de la Home principal**: el usuario que entra a `hipotecaly.uy` no ve ningún botón ni pestaña de "Plataforma" o "Empresas" en el menú de cabecera de escritorio.
12. **¿Qué partes quedaron a nivel técnico / backend / admin?:** Multi-tenant RLS en 55 tablas, motor de deducción atómica de CASOS AI en `ai_wallets`, inmutabilidad estricta de `audit_logs` con trigger anti-tampering, y resolución de credenciales vía `openAiSecretResolver` conectada a `vault.decrypted_secrets`.
13. **¿Qué falta para que comercialmente se perciba como SaaS?:** Unificar la arquitectura de información pública: la cabecera principal debe tener segmentación clara (ej. selector o pestañas "Personas / Préstamos" vs. "Empresas / Tecnología SaaS"), incorporar un CTA visible en Home para "Solicitar Demo B2B", y conectar el formulario comercial a CRM/Base de Datos.
14. **¿Qué deuda técnica, visual o arquitectónica existe?:** Falta de guardas de ruta (Route Guards) en cliente en `/app/*` y `/admin/*`; formularios que simulan guardado en state en vez de persistir; links rotos a páginas legales en el Footer (`/terminos`, `/privacidad`, `/seguridad` no registradas en `App.tsx`); y desborde horizontal detectado en Tablet Portrait (768px).
15. **¿Qué oportunidades inmediatas existen?:** Unificar la navegación pública para exponer el SaaS sin rediseñar; activar persistencia real en el formulario de leads B2B; enlazar el menú de `/app` con la consola de IA y el switch de organización; y crear las páginas legales huérfanas.

---

## 2. CONTEXTO DE PRODUCTO Y POSICIONAMIENTO DUAL

HIPOTECALY posee en su código dos modelos de negocio coexistentes:

```
                                  HIPOTECALY CORE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
        LÍNEA A: MARKETPLACE                             LÍNEA B: SaaS / WHITE-LABEL
   "Tu propiedad, tu oportunidad"               "Tu negocio hipotecario. Tu marca. Nuestra tecnología"
                 │                                               │
   • Público: Propietarios particulares            • Público: Prestamistas, Financieras, Estudios
   • Producto: Préstamos con garantía hipotecaria  • Modalidad 1: Integración a web existente
   • Flujo: Simulación -> Solicitud -> Legajo     • Modalidad 2: Plataforma completa White-Label
     -> Matching -> Aprobación -> Operación        • Módulos: Captación, Wizard, Legajo, Copiloto IA,
   • Monetización: Comisión por originación/éxito    Backoffice, Valuaciones, Servicing, Cartera
                                                   • Monetización: Suscripción SaaS + Fee por Caso AI
```

**Diagnóstico Basal:** Ambas líneas tienen código sustancial y de alta calidad desarrollado, pero están comercialmente desarticuladas en la capa de descubrimiento: la Línea A domina el 95% de la superficie visual inicial, eclipsando a la Línea B.

---

## 3. AUDITORÍA DE ARQUITECTURA SaaS Y MULTI-TENANCY

| Elemento Auditado | Evidencia en Código | Evidencia en Base de Datos | Estado Real | Observaciones |
| :--- | :--- | :--- | :--- | :--- |
| **Tenants / Organizations** | `src/lib/tenantService.ts` | Tabla `organizations` (4 filas) | 🟢 PRODUCTION READY | Modelado con UUID, slug, nombre legal y comercial. |
| **Tenant ID vs Organization ID** | `src/lib/types.ts`, `tenantRulesService.ts` | `organizations.id` vs `tenant_modules.tenant_id` | 🟡 PARCIAL CON DEUDA | Discrepancia de nomenclatura entre tablas históricas (`organization_id`) y nuevas (`tenant_id`). |
| **Tenant Branding Dinámico** | `applyTenantTheme()` en `tenantService.ts` | Tabla `organization_branding` | 🟢 PRODUCTION READY | Aplica colores mediante variable CSS `--brand-green` en DOM. |
| **Custom Domains & Hostname** | `resolveTenant()` en `tenantService.ts` | Tabla `organization_domains` | 🟢 PRODUCTION READY | Resuelve por dominio exacto, subdominio y prefijo `/org/:slug`. |
| **Tenant Modules / Flags** | `tenantModulesService.ts` | Tabla `tenant_modules` (32 filas) | 🟢 PRODUCTION READY | 16 feature flags independientes por organización. |
| **Reglas Crediticias Dinámicas** | `tenantRulesService.ts` | Tabla `tenant_lending_rules` | 🟢 PRODUCTION READY | Límites de LTV y montos dinámicos en simulador sin redeploy. |
| **Onboarding Automatizado** | `TenantOnboardingWizardPage.tsx` | Tabla `tenant_onboarding_status` | 🟢 IMPLEMENTADO | Flujo de 10 pasos con export/import JSON y duplicación. |
| **Super Admin Consola** | `SuperAdminTenantsPage.tsx` | Supabase RPCs de administración | 🟢 IMPLEMENTADO | Permite conmutar módulos y cambiar reglas en caliente. |
| **Multi-Tenant RLS** | Políticas en `supabase/migrations/` | RLS activado en 55/55 tablas | 🟢 REAL Y SEGURO | Filtros por `organization_id` y pertenencia en `organization_members`. |
| **Aislamiento de Storage** | `storage-security.spec.ts` | Buckets `application-documents` y `property-photos` | 🟢 PRODUCTION READY | Buckets 100% privados (`public: false`). URLs firmadas con expiración. |

---

## 4. INVENTARIO COMPLETO DE RUTAS

Se auditaron las 48 rutas declaradas en `src/App.tsx`:

| Ruta | Tipo | Existe | Funciona | Visible | Protegida | Rol | Tenant-aware | Estado |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `/` | Pública Marketplace | Sí | Sí | Sí | No | Público | No (Central) | 🟢 PRODUCTION READY |
| `/simulador` | Pública Marketplace | Sí | Sí | Sí | No | Público | No (Central) | 🟢 PRODUCTION READY |
| `/prestamos` | Pública Marketplace | Sí | Sí | Sí | No | Público | No (Central) | 🟢 PRODUCTION READY |
| `/como-funciona` | Pública Marketing | Sí | Sí | Sí | No | Público | No (Central) | 🟢 PRODUCTION READY |
| `/preguntas-frecuentes`| Pública Marketing | Sí | Sí | Sí | No | Público | No (Central) | 🟢 PRODUCTION READY |
| `/nosotros` | Pública Marketing | Sí | Sí | Sí | No | Público | No (Central) | 🟢 PRODUCTION READY |
| `/contacto` | Pública Comercial | Sí | Sí | Sí | No | Público | No | 🟡 PARCIAL (Submit no persiste) |
| `/saas` | Pública SaaS B2B | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/saas/integracion` | Pública SaaS B2B | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/saas/plataforma-completa` | Pública SaaS B2B | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/saas/precios` | Pública SaaS B2B | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/plataforma` | Alias de `/saas` | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/plataforma/integracion` | Alias de integración | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/plataforma/plataforma-completa` | Alias completa | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/plataforma/funcionalidades` | Alias de `/saas` | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/plataforma/para-quien-es` | Alias de `/saas` | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/plataforma/white-label` | Alias White-Label | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/plataforma/precios` | Alias de precios | Sí | Sí | Oculta en Nav Desktop | No | B2B | No (Central) | 🟢 PRODUCTION READY |
| `/org/:slug` | White-Label Landing | Sí | Sí | Según slug | No | Público | Sí | 🟢 PRODUCTION READY |
| `/org/:slug/simulador` | White-Label Simulador | Sí | Sí | Según slug | No | Público | Sí | 🟢 PRODUCTION READY |
| `/demo/nova/legacy` | Demo Comercial | Sí | Sí | Vía link demo | No | Demo | Sí (NOVA) | 🟢 PRODUCTION READY |
| `/demo/nova/integrado`| Demo Comercial | Sí | Sí | Vía link demo | No | Demo | Sí (NOVA) | 🟢 PRODUCTION READY |
| `/demo/nova/full` | Demo Comercial | Sí | Sí | Vía link demo | No | Demo | Sí (NOVA) | 🟢 PRODUCTION READY |
| `/demo/nova/login` | Demo Auth | Sí | Sí | Vía link demo | No | Demo | Sí (NOVA) | 🟢 PRODUCTION READY |
| `/demo/nova/mi-cuenta`| Demo Portal Cliente | Sí | Sí | Vía link demo | No | Demo | Sí (NOVA) | 🟢 PRODUCTION READY |
| `/solicitar` | Wizard Solicitante | Sí | Sí | Sí | No | Borrower | Sí (por `source`) | 🟢 PRODUCTION READY |
| `/mi-cuenta` | Portal Solicitante | Sí | Sí | Sí | No (sin guard) | Borrower | Sí | 🟡 PARCIAL (Acceso anónimo muestra demo) |
| `/ingresar` | Autenticación | Sí | Sí | Sí | No | Todos | No | 🟢 PRODUCTION READY |
| `/registro` | Autenticación | Sí | Sí | Sí | No | Borrower | No (hardcodea central) | 🟡 PARCIAL |
| `/recuperar-password`| Autenticación | Sí | Sí | Enlace login | No | Todos | No | 🟢 PRODUCTION READY |
| `/admin/tenants` | Super Admin Clientes | Sí | Sí | Oculta en Nav | No (sin guard) | SuperAdmin | Sí (Gestor) | 🟢 PRODUCTION READY |
| `/admin/tenants/new` | Wizard Onboarding | Sí | Sí | Oculta en Nav | No (sin guard) | SuperAdmin | Sí (Generador) | 🟢 PRODUCTION READY |
| `/admin/ai` | Consola IA Super Admin| Sí | Sí | Oculta en Nav | No (sin guard) | SuperAdmin | No (Global) | 🟢 PRODUCTION READY |
| `/app` | Backoffice Dashboard | Sí | Sí | Footer/URL | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/solicitudes` | Backoffice Bandeja | Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/solicitudes/:id`| Backoffice Legajo | Sí | Sí | Desde bandeja | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/clientes` | Backoffice Clientes | Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/propiedades` | Backoffice Inmuebles | Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/documentos` | Backoffice Documental| Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/tasaciones` | Backoffice Valuaciones| Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/tareas` | Backoffice Tareas | Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/reportes` | Backoffice Reportes | Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟡 PARCIAL (Métricas fijas) |
| `/app/configuracion` | Backoffice Settings | Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟡 PARCIAL (Solo lectura) |
| `/app/prestamistas` | Backoffice Lenders | Sí | Sí | Menú lateral | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/prestamistas/:id`| Backoffice Detalle | Sí | Sí | Desde lista | No (sin guard) | Staff | Sí | 🟢 PRODUCTION READY |
| `/app/usuarios` | Backoffice Gestión | Sí | Sí | Menú lateral | No (sin guard) | Admin Org | No (Hardcodea matriz) | 🟡 PARCIAL |
| `/app/organizacion` | Backoffice WhiteLabel | Sí | Sí | Menú lateral | No (sin guard) | Admin Org | Sí | 🟡 PARCIAL (Toast mock) |
| `/app/ai-admin` | Alias Consola IA | Sí | Sí | URL directa | No (sin guard) | SuperAdmin | No (Global) | 🟢 PRODUCTION READY |
| `/lender` | Portal Prestamista | Sí | Sí | URL directa | No (sin guard) | Lender | No | 🟡 PARCIAL (Datos estáticos) |
| `/lender/oportunidades`| Portal Prestamista | Sí | Sí | Menú lender | No (sin guard) | Lender | No | 🟡 PARCIAL (Datos estáticos) |
| `/lender/oportunidades/:id`| Detalle Oportunidad | Sí | Sí | Desde bandeja | No (sin guard) | Lender | No | 🟡 PARCIAL (IDs fijos) |
| `/lender/ofertas` | Ofertas Prestamista | Sí | Sí | Menú lender | No (sin guard) | Lender | No | 🟡 PARCIAL (Datos estáticos) |

---

## 5. NAVEGACIÓN VISUAL REAL Y RESPONSIVE

Se ejecutó inspección visual en los 6 viewports estandarizados:

### A. Desktop (1440×900 y 1280×800)
- **Home (`/`):** Renderizado impecable del Hero, card financiera flotante, 4 pilares en barra navy y mockup de dashboard. Tipografía Inter nítida y contraste AA/AAA.
- **SaaS (`/saas`):** Jerarquía visual excelente, tarjetas diferenciadas de Modalidad A (Blanco/Verde) y Modalidad B (Navy/Verde), diagramas de pipeline claros.
- **Backoffice (`/app`):** Sidebar navy colapsable, métricas en tarjetas claras, tabla de expedientes limpia con badges de estado.

### B. Tablet (768×1024 Portrait y 1024×768 Landscape)
- **768×1024 Portrait:** Se detectó un **desborde horizontal leve (`scrollWidth > innerWidth`)** en la vista de testing de `visual-qa.spec.ts` debido al ancho mínimo de ciertos inputs combinados con padding en el wizard o en tablas del backoffice sin overflow horizontal protegido. (Identificado como issue **P1**).

### C. Mobile (390×844 y 360×800)
- **Navegación Móvil:** El botón de menú tipo hamburguesa abre un Drawer fluido con animación `slide-in-from-top-2`. Los botones de acción son de ancho completo (`fullWidth`) con altura táctil adecuada (mínimo 48px).
- **Simulador y Formularios:** Adaptación limpia a columna simple en 390px y 360px.
- **Barra de Demostración Comercial (`DemoSalesModeBar`):** Se ancla correctamente al pie (`bottom-0`) y cuenta con botón de colapso a botón flotante `Demo Sales Mode` para no obstruir el teclado en móviles.

### D. Enlaces Rotos y Páginas Huérfanas Detectadas
- **Enlaces Rotos en Footer:**
  - `<Link to="/terminos">Términos del Servicio</Link>` → RUTA INEXISTENTE (Redirige al inicio `/`).
  - `<Link to="/privacidad">Política de Privacidad</Link>` → RUTA INEXISTENTE (Redirige al inicio `/`).
  - `<Link to="/seguridad">Seguridad de la Información</Link>` → RUTA INEXISTENTE (Redirige al inicio `/`).
- **Páginas Huérfanas (Sin enlace en menús principales):**
  - `/admin/ai` (Consola de IA del Super Admin).
  - `/admin/tenants` (Gestor de Tenants SaaS).
  - `/admin/tenants/new` (Wizard de Onboarding de Clientes).
  - `/lender` (Portal de Prestamistas).

---

## 6. AUDITORÍA ESPECÍFICA DEL POSICIONAMIENTO SaaS COMERCIAL

> **Pregunta de Control:** *Si entro hoy por primera vez a HIPOTECALY desde el dominio principal en una computadora de escritorio, ¿entiendo claramente que puedo contratar la tecnología para mi empresa?*

### Calificación: 🟡 PARCIAL A CONFUSO

#### Análisis por Perfil de Usuario B2B:
- **A. Prestamista Privado:** Entra a la Home y ve: *"Convertimos tu propiedad en la oportunidad que necesitás. Préstamos con garantía hipotecaria"*. Interpreta inmediatamente que HIPOTECALY es un competidor o una financiera que otorga créditos a personas, no que le ofrece un software para su mesa de dinero.
- **B. Financiera de Crédito:** No encuentra ningún llamado a la acción B2B arriba del pliegue (*above the fold*). Solo en el footer (tras hacer scroll de 4 páginas) o en el menú de un teléfono móvil encuentra una mención pequeña a *"¿Sos prestamista o estudio? Ir a SaaS"*.
- **C. Estudio Jurídico / Notarial:** Cree que es un portal para que solicitantes particulares tramiten préstamos. No percibe que HIPOTECALY le provee un backoffice de legajos y checklist notarial.
- **D. Broker Hipotecario:** No descubre la existencia de un portal multi-financiera ni de reglas configurables.
- **E. Potencial Cliente White-Label:** Desconoce por completo que puede desplegar toda la plataforma con su propio logo y dominio, a menos que un vendedor le envíe el enlace directo `/saas` o `/demo/nova/full`.

---

## 7. AUDITORÍA DETALLADA DE `/plataforma` Y `/saas`

1. **¿Existe?:** Sí, plenamente implementada en `src/pages/SaaSHome.tsx` y con alias canónico en `/saas`.
2. **¿Está incluida en navegación?:** Solo en el drawer móvil de `Navbar.tsx` (como texto secundario al pie) y en el `Footer.tsx`. **No está en la barra de navegación de escritorio de la Home.**
3. **¿Está indexable?:** Sí, declarada en `robots.txt` (`Allow: /plataforma`) y en `sitemap.xml`.
4. **¿Tiene contenido real?:** Sí, describe exhaustivamente las dos modalidades comerciales (Integración vs. Plataforma Completa).
5. **¿Está terminada?:** Desde el punto de vista informativo y visual, está completa y muy pulida.
6. **¿Comunica SaaS?:** Sí, claramente (*"Digitalizá todo tu negocio hipotecario. Sin cambiar cómo prestás"*).
7. **¿Comunica White-Label?:** Sí (*"Tu marca. Tu dominio. Tus clientes. Nuestra tecnología"*).
8. **¿Explica módulos?:** Sí (Captación, Legajo, IA, Valuación, Formalización, Servicing).
9. **¿Explica beneficios?:** Sí (Más eficiencia, menos riesgo, más capacidad).
10. **¿Explica usuarios objetivo?:** Sí (Estudios, Prestamistas, Financieras, Brokers).
11. **¿Tiene screenshots / mockups?:** Sí, componentes interactivos HTML/CSS (`DashboardMockup`, `MobileTrackerMockup`, `PipelineVisual`).
12. **¿Tiene demostraciones?:** Enlaza a las demos interactivas de NOVA (`/demo/nova/legacy` y `/demo/nova/full`).
13. **¿Tiene CTA?:** Sí ("AGENDAR DEMO", "QUIERO INTEGRARLO", "QUIERO MI PLATAFORMA").
14. **¿Tiene pricing / modelo comercial?:** Sí, en `/saas/precios` (Plan Profesional, Business y White-Label).
15. **¿Tiene formularios?:** Redirige a `/contacto?demo=true`, cuyo formulario no guarda en base de datos.
16. **¿Tiene SEO propio?:** Parcial; comparte el `<title>` global de `index.html` debido a que es una SPA sin react-helmet ni SSR.
17. **¿Existe conexión real desde Home?:** Prácticamente nula para el usuario de desktop (solo footer).
18. **¿Está visualmente alineada con el resto?:** Sí, utiliza el mismo design system (Navy `#071A35`, Brand Green `#0B8A5A` / `#2DA674`, Slate backgrounds).

---

## 8. AUDITORÍA DE LA HOME (`/`) Y DESGLOSE DE MENSAJE

### Desglose Cualitativo del Mensaje en la Home:
- **Marketplace / Préstamos a personas / Solicitantes:** **95%**
- **Tecnología genérica ("Tecnología que simplifica"):** **5%**
- **SaaS B2B / Software para Financieras / White-Label:** **0%** (en el cuerpo principal).

**Diagnóstico:** Existe una disonancia absoluta entre la sofisticación tecnológica construida (SaaS multi-tenant con IA, Vault, módulos) y lo que la página principal transmite.

---

## 9. AUDITORÍA DE NAVEGACIÓN, MENÚ Y FOOTER

### Navbar Principal (`Navbar.tsx`):
- Opciones: *Cómo funciona, Préstamos, Simulador, Preguntas frecuentes, Nosotros*.
- CTAs: *Solicitar préstamo* (Botón Verde), *Ingresar* (Ghost).
- **Faltantes:** Pestaña o enlace a *Plataforma / SaaS / Empresas*, enlace a *Demo*.

### SaaS Navbar (`SaaSNavbar.tsx`):
- Opciones: *Producto, Soluciones (Dropdown: Ya tengo sitio web / Necesito todo desde cero), Integración, White-Label, IA, Seguridad, Contacto*.
- CTAs: *Backoffice* (Ghost), *AGENDAR DEMO* (Botón Verde).
- **Observación:** Es un navbar completo y muy profesional que solo se muestra cuando el usuario ya descubrió la ruta `/saas`.

### Footer (`Footer.tsx`):
- Organizado en 5 columnas: *Marca, Para Propietarios, Para Profesionales, Contacto, Disclaimer Regulatorio*.
- **Defecto crítico:** Los enlaces legales inferiores (`/terminos`, `/privacidad`, `/seguridad`) provocan un 404 blando redirigiendo al home.

---

## 10. AUDITORÍA DEL TENANT DEMO NOVA

| Componente Demo | Ubicación en Código | Estado Real | Verificación Funcional |
| :--- | :--- | :--- | :--- |
| **NOVA Legacy** | `/demo/nova/legacy` | 🟢 PRODUCTION READY | Simula un sitio web tradicional externo con simulador básico. |
| **NOVA Integrado** | `/demo/nova/integrado` | 🟢 PRODUCTION READY | Visualizador interactivo del pipeline de conexión en 8 pasos. |
| **NOVA Full White-Label** | `/demo/nova/full` | 🟢 PRODUCTION READY | Ecosistema completo bajo la marca NOVA con simulador reactivo. |
| **NOVA Login & Portal** | `/demo/nova/login`, `/demo/nova/mi-cuenta` | 🟢 PRODUCTION READY | Pre-carga el expediente demo `HPT-2026-00124`. |
| **Reset Demo NOVA** | `resetNovaDemoTenant()` en `tenantOnboardingService.ts` | 🟢 IMPLEMENTADO | Elimina expedientes de prueba creados durante la sesión y restaura topes oficiales (50%, USD 250k). |
| **Barra Demo Sales Mode** | `DemoSalesModeBar.tsx` | 🟢 PRODUCTION READY | Navegación rápida entre experiencias comerciales (?presentation=true). |

---

## 11. AUDITORÍA DEL ONBOARDING WHITE-LABEL

Implementado en `TenantOnboardingWizardPage.tsx` (1.106 líneas de código) y `tenantOnboardingService.ts`:

- **Ruta:** `/admin/tenants/new`
- **10 Pasos Reales:**
  1. *Datos de Empresa:* Razón social, nombre comercial, slug, email y teléfono de soporte.
  2. *Tipo de Implementación:* Integración Básica, Integración Completa o Full White-Label con preconfiguración de módulos.
  3. *Identidad Visual & Branding:* Colores primario y secundario, logo URL, favicon URL, claim institucional.
  4. *Reglas Crediticias:* Monto mínimo y máximo, LTV tope, plazo mínimo y máximo, tasa de interés anual por defecto.
  5. *Desglose de Costos de Cierre:* Aranceles notariales, tasación, seguro y gastos administrativos.
  6. *Privacidad y Anti-Bypass:* Enmascaramiento de datos de contacto y condiciones de revelación.
  7. *Usuario Inicial:* Asignación del primer administrador de la organización (`tenant_admin`).
  8. *Portal del Solicitante:* Habilitación de registro abierto y portal de autogestión.
  9. *Dominio:* Selección de subdominio o custom domain.
  10. *Validación y Activación en Caliente:* Resumen integral y guardado.

- **Capacidades Avanzadas:**
  - **Exportar Configuración JSON:** Genera payload seguro con schema version 1 (sin secretos ni PII).
  - **Importar Configuración JSON:** Carga masiva de módulos y reglas validando versión de esquema.
  - **Duplicación de Tenants:** Clona la configuración de un tenant fuente a uno destino.
  - **Creación sin redeploy:** Registra dinámicamente en Supabase y en memoria del navegador; la ruta `/org/:slug` queda disponible inmediatamente.

---

## 12. AUDITORÍA DEL SUPER ADMIN

Implementado en `SuperAdminTenantsPage.tsx` (`/admin/tenants`) y `AdminAiPage.tsx` (`/admin/ai`):

| Módulo Super Admin | Existe | Funciona | Completo | Tenant-aware | Observaciones |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Gestión de Organizaciones** | Sí | Sí | Sí | Sí | Lista todas las organizaciones y permite seleccionarlas. |
| **Conmutador de Módulos (Toggle)** | Sí | Sí | Sí | Sí | Activa/desactiva cualquiera de los 16 módulos en caliente. |
| **Editor de Reglas Crediticias** | Sí | Sí | Sí | Sí | Modifica límites de financiación (40%, 50%, 60%) en Supabase. |
| **Export/Import/Duplicate** | Sí | Sí | Sí | Sí | Modales funcionales con validación JSON. |
| **Reset Demo NOVA** | Sí | Sí | Sí | Sí | Botón directo con feedback en toast. |
| **Gobernanza de IA (Vault)** | Sí | Sí | Sí | No (Global) | Panel `/admin/ai`: Master switch, health-check, rotación de claves. |
| **Protección de Ruta en Cliente** | No | No | No | No | **Cualquiera que tipee `/admin/tenants` entra a la UI.** |

---

## 13. AUDITORÍA TÉCNICA DE MULTI-TENANCY Y RLS

### Calificación: 🟢 REAL Y SEGURO (Nivel Base de Datos) / 🟡 PARCIAL CON DEUDA (Nivel Frontend)

1. **Aislamiento en Base de Datos (PostgreSQL RLS):**
   - Las 55 tablas tienen `rowsecurity = true`.
   - Las consultas anónimas directas retornan 0 filas.
   - Las políticas RLS usan funciones seguras como `get_auth_organization_id()`, `is_member_of_org()` e `is_super_admin()`.
   - Los storage buckets son privados.
2. **Deuda Detectada en Frontend:**
   - En `AuthContext.signUp`, el registro de prestatarios asigna siempre el ID fijo de la matriz (`a0000000-0000-0000-0000-000000000001`), impidiendo que un prestatario quede registrado automáticamente bajo la organización de marca blanca desde la que se registró.
   - En `UsersManagementPage.tsx`, la consulta de miembros y el envío de invitaciones utiliza el ID quemado de la matriz.
   - Si una organización en Supabase está en estado `suspended` (como ocurrió con `atlas-cert`), `resolveTenant` retorna `NOT_FOUND_TENANT` de forma silenciosa.

---

## 14. NIVEL REAL DE PERSONALIZACIÓN WHITE-LABEL

| Elemento | Global | Tenant Específico | Admin Configurable | Hardcoded | Estado Actual |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Nombre Comercial** | No | Sí | Sí | No | 🟢 Configurable vía DB y Wizard |
| **Logotipo** | No | Sí | Sí | No | 🟢 Configurable vía URL / Storage |
| **Favicon** | No | Sí | Sí | No | 🟢 Configurable vía URL |
| **Color Primario** | No | Sí | Sí | No | 🟢 Inyectado vía CSS `--brand-green` |
| **Color Secundario** | No | Sí | Sí | No | 🟢 Configurable en branding |
| **Tipografía** | Sí | No | No | Sí | 🟡 Global (Inter en todo el sitio) |
| **Dominio Propio** | No | Sí | Sí | No | 🟢 Mapeado en `organization_domains` |
| **Emails Salientes** | No | Sí | No | Parcial | 🟡 Declarado en settings, falta proveedor |
| **Remitente Email** | No | Sí | No | Parcial | 🟡 Campo en DB, falta integración SMTP |
| **Teléfono de Soporte** | No | Sí | Sí | No | 🟢 Configurable en onboarding |
| **Pie de Página** | Sí | Parcial | No | Parcial | 🟡 Varía nombre comercial, links son fijos |
| **Términos y Políticas** | Sí | No | No | Sí | 🔴 Global y actualmente sin ruta |
| **Productos y Tasas** | No | Sí | Sí | No | 🟢 Dinámico en `tenant_lending_rules` |
| **LTV / % Financiado** | No | Sí | Sí | No | 🟢 Dinámico en simulador |
| **Montos y Plazos** | No | Sí | Sí | No | 🟢 Dinámico en simulador |
| **Desglose de Costos** | No | Sí | Sí | No | 🟢 Dinámico en `tenant_cost_configurations` |
| **Módulos Activos** | No | Sí | Sí | No | 🟢 16 feature flags independientes |
| **Textos Institucionales**| No | Sí | Sí | No | 🟢 Claim y taglines editables |
| **SEO Meta Tags** | Sí | No | No | Sí | 🔴 Global en `index.html` |
| **Analytics Propio** | No | No | No | No | 🔴 No implementado por tenant |

---

## 15. INVENTARIO DE MÓDULOS DEL SISTEMA

| Módulo | Backend (DB/API) | Frontend (UI) | Admin Configurable | Tenant-aware | Estado |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **1. Solicitudes Digitales (`application_module_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **2. Simulador Crediticio (`simulator_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **3. Portal del Solicitante (`client_portal_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **4. Backoffice Operativo (`staff_portal_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **5. Gestión Documental (`documents_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **6. Copiloto IA (`ai_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **7. Valuaciones Técnicas (`valuations_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **8. Coordinación de Firmas (`signatures_enabled`)** | Sí | Sí | Sí | Sí | 🟢 IMPLEMENTADO |
| **9. Servicing y Cartera (`servicing_enabled`)** | Sí | Sí | Sí | Sí | 🟢 IMPLEMENTADO |
| **10. Conciliación de Pagos (`payments_tracking_enabled`)**| Sí | Sí | Sí | Sí | 🟢 IMPLEMENTADO |
| **11. Recordatorios (`reminders_enabled`)** | Sí | Sí | Sí | Sí | 🟢 IMPLEMENTADO |
| **12. Cancelación Anticipada (`cancellations_enabled`)** | Sí | Sí | Sí | Sí | 🟢 IMPLEMENTADO |
| **13. Notificaciones (`notifications_enabled`)** | Sí | Sí | Sí | Sí | 🟢 IMPLEMENTADO |
| **14. Protección Anti-Bypass (`protected_contact_enabled`)**| Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **15. Desglose de Costos (`cost_breakdown_enabled`)** | Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |
| **16. Integración Externa (`external_simulator_integration`)**| Sí | Sí | Sí | Sí | 🟢 PRODUCTION READY |

---

## 16. AUDITORÍA DE INTELIGENCIA ARTIFICIAL (HIPOTECALY AI CORE)

- **Arquitectura de Agentes:** Multi-agente desacoplado en `server/ai/agents/`:
  - `DocumentIntelligenceAgent`: Clasificación documental (escrituras, títulos, cédulas) y OCR estructurado.
  - `PropertyValuationAgent`: Rango estimativo preliminar y confianza.
  - `ConsistencyAgent`: Cruce registral de padrón, titulares y superficies.
  - `UnderwritingAgent`: Calificación financiera según políticas de LTV.
  - `RiskAgent`: Matriz de riesgo crediticio y mitigantes.
  - `MemoryRetrievalAgent`: Consulta RAG en memoria global vectorizada (`pgvector`).
- **Seguridad y Privacidad:** `GlobalMemorySanitizer` elimina Cédulas de Identidad, nombres, teléfonos y montos sensibles antes de indexar en la memoria global.
- **Modelos Productivos Certificados:**
  - Extracción: `gpt-5.6-luna` (con fallback dinámico).
  - Razonamiento: `gpt-5.6-terra`.
  - Análisis Profundo: `gpt-5.6-sol`.
- **Gobernanza y Vault:** Integración server-side con Supabase Vault (`vault.secrets`). La clave no se expone al cliente ni a Vercel Git commits.
- **Monetización y Wallet:** Débito transaccional atómico en unidad comercial **CASOS AI** (`ai_wallets`), priorizando créditos promocionales gratuitos del mes antes de consumir saldo comprado.
- **Suite de Pruebas de IA:** 20 escenarios sintéticos en `tests/hipotecaly-ai-core.spec.ts` (40/40 tests PASS en 40s).
- **Clasificación General:** 🟢 **PRODUCTION READY**

---

## 17. AUDITORÍA DEL MARKETPLACE HIPOTECARIO E2E

- **Simulador:** 🟢 Funcional. Calcula cuotas estimadas en modalidad amortizable o solo intereses.
- **Wizard de Solicitud:** 🟢 Funcional. 4 pasos con guardado de borrador y subida de archivos privados.
- **Matching de Prestamistas:** 🟢 Funcional en base de datos (`match_application_to_lenders`).
- **Portal del Solicitante (`/mi-cuenta`):** 🟡 Parcial. Si no hay sesión iniciada, muestra datos ficticios en vez de requerir autenticación.
- **Portal del Prestamista (`/lender`):** 🟡 Parcial. La bandeja de oportunidades contiene datos mockeados en estado local.

---

## 18. AUDITORÍA DE BASE DE DATOS (SUPABASE POSTGRESQL)

Proyecto: `imzljdwsrsxyccgogfck` (Región: `us-west-2`, Engine: PostgreSQL 17, Status: `ACTIVE_HEALTHY`).

### Distribución de las 55 Tablas por Dominio Funcional:
1. **Multi-Tenancy & Organizaciones (8 tablas):** `organizations`, `organization_branding`, `organization_domains`, `organization_members`, `organization_invitations`, `organization_settings`, `organization_subscriptions`, `plans`.
2. **Módulos & Configuración SaaS (6 tablas):** `tenant_modules`, `tenant_lending_rules`, `tenant_cost_configurations`, `tenant_privacy_rules`, `tenant_templates`, `tenant_onboarding_status`.
3. **Marketplace & Solicitudes (13 tablas):** `applications`, `application_status_history`, `application_messages`, `borrowers`, `borrower_income`, `properties`, `property_photos`, `property_documents`, `property_valuations`, `opportunities`, `opportunity_assignments`, `offers`, `lender_offers`.
4. **Prestamistas & Reglas (2 tablas):** `lenders`, `lender_rules`.
5. **Backoffice Operativo (4 tablas):** `tasks`, `notes`, `data_disclosures`, `notifications`.
6. **Auditoría & Seguridad (4 tablas):** `audit_logs`, `tenant_audit_logs`, `ai_admin_audit_logs`, `profiles`.
7. **HIPOTECALY AI CORE (18 tablas):** `ai_model_settings`, `ai_model_pricing`, `ai_provider_settings`, `ai_wallets`, `ai_wallet_transactions`, `ai_promotional_credits`, `ai_case_runs`, `ai_case_usage`, `ai_usage_events`, `ai_document_analyses`, `ai_case_facts`, `ai_case_summaries`, `ai_valuations`, `ai_semaphore_items`, `ai_comparables`, `ai_corrections`, `ai_feedback`, `ai_global_memory`.

- **RPCs Clave Instaladas:** `deduct_ai_case_consumption`, `store_openai_vault_secret`, `get_openai_vault_secret_internal`, `match_global_memory`, `prevent_audit_logs_tampering`, `is_super_admin`, `is_member_of_org`.
- **Storage Buckets:** `property-photos` (privado), `application-documents` (privado).

---

## 19. AUDITORÍA DE SERVERLESS FUNCTIONS (BACKEND VERCEL API)

| Endpoint | Archivo | Objetivo | Tenant-aware | Auth Guard | Estado |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `/api/admin/ai/status` | `api/admin/ai/status.ts` | Consulta estado de OpenAI y Vault | No | SuperAdmin | 🟢 PRODUCTION READY |
| `/api/admin/ai/openai-key` | `api/admin/ai/openai-key.ts` | Guarda/elimina clave en Vault | No | SuperAdmin | 🟢 PRODUCTION READY |
| `/api/admin/ai/test-connection` | `api/admin/ai/test-connection.ts` | Valida clave contra OpenAI | No | SuperAdmin | 🟢 PRODUCTION READY |
| `/api/admin/ai/activate` | `api/admin/ai/activate.ts` | Master switch ON | No | SuperAdmin | 🟢 PRODUCTION READY |
| `/api/admin/ai/deactivate`| `api/admin/ai/deactivate.ts` | Master switch OFF | No | SuperAdmin | 🟢 PRODUCTION READY |
| `/api/admin/ai/health-check`| `api/admin/ai/health-check.ts`| Prueba real sin costo de CASOS | No | SuperAdmin | 🟢 PRODUCTION READY |
| `/api/ai/analyze` | `api/ai/analyze.ts` | Orquestación AI de expediente | Sí | Token usuario | 🟢 PRODUCTION READY |
| `/api/ai/wallet` | `api/ai/wallet.ts` | Saldo y recarga de CASOS AI | Sí | Token usuario | 🟢 PRODUCTION READY |
| `/api/ai/estimate` | `api/ai/estimate.ts` | Estimación de consumo previo | Sí | Token usuario | 🟢 PRODUCTION READY |
| `/api/ai/corrections` | `api/ai/corrections.ts` | Feedback humano para aprendizaje| Sí | Token usuario | 🟢 PRODUCTION READY |

---

## 20. AUDITORÍA DE INTEGRACIONES EXTERNAS

| Integración | Clasificación | Observaciones |
| :--- | :--- | :--- |
| **Supabase Cloud (DB & Auth)** | 🟢 CONECTADO | Base PostgreSQL activa en AWS us-west-2 con 55 tablas. |
| **Supabase Vault** | 🟢 CONECTADO | Almacenamiento seguro de credenciales con encriptación AEAD. |
| **OpenAI API** | 🟢 CONECTADO | Conexión con Responses y Chat Completions API para la IA. |
| **Vercel Hosting & Serverless**| 🟢 CONECTADO | Despliegue SPA con funciones en `/api`. |
| **Resend / SMTP Emails** | 🔵 PREPARADO | Campos `sender_email` en base de datos; falta vincular API key. |
| **Mercado Pago / Pasarela** | 🔵 PREPARADO | Tablas de pagos listas; falta SDK en checkout. |
| **Google Maps / Geocoding** | 🔴 NO UTILIZADO | Campos de dirección y departamento en texto plano. |
| **Clearing de Informes** | 🟡 PARCIAL / MOCK | Campo de estado en borrower; sin API bureau conectada. |

---

## 21. AUDITORÍA DE AUTENTICACIÓN, USUARIOS Y ROLES

Matriz de roles implementada en el sistema:

| Rol | Portal Asignado | Permisos Principales | Tenant Scoped | Estado Funcional |
| :--- | :--- | :--- | :---: | :--- |
| **`borrower`** | `/mi-cuenta` | Gestionar su propia solicitud y documentos | Sí | 🟢 Funcional en Supabase |
| **`tenant_admin`** | `/app` | Administrar operaciones y usuarios del estudio | Sí | 🟢 Funcional en RLS |
| **`analyst`** | `/app` | Evaluar legajos, cargar tasaciones y tareas | Sí | 🟢 Funcional en RLS |
| **`notary`** | `/app` | Revisar títulos e instrumentar firmas | Sí | 🟢 Funcional en RLS |
| **`lender`** | `/lender` | Ver oportunidades anónimas y emitir ofertas | Sí | 🟡 Parcial (UI mockeada) |
| **`super_admin`** | `/admin/*` | Gestionar organizaciones, módulos e IA global | No (Transversal) | 🟢 Funcional |

---

## 22. AUDITORÍA SEO

- **Sitemap XML:** `public/sitemap.xml` incluye 8 rutas principales. Faltan las rutas canónicas `/saas`, `/saas/integracion` y `/saas/plataforma-completa`.
- **Robots.txt:** Bloquea adecuadamente `/app/`, `/mi-cuenta/`, `/api/`, `/storage/`, `/lender/`.
- **Meta Tags:** Centralizados en `index.html`. Enfocados 100% en *"Préstamos con Garantía Hipotecaria en Uruguay"*. No existe etiquetado OpenGraph ni Schema.org específico para la oferta SaaS B2B.

---

## 23. AUDITORÍA DE ANALYTICS Y TELEMETRÍA

- **Herramientas Detectadas:** 0 (Cero).
- No hay scripts de Google Analytics 4, Meta Pixel, Hotjar ni Microsoft Clarity.
- No hay eventos de conversión medidos para:
  - Envío de simulador.
  - Creación de solicitud de crédito.
  - Solicitud de Demo B2B.

---

## 24. DEUDA VISUAL Y UX (P0, P1, P2, P3)

### P0 (Bloqueantes / Críticos)
1. **Enlaces rotos en Footer:** Los enlaces obligatorios a `/terminos`, `/privacidad` y `/seguridad` devuelven al Home por no estar registrados en el router.

### P1 (Muy Importantes)
2. **Desborde horizontal en Tablet Portrait (768px):** Detectado en suites de responsive visual (`visual-qa.spec.ts`).
3. **Ausencia de Route Guards en cliente:** El usuario puede navegar a `/app`, `/lender`, `/admin/tenants` sin redirección obligatoria a login.
4. **Formulario B2B en `/contacto` es volátil:** No almacena en base de datos ni envía email; el prospecto se pierde al refrescar.

### P2 (Mejoras Relevantes)
5. **Invisibilidad del SaaS en Navbar Desktop:** La cabecera pública de la Home no tiene pestaña hacia `/saas` o `/plataforma`.
6. **Hardcode de Identidad en Backoffice:** El sidebar de `/app` muestra siempre "HIPOTECALY Matriz / Tenant #1".
7. **Portal del Prestamista Desconectado:** Oportunidades y ofertas en `/lender` no leen la tabla `opportunities`.
8. **Métricas Fijas en Reportes:** `/app/reportes` muestra porcentajes estáticos.

### P3 (Polish)
9. **Warnings de ESLint:** 121 advertencias por uso de `any` y dependencias faltantes en `useEffect`.
10. **Animaciones y Microinteracciones:** Agregar feedback visual de carga en guardado de reglas en Super Admin.

---

## 25. INVENTARIO DE HARDCODEADOS

1. `'a0000000-0000-0000-0000-000000000001'` en `AuthContext.tsx` (líneas 50 y 132).
2. `'a0000000-0000-0000-0000-000000000001'` en `UsersManagementPage.tsx` (líneas 19, 29, 46, 58).
3. `'HIPOTECALY Matriz'` y `'Tenant #1'` en `BackofficeLayout.tsx` (líneas 74 y 77).
4. `opp-1`, `opp-2`, `opp-3` en `LenderDashboardPage.tsx` (líneas 11-55).
5. `off-1`, `off-2` en `LenderOffersPage.tsx` (líneas 8-29).
6. `'e0000000-0000-0000-0000-000000000001'` y `'c0000000-0000-0000-0000-000000000001'` en `LenderOpportunityDetailPage.tsx` (líneas 45-46).
7. `68.4%`, `48 hs`, `32.8%` en `OtherBackofficePages.tsx` (líneas 205, 211, 217).
8. Fallback key `'hipotecaly-superadmin-secret-live-2026'` en `superAdminGuard.ts` (línea 27).

---

## 26. INVENTARIO DE FEATURE FLAGS

16 módulos controlables por tenant en `tenant_modules` y `tenantModulesService.ts`:

1. `application_module_enabled`
2. `simulator_enabled`
3. `client_portal_enabled`
4. `staff_portal_enabled`
5. `documents_enabled`
6. `ai_enabled`
7. `valuations_enabled`
8. `signatures_enabled`
9. `servicing_enabled`
10. `payments_tracking_enabled`
11. `reminders_enabled`
12. `cancellations_enabled`
13. `notifications_enabled`
14. `protected_contact_enabled`
15. `cost_breakdown_enabled`
16. `external_simulator_integration_enabled`

---

## 27. CÓDIGO LEGACY, HUÉRFANO Y NO IMPORTADO

1. **`TenantNotFoundPage.tsx`:** No está registrado en `App.tsx`; solo se invoca como subcomponente interno dentro de `GenericWhiteLabelLanding.tsx`.
2. **Plantillas en `tenant_templates`:** Existen 3 filas en base de datos (`integration_basic`, `integration_complete`, `full_whitelabel`) replicadas en código en `OFFICIAL_TEMPLATES`.
3. **Mocks de respaldo en servicios:** `getApplicationsList` y `getOrganizationMembers` contienen fallbacks mockeados en memoria para cuando falla la red.

---

## 28. CONTRASTE: DOCUMENTACIÓN VS. REALIDAD

| Afirmación Documental | Código Confirma | Producción Confirma | Estado Real |
| :--- | :---: | :---: | :--- |
| *"HIPOTECALY opera con dos líneas comerciales sobre un mismo núcleo"* | Sí | Parcial | El código existe pero el SaaS no es visible desde la Home de escritorio. |
| *"Base de Datos con 23 tablas"* (README.md) | No (Superado) | Sí (55 tablas) | La documentación quedó atrasada respecto a las 55 tablas reales de Supabase. |
| *"Consola Super Admin de OpenAI con Vault 100% operativa"* | Sí | Sí | Confirmado: tablas `ai_provider_settings`, endpoints `/api/admin/ai/*`. |
| *"Onboarding completo en 10 pasos"* | Sí | Sí | Confirmado en `TenantOnboardingWizardPage.tsx`. |
| *"Portal de Prestamista 100% conectado"* | Parcial | No | En código la UI existe pero opera con datos estáticos hardcodeados. |
| *"Términos y Privacidad accesibles"* | No | No | Los enlaces en el Footer redirigen a la Home. |

---

## 29. RESULTADO DE COMPILACIÓN, BUILD Y TESTS

- **TypeScript Compiler (`tsc`):** ✅ **PASS** (0 errores).
- **Vite Build (`npm run build`):** ✅ **PASS** (Generó bundle de producción y Service Worker PWA en 11.04s).
- **ESLint (`npm run lint`):** ✅ **PASS** (0 errores, 121 warnings de tipos/hooks).
- **Playwright Suite Global:**
  - **Total de pruebas:** 368 tests ejecutados en 20 archivos.
  - **Pruebas aprobadas:** **343 PASS** (93.2%).
  - **Pruebas fallidas:** **25 FAIL** (6.8%).
  - **Causa raíz de los 25 fallos:**
    1. Tenant `atlas-cert` se encuentra con `status = 'suspended'` en la base de datos (hace fallar 6 tests de `atlas-third-tenant.spec.ts`).
    2. Tenant `estudio-notarial-este` no posee fila en `organizations` de Supabase Cloud (hace fallar tests de resolución estática vs cloud).
    3. Timeout en inserción remota de nuevo tenant ORION en `tenant-onboarding.spec.ts`.
    4. Desborde horizontal en Tablet 768px en `visual-qa.spec.ts`.
- **Suite AI Core (`tests/hipotecaly-ai-core.spec.ts`):** ✅ **40/40 PASS** (100% de éxito).

---

## 30. COMPARACIÓN REPO VS. PRODUCCIÓN CLOUD

- **Archivos locales no commiteados:** Modificaciones en `HIPOTECALY_AI_FINAL_GO_LIVE.md`, `api/admin/ai/health-check.ts`, `api/admin/ai/test-connection.ts`, `server/ai/config.ts`, `src/lib/ai/types.ts`, `src/pages/admin/AdminAiPage.tsx` correspondientes a la adopción de los modelos OpenAI `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-5.6-sol`.
- **Base de Datos Cloud:** La base Cloud cuenta con todas las migraciones 1 a 10 aplicadas y pobladas con los datos oficiales.

---

## 31. GAP ANALYSIS — HIPOTECALY SaaS

| Capacidad | Visión Objetivo | Estado Actual | Brecha (Gap) | Prioridad |
| :--- | :--- | :--- | :--- | :---: |
| **Descubrimiento B2B** | Home con selector dual visible | Home 95% B2C particular | Inexistencia de acceso SaaS en cabecera desktop | **P0** |
| **Captación de Leads B2B** | CRM / Base de prospectos con alertas | Formulario con alert local | Formulario en `/contacto` no guarda datos | **P0** |
| **Páginas Legales** | `/terminos`, `/privacidad` activas | Enlaces rotos en footer | Crear rutas y vistas legales | **P1** |
| **Aislamiento en Registro** | Prestatario queda en su tenant | Se asigna a matriz central | Parametrizar `signUp` con `tenant.id` | **P1** |
| **Portal Prestamistas** | Conectado a tabla `opportunities` | Arrays estáticos en memoria | Conectar consultas reales a Supabase | **P1** |
| **Guardas de Autenticación** | Redirección obligatoria a login | Rutas públicas abiertas | Implementar `<ProtectedRoute>` en `/app` y `/admin` | **P1** |
| **Tenant en Backoffice** | Nombre y logo dinámico del tenant | Texto fijo "HIPOTECALY Matriz" | Conectar `useTenant()` al sidebar | **P2** |
| **Telemetría y Analytics** | Eventos B2B y B2C diferenciados | 0 scripts instalados | Configurar GA4 / eventos de conversión | **P2** |

---

## 32. CUSTOMER JOURNEY B2B (SaaS CLIENT)

- [x] 🟢 **Google / LinkedIn / Referido:** Llega al sitio web.
- [ ] 🔴 **Entiende producto SaaS en Home:** No lo entiende si entra al dominio raíz (se percibe como financiera particular).
- [x] 🟢 **Explora solución B2B:** Excelente si entra directo a `/saas` o `/plataforma`.
- [x] 🟢 **Ve demostración interactiva:** Muy clara en `/demo/nova/legacy`, `/demo/nova/integrado` y `/demo/nova/full`.
- [ ] 🟡 **Solicita demo comercial:** Parcial (el formulario de contacto no persiste el lead).
- [x] 🟢 **Comercial crea organización:** Wizard completo de 10 pasos en `/admin/tenants/new`.
- [x] 🟢 **Onboarding & Branding:** Asigna colores, claim, logo y reglas.
- [x] 🟢 **Activación en caliente:** La ruta `/org/:slug` responde en vivo sin redeploy.
- [ ] 🟡 **Operación por el equipo del cliente:** Parcial (invitación de miembros en `/app/usuarios` hardcodea tenant central).

---

## 33. CUSTOMER JOURNEY BORROWER (SOLICITANTE)

- [x] 🟢 **Home & Simulador:** Simula montos y cuotas dinámicamente según LTV.
- [x] 🟢 **Wizard de Solicitud:** Completa datos, fotos y documentación privada.
- [x] 🟢 **Persistencia de Solicitud:** Guarda borrador y legajo en Supabase.
- [x] 🟢 **Evaluación con Copiloto IA:** Análisis automatizado de padrón, tasación y riesgo.
- [x] 🟢 **Matching con Prestamistas:** Motor SQL asigna solicitudes compatibles.
- [ ] 🟡 **Visualización de Ofertas:** Parcial (depende de sesión o cae a expediente demo).
- [ ] 🟡 **Seguimiento y Servicing:** UI implementada pero falta integración de pagos reales.

---

## 34. MATRIZ EJECUTIVA DE MADUREZ DE ESTADO

| Área | Estado | Madurez (0-5) | Bloqueantes Principales | Próximo Paso Recomendado |
| :--- | :--- | :---: | :--- | :--- |
| **Marketplace** | 🟢 Implementado | **4.2 / 5** | Pulir portal de ofertas en `/mi-cuenta` | Unificar sesión borrower real |
| **SaaS B2B Público** | 🟡 Parcial | **2.8 / 5** | Oculto en navegación desktop | Integrar selector en Header principal |
| **White-Label** | 🟢 Implementado | **4.0 / 5** | Signup asigna tenant central | Pasar `tenant.id` en `signUp()` |
| **Multi-Tenancy** | 🟢 Real y Seguro | **4.5 / 5** | Discrepancia de nomenclatura | Standarizar a `tenant_id` |
| **Super Admin** | 🟢 Implementado | **4.3 / 5** | Falta guarda de ruta | Proteger ruta con `verifySuperAdmin` |
| **Tenant Admin** | 🟡 Parcial | **3.2 / 5** | Sidebar hardcodeado | Conectar `useTenant()` en layout |
| **Borrower Portal** | 🟢 Implementado | **3.9 / 5** | Falta forzar login | Activar guardia de sesión |
| **Lender Portal** | 🟡 Parcial | **2.2 / 5** | Oportunidades mockeadas | Conectar a tabla `opportunities` |
| **UX & Visual** | 🟢 Implementado | **4.4 / 5** | Overflow en tablet 768px | Ajustar media queries en wizard |
| **Mobile / PWA** | 🟢 Production Ready | **4.7 / 5** | Ninguno | Certificado en 390px y 360px |
| **AI (HIPOTECALY AI)**| 🟢 Production Ready | **4.9 / 5** | Requiere saldo en CASOS | Operativo con OpenAI Vault |
| **Base de Datos** | 🟢 Production Ready | **4.8 / 5** | `atlas-cert` suspendido | Activar fila en DB |
| **SEO** | 🟡 Parcial | **2.5 / 5** | Meta tags 100% B2C | Agregar metadatos SaaS y schema |
| **Analytics** | 🔴 No Implementado | **0.0 / 5** | Sin scripts | Instalar GA4 y tags de conversión |
| **Commercial Readiness**| 🟡 Parcial | **2.9 / 5** | Formulario contacto mock | Conectar captación de leads a DB |

---

## 35. RESUMEN EJECUTIVO DE CIERRE

### A. ¿Qué es HIPOTECALY hoy realmente?
1. Una robusta plataforma PropTech/FinTech multi-tenant orientada a préstamos con garantía hipotecaria en Uruguay.
2. Posee una base de datos PostgreSQL en Supabase con 55 tablas, RLS rigurosa y Storage privado.
3. Cuenta con un motor de Inteligencia Artificial multi-agente (`HIPOTECALY AI CORE`) conectado a Supabase Vault y tarifado en CASOS.
4. Tiene un frontend React/Vite de nivel de producción con design system profesional y soporte PWA.
5. Dispone de un onboarding de clientes White-Label en 10 pasos con export/import JSON.
6. Permite conmutar 16 feature flags y editar reglas crediticias por tenant en caliente.
7. Dispone de 3 experiencias completas de demostración comercial bajo la marca ficticia NOVA.
8. Sufre de un problema severo de arquitectura de información pública: la Home es 95% para solicitantes particulares y oculta el SaaS a empresas.
9. El portal de prestamistas (`/lender`) y ciertas pantallas del backoffice (`/app/reportes`, `/app/usuarios`) tienen datos y textos hardcodeados.
10. La compilación y el build son 100% exitosos, pasando 343 de 368 pruebas Playwright.

### B. ¿Qué parte del SaaS está realmente construida?
- Páginas `/saas`, `/saas/integracion`, `/saas/plataforma-completa` y `/saas/precios`.
- Motor de feature flags (`tenant_modules`) con 16 módulos conmutables en tiempo real.
- Motor de reglas crediticias (`tenant_lending_rules`) con límites de LTV dinámicos en vivo.
- Consola de Super Admin de organizaciones (`/admin/tenants`).
- Consola de gobernanza de OpenAI Vault (`/admin/ai`).
- Sistema de Onboarding en 10 pasos (`/admin/tenants/new`).
- Resolución multi-tenant por URL `/org/:slug` y por dominios personalizados.

### C. ¿Qué parte está construida pero no visible?
- El acceso a `/saas` y `/plataforma` en la barra de navegación de escritorio.
- El acceso al Super Admin de inquilinos y al Super Admin de IA en los menús de la aplicación.
- El panel de control del prestamista `/lender`.
- Los componentes interactivos `AiAnalysisScorecard` y `BrandComparisonMockup` (restringidos a subpáginas específicas).

### D. ¿Qué documentación afirma cosas que producción no refleja?
- El `README.md` declara "23 tablas en Supabase", cuando en producción existen 55.
- Documentos de fases previas declaran que el portal del prestamista está 100% operativo, cuando en realidad opera con arrays fijos en memoria.
- Se menciona soporte completo de páginas legales en Footer, pero las URLs dan 404 blando.

### E. ¿Qué falta para venderlo seriamente como SaaS? (Top 10)
1. **Selector B2C / B2B visible en el Header principal:** Pestaña "Para Personas" vs. "Para Empresas / Plataforma".
2. **CTA B2B en la Home:** Bloque destacado para solicitar demo o conocer la tecnología.
3. **Formulario B2B persistente:** Guardar prospectos en tabla `saas_leads` y notificar por email/Slack.
4. **Protección de rutas (Route Guards):** Redirigir accesos no autenticados a `/ingresar`.
5. **Dinamizar el sidebar de `/app`:** Mostrar el nombre y logo de la organización activa en lugar de "HIPOTECALY Matriz".
6. **Vincular el registro con el tenant:** Que `signUp` asigne el ID de la organización desde donde se registró.
7. **Páginas legales activas:** `/terminos`, `/privacidad`, `/seguridad`.
8. **Conectar portal de prestamistas:** Alimentar `/lender` desde la tabla `opportunities`.
9. **Telemetría y Analytics:** Instalar GA4 para medir conversiones B2B por separado.
10. **Corregir desborde en tablet 768px:** Ajustar maquetación en pantallas medianas.

### F. ¿Qué falta para que el White-Label sea producto real? (Top 10)
1. Persistencia de prestatarios bajo el `tenant_id` correcto al registrarse.
2. Conexión real del guardado en `/app/organizacion` con `organization_branding`.
3. Dinamizar `/app/usuarios` con el `tenant_id` en contexto.
4. Soporte para carga de logo institucional directo a storage desde el backoffice.
5. Plantillas de email transaccionales personalizadas por tenant (nombre y remitente).
6. Configuración de textos legales y términos propios por tenant.
7. Soporte para favicon dinámico en el head del documento al cargar `/org/:slug`.
8. Posibilidad de pausar/suspender tenants desde la UI de Super Admin.
9. Activación de subdominios automáticos (ej. `cliente.hipotecaly.app`).
10. Sincronización offline robusta sin depender de fallbacks estáticos en código.

### G. ¿Qué falta en Marketplace? (Top 10)
1. Requerir login formal para ver ofertas en `/mi-cuenta`.
2. Conexión de pasarela de pagos para seña o gastos de tasación.
3. Notificaciones push / SMS al prestatario ante cambios de estado del crédito.
4. Firma digital o coordinación notarial con agenda en tiempo real.
5. Carga de comprobantes de pago de cuotas en etapa de servicing.
6. Comparador interactivo de ofertas de diferentes prestamistas.
7. Chat interno seguro entre analista del expediente y solicitante.
8. Geolocalización automática de padrones inmobiliarios en Uruguay.
9. Integración con score crediticio local (Clearing).
10. Encuesta de satisfacción y recomendación al cierre de la operación.

### H. Riesgos Técnicos Principales (Top 10)
1. **Fuga de contexto en registro:** Prestatarios de marcas blancas quedan mezclados en la organización matriz en Supabase.
2. **Acceso irrestricto a pantallas operativas:** Falta de guardas en cliente expone la estructura de `/app` y `/admin`.
3. **Clave secreta de fallback hardcodeada en `superAdminGuard.ts`:** Riesgo de bypass si no se define variable de entorno.
4. **Pérdida de leads comerciales:** El formulario de `/contacto` no guarda en base de datos.
5. **Divergencia entre DB y código en resolución de tenants:** Si un tenant no existe en DB, la consulta autoritativa anula el fallback local.
6. **Manejo de CORS y Serverless Rewrites en Vercel:** Revisar precedencia de rutas `/api` vs `/(.*)`.
7. **Expiración de cuotas OpenAI:** Si no hay saldo en la cuenta de OpenAI configurada, las llamadas a la IA fallan (aunque el orquestador maneja fallback resiliente).
8. **121 warnings de ESLint:** Potenciales bugs de dependencias de hooks no declaradas.
9. **Desborde responsive en tablets:** Puede degradar la experiencia de usuarios en iPad / tablets notariales.
10. **Ausencia de backups automatizados documentados en la capa serverless.**

### I. Quick Wins (Alto Impacto / Bajo Esfuerzo)
1. **Agregar botón "Plataforma SaaS" en el Navbar de la Home:** Redirige tráfico empresarial hacia `/saas`. (10 minutos).
2. **Registrar las rutas `/terminos`, `/privacidad` y `/seguridad` en `App.tsx`:** Elimina el 100% de enlaces rotos en el Footer. (15 minutos).
3. **Conectar `useTenant()` al Navbar del Backoffice:** Reemplaza "HIPOTECALY Matriz" por el nombre de la organización actual. (15 minutos).
4. **Guardar leads de `/contacto` en Supabase:** Crear tabla `leads` y persistir en el submit del formulario. (30 minutos).
5. **Activar fila de `atlas-cert` en Supabase:** Cambiar status de `'suspended'` a `'active'` recupera de inmediato 6 tests fallidos. (5 minutos).

### J. Inventario Inicial de Add-Ons Posibles
- **Core:** Motor de cálculo avanzado de amortización francesa y alemana; exportador de legajo notarial en PDF foliado.
- **Growth:** Simulador integrable vía iframe/script embebible para sitios externos de inmobiliarias y brokers.
- **Automation:** Automatización de recordatorios de vencimiento de certificados registrales vía WhatsApp (Twilio/WPP Cloud API).
- **AI:** Agente de análisis de planos arquitectónicos y detección de gravámenes ocultos en certificados de la DGR.
- **Risk:** Matriz de riesgo paramétrica con ponderación de zona geográfica en Uruguay (Montevideo, Punta del Este, Colonia).
- **Documents:** OCR inteligente con extracción automática de padrones y deslindes desde PDFs notariales escaneados.
- **Valuation:** Integración con comparables inmobiliarios de portales de Uruguay.
- **CRM:** Pipeline Kanban interactivo tipo HubSpot/Pipedrive para seguimiento de leads hipotecarios.
- **Servicing:** Portal de pagos y descarga automática de recibos de cuotas mensuales para inversores.
- **Payments:** Pasarela de cobro integrada con transferencias bancarias locales (SISTARBANC / PagosWeb).
- **Communication:** Centro de mensajería cifrada entre prestatario, prestamista y escribano con aviso de lectura.
- **Compliance:** Módulo de prevención de lavado de activos (PLA/FT) con matriz de debida diligencia de clientes.
- **Analytics:** Tablero analítico para inversores con tasa interna de retorno (TIR) y valor actual neto (VAN) de la cartera.
- **Integrations:** Webhooks salientes hacia sistemas de gestión de estudios contables y notariales.
- **Enterprise:** Registro de auditoría exportable bajo formato inmutable para auditorías externas del BCU.

---

## 36. ROADMAP PRELIMINAR PARA ETAPAS POSTERIORES

```
[FASE 0] ──> [FASE 1] ──> [FASE 2] ──> [FASE 3] ──> [FASE 4] ──> [FASE 5] ──> [FASE 6] ──> [FASE 7]
Hotfixes      Reposic.     UX Market-   White-Label   Automatiz.    IA Add-ons    Add-Ons       Enterprise
Críticos      SaaS Home    place E2E    Integral      & Procesos    Avanzados     Comerciales   & APIs
```

- **FASE 0: Correcciones Críticas (Día 1):**
  - Registro de rutas legales (`/terminos`, `/privacidad`, `/seguridad`).
  - Resolución de enlaces rotos y protección básica de rutas administrativas.
  - Activación de tenant ATLAS en base de datos.
- **FASE 1: Reposicionamiento SaaS Público:**
  - Inclusión de pestaña B2B / SaaS en Header y Footer de la Home.
  - Sección comercial B2B destacada en la Home ("¿Sos prestamista o estudio?").
  - Conexión real de formulario de leads comerciales con base de datos.
- **FASE 2: Perfeccionamiento UX Marketplace:**
  - Autenticación rigurosa en `/mi-cuenta`.
  - Conexión dinámica del Portal del Prestamista (`/lender`) con solicitudes reales.
- **FASE 3: White-Label Comercial Completo:**
  - Vinculación estricta de prestatarios al `tenant_id` durante el registro.
  - Dinamización de `BackofficeLayout`, `UsersManagementPage` y `OrganizationSettingsPage`.
- **FASE 4: Automatización & Notificaciones:**
  - Integración de proveedor de correos transaccionales (Resend).
  - Alertas automáticas por cambio de estado de expediente.
- **FASE 5: Expansión de IA:**
  - Activación visual masiva del tab de IA en expedientes.
  - Extracción OCR automática de padrones y comparación de escrituras.
- **FASE 6: Add-Ons Comerciales:**
  - Módulo de cobros y conciliación de cuotas.
  - Simulador embeddable para sitios de terceros.
- **FASE 7: Enterprise & API:**
  - Webhooks salientes y documentación de API pública para financieras.

---

## CONCLUSIÓN

HIPOTECALY cuenta con un núcleo de software moderno, altamente modular, seguro y con un nivel de avance técnico excepcional en su arquitectura backend y en su motor de Inteligencia Artificial. La brecha principal no es tecnológica, sino de **arquitectura de información, visibilidad comercial y cierre de cabos sueltos en el frontend**. Con las correcciones de base documentadas en este informe, la plataforma se encuentra en una posición inmejorable para iniciar la etapa de update, escalamiento y lanzamiento comercial.
