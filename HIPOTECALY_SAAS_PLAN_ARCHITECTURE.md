# HIPOTECALY — ARQUITECTURA DE PLANES SAAS & PACKAGING COMERCIAL (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 5 (Modular SaaS Product Catalog & Entitlements)  
**Referencia de Código:** [`src/lib/pricingEngine.ts`](src/lib/pricingEngine.ts), [`src/lib/moduleCatalogService.ts`](src/lib/moduleCatalogService.ts)  

---

## 1. PRINCIPIOS DE EMPAQUETAMIENTO

La estrategia de empaquetamiento comercial de **HIPOTECALY** está diseñada para cubrir desde operadores individuales y estudios boutique hasta instituciones financieras y bancos regulados, manteniendo una única base de código multi-tenant modular:

1. **Crecimiento Orgánico (Land & Expand):** Comienza con digitalización de la originación y expande progresivamente hacia inteligencia, sindicación y servicing.
2. **Predictibilidad de Costos:** Los planes base incluyen usuarios y expedientes activos; el escalamiento se basa en cuotas de uso claras.
3. **Aislamiento Técnico Inviolable:** Todos los planes operan con aislamiento de datos a nivel de base de datos (RLS) y encriptación en tránsito y reposo.
4. **Transparencia Absoluta:** No existen costos ocultos ni capacidades "fantasma". Todo módulo en el catálogo indica con precisión su nivel y dependencias.

---

## 2. MATRIZ COMPARATIVA DE PLANES

| Dimensión | Plan START | Plan PROFESSIONAL | Plan PLATFORM | Plan ENTERPRISE |
| :--- | :--- | :--- | :--- | :--- |
| **Público Objetivo** | Prestamistas individuales, escribanías y estudios boutique | Financieras medianas, cooperativas y estudios activos | Financieras consolidadas, fondos privados y originadores masivos | Bancos comerciales, fondos institucionales y redes nacionales |
| **Enfoque Principal** | Digitalización básica de solicitudes y matching | Flujo integral con IA asistiva y CRM de originación | Core llave en mano con marca blanca total y servicing post-cierre | Infraestructura dedicada, integración API total y alta disponibilidad |
| **Usuarios Incluidos** | Hasta 2 usuarios | Hasta 5 usuarios | Hasta 15 usuarios | Usuarios ilimitados |
| **Expedientes Activos** | Hasta 10 expedientes | Hasta 35 expedientes | Hasta 100 expedientes | Capacidad dedicada / custom |
| **Módulos Core** | ✅ Incluido | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Portal Prestamista** | ✅ Incluido (Anti-Bypass) | ✅ Incluido (Anti-Bypass) | ✅ Incluido (Anti-Bypass) | ✅ Incluido (Anti-Bypass) |
| **Portal Solicitante** | ✅ Incluido | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **White-Label Branding** | Básico (logo / colores) | Básico (logo / colores) | Avanzado (logo, colores, emails) | Marca blanca total 100% |
| **Dominio Propio (SSL)** | Add-on | Add-on | ✅ Incluido | ✅ Incluido |
| **Document Intelligence** | Add-on | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Risk Copilot (IA)** | Add-on | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **CRM Comercial** | ❌ | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Widget Embebible** | Add-on | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Sindicación de Deuda** | ❌ | Add-on | ✅ Incluido | ✅ Incluido |
| **Loan Servicing** | ❌ | Add-on | ✅ Incluido | ✅ Incluido |
| **Tasaciones Periciales** | ❌ | Add-on | ✅ Incluido | ✅ Incluido |
| **API REST & Webhooks** | ❌ | ❌ | ❌ | ✅ Incluido |
| **SSO Corporativo (SAML)**| ❌ | ❌ | ❌ | ✅ Incluido |
| **SLA de Soporte** | Email (48 hs) | WhatsApp + Email (24 hs) | Dedicated Account Manager (8 hs) | SLA 99.9% 24/7 dedicado |

---

## 3. ASIGNACIÓN DE MÓDULOS POR PLAN

### Plan START
- `core_tenancy`
- `core_auth_rbac`
- `origination_simulator`
- `origination_intake_wizard`
- `origination_borrower_portal`
- `capital_lender_portal`
- `capital_antibypass`
- `docs_storage_checklists`
- `risk_engine_rules`
- `valuation_property_profile`
- `compliance_audit_logs`
- `whitelabel_custom_branding`

### Plan PROFESSIONAL (Añade a START)
- `docs_ai_intelligence`
- `risk_ai_consistency`
- `crm_leads_management`
- `automation_events_triggers`
- `comm_notification_center`
- `integrations_embed_widget`

### Plan PLATFORM (Añade a PROFESSIONAL)
- `capital_syndication`
- `valuation_appraisal_network`
- `servicing_loan_management`
- `servicing_payment_reconciliation`
- `whitelabel_custom_domain`
- `analytics_advanced_reporting`

### Plan ENTERPRISE (Añade a PLATFORM)
- `integrations_public_api`
- `enterprise_sso` (cuando esté disponible en roadmap)
- Capacidad de almacenamiento y telemetría dedicada.

---

## 4. SISTEMA DE GATING Y CONSUMO

El acceso a componentes y rutas en el frontend está protegido por el componente `<ModuleGate moduleId="...">`:
- Si el tenant cuenta con el módulo activo: renderiza el contenido sin penalización de rendimiento.
- Si el tenant no cuenta con el módulo: renderiza un banner informativo amigable explicando el valor del módulo con un botón CTA para solicitar la activación o mejora de plan al administrador.

La telemetría de cuotas se audita en [`usageMeteringService.ts`](src/lib/usageMeteringService.ts), permitiendo a los administradores de la organización monitorear el consumo de usuarios, expedientes y llamadas a servicios de inteligencia.
