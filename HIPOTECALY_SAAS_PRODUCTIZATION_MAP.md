# HIPOTECALY — MAPA DE PRODUCTIZACIÓN COMERCIAL SaaS
## TRADUCCIÓN DE CAPACIDADES TÉCNICAS A MÓDULOS COMERCIALIZABLES

**Documento Oficial:** Macrofase 4A  
**Fecha:** 4 de Septiembre de 2026  
**Auditor / Arquitecto:** Antigravity (Google DeepMind - Advanced Agentic Coding)  
**Baseline:** Capacidades Certificadas en Macrofase 2–3 (`HIPOTECALY_PHASE_2_3_REPORT.md`)  
**Estado:** **APROBADO**

---

## 1. PRINCIPIO DE HONESTIDAD TÉCNICO-COMERCIAL

> **Regla Anti-Vaporware:** Ninguna funcionalidad futura o en desarrollo se presentará al mercado como existente. Todo módulo comercializable mapeado en este documento cuenta con respaldo en código probado y políticas RLS activas en Supabase Cloud.

---

## 2. MATRIZ DE MÓDULOS COMERCIALES DE HIPOTECALY PLATFORM

| Módulo Comercial | Capacidad Técnica Subyacente | Disponibilidad | Descripción de Valor para el Cliente |
| :--- | :--- | :---: | :--- |
| **Simulador Inteligente Parametrizado** | `rulesService.ts`, `SimulatorPage.tsx` | **Disponible** | Calculador interactivo de capacidad de crédito basado en LTV, montos mínimos/máximos y plazo. Configurable en caliente por tenant. |
| **Asistente de Solicitud Digital (8 Pasos)** | `ApplicationWizard.tsx`, `wizardService.ts` | **Disponible** | Embudo de intake de solicitudes con autoguardado en borrador, subida de fotos y checklist documental. |
| **Portal del Prestatario (PWA)** | `ApplicantAccount.tsx`, `AuthContext.tsx` | **Disponible** | Entorno privado para que el solicitante consulte el estado de su legajo, cargue documentos observados y acepte ofertas. |
| **Backoffice Notarial y Operativo** | `/app/*`, `backofficeService.ts` | **Disponible** | Bandeja de expedientes, asignación de analistas, revisión documental, notas internas de riesgo y cambio de estados. |
| **Motor de Matching Algorítmico** | `matchingService.ts`, scoring multidimensional | **Disponible** | Cruce automático entre solicitudes aprobadas y tesis de inversión de los prestamistas (LTV, ubicación, Clearing). |
| **Portal del Inversor / Prestamista** | `/lender/*`, `LenderDashboardPage.tsx` | **Disponible** | Feed de oportunidades anonimizadas, calculadora de cuotas (Francesa vs Interés Puro) y emisión de ofertas formales. |
| **Protocolo Anti-Bypass & Desintermediación**| Doble capa RLS en Supabase + frontend | **Disponible** | Ocultamiento estricto de PII, dirección exacta y número de padrón catastral. Cero filtraciones antes de formalizar. |
| **Gestión Documental y Storage Cifrado** | Supabase Storage privado + RLS | **Disponible** | Buckets aislados por organización con URLs firmadas de expiración corta. Bloqueo de descargas no autorizadas. |
| **Políticas Crediticias Dinámicas en Vivo** | `tenantRulesService.ts`, tabla `tenant_lending_rules` | **Disponible** | Ajuste en tiempo real de LTV máximo (30%-60%), tope en USD y tasas de interés desde Super Admin sin redeploy. |
| **Matriz de 16 Feature Flags en Caliente** | `tenantOnboardingService.ts`, `tenant_modules` | **Disponible** | Capacidad de activar o desactivar módulos de software para cada cliente de forma granular con actualización instantánea. |
| **Alta de Clientes Llave en Mano (Onboarding)** | `TenantOnboardingWizardPage.tsx` | **Disponible** | Creación completa de un nuevo tenant con branding, reglas y módulos en 30 segundos sin tocar código React. |
| **Branding Dinámico Multi-Tenant (White-Label)**| Inyección de variables CSS y assets | **Disponible** | Logotipo propio, claim, favicon y paleta de colores (`--tenant-primary`, `--tenant-secondary`) inyectados en runtime. |
| **Resolución Dinámica por Dominio / Subdominio** | `tenantService.ts` (`/org/:slug` y dominios DNS) | **Disponible** | Un único despliegue sirve a infinitos clientes bajo su propio dominio (`creditos.tuempresa.uy`) o ruta dedicada. |
| **Transparencia de Costos Notariales y Cierre** | `tenant_cost_configurations` | **Disponible** | Desglose paramétrico de aranceles notariales, timbres, montepío, certificados e impuestos previo a la firma. |
| **Copiloto IA de Admisión y Estudio Registral** | Motor LLM asistido con Vault de claves | **Opcional** | Extracción automática de datos de cédulas y títulos, resumen de antecedentes y alertas de gravámenes. |
| **Firma Electrónica Avanzada** | Integración notarial electrónica | **Próximamente** | En roadmap para formalización remota de contratos hipotecarios según normativa nacional. |
| **Servicing Automatizado y Débito de Cuotas** | Motor de cobranza y pasarela bancaria | **Próximamente** | En roadmap para la administración y monitoreo de pagos de cuotas mensuales post-desembolso. |

