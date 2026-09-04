# HIPOTECALY — MASTER MODULE REGISTRY (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase de Implementación:** Macrofase 5 (Modular SaaS Product Catalog & Entitlements)  
**Estado:** Producción / Certificado  

---

## 1. INTRODUCCIÓN

El Registro Maestro de Módulos define la totalidad de componentes funcionales de la plataforma **HIPOTECALY**. Cada módulo cuenta con un identificador unívoco (`moduleId`), pertenencia categórica, modelo de empaquetamiento comercial (Base / Add-on / Enterprise / Roadmap), requisitos de dependencias y estado de disponibilidad en backend y frontend.

La arquitectura de activación está respaldada por [`moduleCatalogService.ts`](src/lib/moduleCatalogService.ts), que garantiza:
1. **Validación Cíclica y de Precedencia:** No es posible activar un módulo sin que sus dependencias mandatorias estén activas.
2. **Protección contra Huérfanos:** No es posible desactivar un módulo si otros módulos activos dependen de él.
3. **Tenant-Aware Entitlement:** Cada tenant cuenta con su registro de módulos autorizados, persistente y auditable.

---

## 2. INVENTARIO COMPLETO DE MÓDULOS

| Module ID | Nombre del Módulo | Categoría | Backend | Frontend | Tenant-Aware | Nivel / Tier | Estado Comercial | Dependencias |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `core_tenancy` | Multi-Tenancy & Tenant Resolver | Core | ✅ | ✅ | ✅ | Included | `available` | *(Ninguna)* |
| `core_auth_rbac` | Autenticación & RBAC Base | Core | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `origination_simulator` | Simulador Hipotecario Paramétrico | Originación | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `origination_intake_wizard` | Asistente Digital de Solicitudes | Originación | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy`, `core_auth_rbac`, `origination_simulator` |
| `origination_borrower_portal` | Portal del Solicitante (Mi Cuenta) | Originación | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy`, `core_auth_rbac`, `origination_intake_wizard` |
| `capital_lender_portal` | Portal del Prestamista & Feed de Oportunidades | Capital | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy`, `core_auth_rbac` |
| `capital_antibypass` | Blindaje Anti-Bypass & Anonimización Progresiva | Capital | ✅ | ✅ | ✅ | Included | `available` | `capital_lender_portal` |
| `capital_syndication` | Sindicación Multi-Inversor & Tranches | Capital | ✅ | ✅ | ✅ | Add-on | `addon` | `capital_lender_portal` |
| `docs_storage_checklists` | Expediente Documental & Checklists | Documents | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy`, `core_auth_rbac` |
| `docs_ai_intelligence` | Document Intelligence Asistivo | Documents | ✅ | ✅ | ✅ | Add-on | `addon` | `docs_storage_checklists` |
| `risk_engine_rules` | Motor Paramétrico de Reglas Crediticias | Risk | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `risk_ai_consistency` | Risk & Consistency Copilot | Risk | ✅ | ✅ | ✅ | Add-on | `addon` | `risk_engine_rules` |
| `valuation_property_profile` | Ficha Catastral & Perfil de Inmueble | Valuation | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `valuation_appraisal_network` | Red y Módulo de Tasaciones Periciales | Valuation | ✅ | ✅ | ✅ | Add-on | `addon` | `valuation_property_profile` |
| `crm_leads_management` | Pipeline Comercial de Solicitudes & Leads | CRM | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy`, `core_auth_rbac` |
| `automation_events_triggers` | Motor de Automatizaciones & Recordatorios | Automation | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `servicing_loan_management` | Loan Servicing & Calendario de Cuotas | Servicing | ✅ | ✅ | ✅ | Add-on | `addon` | `core_tenancy` |
| `servicing_payment_reconciliation` | Conciliación de Comprobantes & Pagos | Payments | ✅ | ✅ | ✅ | Add-on | `addon` | `servicing_loan_management` |
| `comm_notification_center` | Centro Unificado de Notificaciones | Communication | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `whitelabel_custom_branding` | Identidad Corporativa & Paleta CSS | White-Label | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `whitelabel_custom_domain` | Dominio Personalizado & Certificado SSL | White-Label | ✅ | ✅ | ✅ | Add-on | `addon` | `whitelabel_custom_branding` |
| `integrations_embed_widget` | Widget Embebido de Simulación | Integrations | ✅ | ✅ | ✅ | Included | `available` | `origination_simulator` |
| `integrations_public_api` | API REST & Webhooks para Desarrolladores | Integrations | ✅ | ✅ | ✅ | Enterprise | `enterprise` | `core_tenancy`, `core_auth_rbac` |
| `integrations_dgr_registry` | Conexión Directa DGR (Registro Oficial) | Integrations | ❌ (Roadmap) | ❌ (Roadmap) | ✅ | Coming Soon | `roadmap` | `docs_storage_checklists` |
| `analytics_advanced_reporting` | Tableros de Métricas & Embudo | Analytics | ✅ | ✅ | ✅ | Add-on | `addon` | `core_tenancy` |
| `compliance_audit_logs` | Bitácora Forense de Auditoría Inmutable | Compliance | ✅ | ✅ | ✅ | Included | `available` | `core_tenancy` |
| `enterprise_sso` | Single Sign-On (SSO) SAML / OIDC | Enterprise | ❌ (Roadmap) | ❌ (Roadmap) | ✅ | Enterprise | `enterprise` | `core_auth_rbac` |

---

## 3. CATEGORÍAS FUNCIONALES

### 3.1 Core & Gobernanza
- **`core_tenancy`**: Base multi-tenant con resolución por header, subdominio y variable de entorno.
- **`core_auth_rbac`**: Roles canónicos de plataforma: `admin`, `analyst`, `lender`, `borrower`.
- **`compliance_audit_logs`**: Registro inmutable de transacciones, ofertas, accesos e inspecciones.

### 3.2 Originación & Solicitudes
- **`origination_simulator`**: Motor financiero de cuotas, amortizaciones y simulación LTV.
- **`origination_intake_wizard`**: Captura progresiva de datos personales, laborales y colaterales.
- **`origination_borrower_portal`**: Espacio autogestionado para el prestatario.
- **`integrations_embed_widget`**: Widget iFrame o script embebible en portales de terceros.

### 3.3 Colateral, Valuación y Expediente
- **`valuation_property_profile`**: Ficha del inmueble, georreferenciación y padrón.
- **`valuation_appraisal_network`**: Protocolo de tasación formal con profesionales idóneos.
- **`docs_storage_checklists`**: Repositorio seguro categorizado con control de completitud.
- **`docs_ai_intelligence`**: Extracción automática asistida y detección de inconsistencias.

### 3.4 Capital, Matching & Mercado
- **`capital_lender_portal`**: Vista de oportunidades anonimizadas para inversores.
- **`capital_antibypass`**: Reglas de anonimización y bloqueo de bypass extra-plataforma.
- **`capital_syndication`**: Fraccionamiento de participaciones crediticias entre múltiples inversores.

### 3.5 Riesgo, Decisión y CRM
- **`risk_engine_rules`**: Parámetros de scoring, topes LTV y límites por zona/tipo de inmueble.
- **`risk_ai_consistency`**: Verificación cruzada entre ingresos declarados y garantías colaterales.
- **`crm_leads_management`**: Tablero Kanban comercial y seguimiento de clientes potenciales.

### 3.6 Automatización & Notificaciones
- **`automation_events_triggers`**: Eventos automáticos desencadenados por hitos del expediente.
- **`comm_notification_center`**: Bandeja multicanal in-app y correo electrónico con marca blanca.

### 3.7 Servicing & Finanzas Post-Cierre
- **`servicing_loan_management`**: Administración del crédito otorgado, calendario de cuotas y vencimientos.
- **`servicing_payment_reconciliation`**: Conciliación de comprobantes de pago de cuotas y desembolsos.

### 3.8 White-Label & Enterprise
- **`whitelabel_custom_branding`**: Logotipos, tipografías, colores primarios/secundarios por organización.
- **`whitelabel_custom_domain`**: Configuración de CNAME, certificados SSL y resolución host.
- **`integrations_public_api`**: Endpoints protegidos para integración con ERPs y CRMs bancarios.
- **`enterprise_sso`**: Autenticación corporativa SAML 2.0 / OpenID Connect.