---

## 3. ARQUITECTURA VISUAL DEL WHITE-LABEL ("ONE CORE, INFINITE BRANDS")

```
                      ┌─────────────────────────────────────────┐
                      │          HIPOTECALY CORE PLATFORM       │
                      │  PostgreSQL + RLS + Matching + Storage  │
                      └────────────────────┬────────────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            │                              │                              │
            ▼                              ▼                              ▼
 ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
 │   CLIENTE A (NOVA)   │       │   CLIENTE B (ORION)  │       │  CLIENTE C (ATLAS)   │
 ├──────────────────────┤       ├──────────────────────┤       ├──────────────────────┤
 │ Dominio Propio       │       │ Dominio Propio       │       │ Dominio Propio       │
 │ demo.novacredito.uy  │       │ orioncredito.uy      │       │ atlasinversiones.uy  │
 │                      │       │                      │       │                      │
 │ Branding:            │       │ Branding:            │       │ Branding:            │
 │ Verde Nova / Azul    │       │ Esmeralda / Grafito  │       │ Azul Marino / Oro    │
 │                      │       │                      │       │                      │
 │ Reglas:              │       │ Reglas:              │       │ Reglas:              │
 │ LTV Máx: 50%         │       │ LTV Máx: 45%         │       │ LTV Máx: 40%         │
 │ Tope: USD 250.000    │       │ Tope: USD 180.000    │       │ Tope: USD 300.000    │
 │                      │       │                      │       │                      │
 │ Módulos:             │       │ Módulos:             │       │ Módulos:             │
 │ Todos activos (16)   │       │ Sin Copiloto IA      │       │ Solo Originación B2B │
 └──────────────────────┘       └──────────────────────┘       └──────────────────────┘
```

---

## 4. ESTRATEGIA DE PRICING Y MODELO COMERCIAL (CONFORME A REGLA 63)

Para evitar la invención de precios ficticios que desvirtúen la negociación B2B, HIPOTECALY adopta un modelo de **propuestas consultivas a medida** estructurado en tres niveles:

### Plan 1: Profesional (Para Estudios Notariales y Tasadores)
- **Destinado a:** Estudios jurídicos y escribanías que gestionan entre 5 y 20 operaciones mensuales.
- **Incluye:**
  - Hasta 3 usuarios operativos (analistas / notarios).
  - Repositorio documental privado y checklist de títulos.
  - Generación de legajos digitales estructurados.
  - Soporte estándar.
- **CTA:** `Solicitar Propuesta para Estudios` $\rightarrow$ `/contacto?plan=profesional`.

### Plan 2: Business (Para Financieras y Originadores)
- **Destinado a:** Empresas de crédito con equipo comercial y mesa de análisis propia.
- **Incluye:**
  - Usuarios y analistas ilimitados.
  - Asistente de solicitud digital personalizable.
  - Portal de autogestión de clientes prestatarios.
  - Motor de reglas crediticias (LTV, montos y tasas a medida).
  - Backoffice con activity feed y auditoría inmutable.
- **CTA:** `Solicitar Propuesta Business` $\rightarrow$ `/contacto?plan=business`.

### Plan 3: White-Label Enterprise (Infraestructura Dedicada)
- **Destinado a:** Grandes operadores hipotecarios, bancos privados y family offices.
- **Incluye:**
  - 100% White-Label: Cero menciones a HIPOTECALY en toda la experiencia.
  - Dominio web personalizado con aprovisionamiento automático de certificado SSL.
  - Paleta de marca, tipografía y assets propios.
  - Portal de prestamistas con Anti-Bypass integrado.
  - Base de datos con aislamiento estricto RLS y SLA corporativo garantizado.
- **CTA:** `Solicitar Propuesta White-Label` $\rightarrow$ `/contacto?plan=whitelabel`.
