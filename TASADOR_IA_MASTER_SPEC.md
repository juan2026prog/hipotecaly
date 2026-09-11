# HIPOTECALY — TASADOR IA
## DOCUMENTO MAESTRO DE ESPECIFICACIÓN TÉCNICA (MASTER SPEC V1.0)
### CERTIFICACIÓN INTEGRAL DE PRODUCCIÓN — FASES 0 A 7

---

## 1. PRINCIPIO RECTOR Y DECLARACIÓN DE PROPÓSITO

El **Tasador IA** de HIPOTECALY es un motor de inteligencia inmobiliaria determinístico, asistido por visión computacional en modo sombra (*Shadow Mode*), diseñado para proporcionar estimaciones objetivas de valor de mercado, rangos estadísticos de dispersión y puntuaciones de suficiencia (*Confidence*) para garantías hipotecarias en la República Oriental del Uruguay.

### Reglas de Oro Inquebrantables:
1. **CERO DECISIÓN CREDITICIA AUTOMÁTICA:** El Tasador IA emite exclusivamente una señal cuantitativa de valor de mercado y suficiencia de datos. Nunca aprueba, rechaza, altera tasas, plazos ni fija de forma vinculante el LTV crediticio.
2. **AI MONETARY WEIGHT = 0 (SHADOW MODE):** La inteligencia artificial (LLM y Visión) describe, extrae terminaciones y analiza estado aparente, pero **no modifica el precio de mercado calculado matemáticamente**.
3. **REGLA DEL 12% DE OFERTA:** El ajuste por negociación de oferta (`asking_price_adjustment = 0.1200`) se aplica **exclusivamente una única vez** al *Raw Asking Price* de publicaciones de oferta pública. Nunca a transacciones reales, tasaciones periciales SAU ni valores prudentes.
4. **INMUTABILIDAD HISTÓRICA:** Las tasaciones ejecutadas quedan vinculadas a un snapshot inmutable con su versión de algoritmo y configuración (`settings_version`). Las calibraciones futuras nunca mutan el pasado.
5. **DEDUPLICACIÓN FÍSICA:** Un inmueble físico equivale a máximo un comparable, independientemente de que aparezca publicado simultáneamente en múltiples portales inmobiliarios.

---

## 2. DATA FLOW Y PIPELINE DE VALUACIÓN

```
┌─────────────────┐
│ FUENTES REALES  │ (InfoCasas, MercadoLibre, RE/MAX, Portales Canónicos)
└────────┬────────┘
         ▼
┌─────────────────┐
│ INGESTA         │ (Crawler / Adaptadores con Circuit Breaker y Rate Limiting)
└────────┬────────┘
         ▼
┌─────────────────┐
│ RAW SNAPSHOTS   │ (Almacenamiento inmutable del payload y hash SHA-256)
└────────┬────────┘
         ▼
┌─────────────────┐
│ NORMALIZACIÓN   │ (Uruguay Location Dictionary, Tipología, Superficies, Precios USD)
└────────┬────────┘
         ▼
┌─────────────────┐
│ DEDUPLICACIÓN   │ (Matching espacial, similitud difusa de títulos, unificación de evidencias)
└────────┬────────┘
         ▼
┌─────────────────┐
│ PROPERTY MASTER │ (Entidad canónica única de inmueble físico)
└────────┬────────┘
         ▼
┌─────────────────┐
│ COMPARABLES     │ (Candidate Finder, Filtro Multidimensional, Outlier Detector IQR/MAD)
└────────┬────────┘
         ▼
┌─────────────────┐
│ VALUATION ENGIN │ (Ensemble: Weighted Median, Trimmed Mean, Price/m², Direct Adjustment)
└────────┬────────┘
         ▼
┌─────────────────┐
│ RANGO & CONFID. │ (Range Low-High, Valor Prudente, Score 0-100 y semáforo de suficiencia)
└────────┬────────┘
         ▼
┌─────────────────┐
│ IA / VISIÓN     │ (Shadow Mode: Extracción cualitativa, explicabilidad sin peso monetario)
└────────┬────────┘
         ▼
┌─────────────────┐
│ EXPEDIENTE      │ (Integración con garantías, Human-in-the-Loop, Peritaje SAU, Feedback)
└────────┬────────┘
         ▼
┌─────────────────┐
│ GROUND TRUTH    │ (Escrituras notariales, Cierres reales, Jerarquía de certeza 1-4)
└────────┬────────┘
         ▼
┌─────────────────┐
│ BACKTEST & CAL. │ (Holdout temporal, Análisis de Asking Drift, Propuestas Shadow)
└────────┬────────┘
         ▼
┌─────────────────┐
│ GOVERNANCE      │ (Aprobación exclusiva Super Admin, Versionado inmutable, Rollback)
└─────────────────┘
```

---

## 3. MATRIZ DE TABLAS DE BASE DE DATOS Y RLS

| Tabla | Propósito | Acceso Anon | Acceso Autenticado | Service Role Server-Side |
| :--- | :--- | :---: | :---: | :---: |
| `property_sources` | Catálogo de 20 fuentes canónicas | 0 (Denegado) | Lectura controlada | Full Access |
| `property_master` | Entidad canónica de inmueble físico | 0 (Denegado) | Lectura con matching | Full Access |
| `property_listings` | Publicaciones normalizadas | 0 (Denegado) | Lectura controlada | Full Access |
| `property_price_history` | Historial de variaciones de precio | 0 (Denegado) | Lectura | Full Access |
| `property_listing_media` | Fotos y hashes SHA-256 de multimedia | 0 (Denegado) | Lectura | Full Access |
| `property_duplicate_candidates` | Registro de pares deduplicados | 0 (Denegado) | Lectura | Full Access |
| `property_field_evidence` | Evidencias fuente por campo | 0 (Denegado) | Lectura | Full Access |
| `property_listing_snapshots` | Payloads crudos inmutables | 0 (Denegado) | 0 (Denegado) | Full Access |
| `property_valuations` | Snapshots de tasaciones por expediente | 0 (Denegado) | Solo propia Organización | Full Access |
| `property_valuation_versions` | Historial de versiones de tasación | 0 (Denegado) | Solo propia Organización | Full Access |
| `property_valuation_comparables`| Comparables seleccionados | 0 (Denegado) | Solo propia Organización | Full Access |
| `property_ai_features` | Atributos cualitativos y de visión | 0 (Denegado) | Solo propia Organización | Full Access |
| `property_transactions` | Ground Truth verificado (Nivel 1-4) | 0 (Denegado) | Super Admin / Server | Full Access |
| `appraisal_settings` | Versionado de parámetros del motor | 0 (Denegado) | Lectura global | Full Access |
| `crawler_runs` & `crawler_jobs` | Registro de ingesta y spiders | 0 (Denegado) | 0 (Denegado) | Full Access |
| `ai_usage_events` | Auditoría de consumo y costo IA | 0 (Denegado) | Super Admin | Full Access |

---

## 4. REGISTRO Y GOBERNANZA DE LAS 20 FUENTES CANÓNICAS

1. `infocasas` — **InfoCasas Uruguay**: `PUBLIC_STRUCTURED_ENDPOINT` (Fuente Líder, abierta y estructurada).
2. `mercadolibre_uy` — **Mercado Libre Inmuebles**: `PUBLIC_STRUCTURED_ENDPOINT` (Estructurada, rate limit 30/min).
3. `remax_uy` — **RE/MAX Uruguay**: `PUBLIC_HTML` (HTML normalizado, rate limit 25/min).
4. `century21_uy` — **Century 21 Uruguay**: `PUBLIC_HTML` (HTML normalizado, rate limit 40/min).
5. `engel_volkers_uy` — **Engel & Völkers Uruguay**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
6. `acsa_uy` — **ACSA Inmobiliaria**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
7. `kosak_uy` — **Kosak Inversiones Inmobiliarias**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
8. `meikle_uy` — **Meikle Bienes Raíces**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
9. `caldeyro_uy` — **Caldeyro Victorica**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
10. `canepa_uy` — **Cánepa y Cánepa**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
11. `nicolas_modena_uy` — **Nicolás de Módena**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
12. `terramar_uy` — **Terramar**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
13. `bado_asociados_uy` — **Bado y Asociados**: `PUBLIC_HTML` (HTML normalizado, rate limit 20/min).
14. `gallito_uy` — **Gallito Luis**: `BLOCKED` (Cloudflare Bot Management 403. Circuit Breaker activo, CERO bypass).
15. `sothebys_uy` — **Sotheby’s International Realty**: `REQUIRES_AUTHORIZATION` (Requiere convenio o API partner).
16. `nieto_paez_uy` — **Nieto y Páez**: `BLOCKED` (Acceso bloqueado por WAF origen 403).
17. `pallares_bruzzone_uy` — **Pallares y Bruzzone**: `NOT_SUPPORTED` (Sin TLS público estándar).
18. `braglia_uy` — **Braglia Inmobiliaria**: `NOT_SUPPORTED` (Dominio no accesible en internet pública).
19. `puntamar_uy` — **Puntamar Real Estate**: `NOT_SUPPORTED` (Inestabilidad en DNS/servidor).
20. `varela_uy` — **Varela Inmobiliaria**: `NOT_SUPPORTED` (Servidor no responde).

---

## 5. MATRIZ REAL VS MOCK EN PRODUCCIÓN

| Componente | Estado Productivo | Descripción |
| :--- | :---: | :--- |
| **Ingesta de Mercado** | `REAL` | Conexión HTTP/JSON real a fuentes públicas uruguayas con control de timeouts y reintentos. |
| **Normalización Uruguay** | `REAL` | Diccionario canónico de 19 departamentos y más de 60 barrios de Montevideo e interior. |
| **Deduplicación & Property Master** | `REAL` | Algoritmo determinístico espacial y difuso con cálculo de hash de contenido. |
| **Motor de Valuación Determinística** | `REAL` | Ensemble estadístico ponderado con eliminación de outliers IQR / MAD. |
| **Regla del 12% de Oferta** | `REAL` | Deducción exacta `asking_price * 0.88` sobre precio bruto de oferta. |
| **Computer Vision (Fotos)** | `SHADOW` | Evaluación cualitativa y terminaciones con impacto monetario = 0.00. |
| **Explicabilidad LLM** | `REAL` | Generación de minutas explicativas estructuradas vía OpenAI con fallback determinístico local. |
| **Expedientes & Human-in-the-Loop** | `REAL` | Aprobación de referencia, solicitud de peritaje y registro de tasaciones SAU. |
| **Ground Truth & Calibración** | `REAL` | Almacenamiento de cierres reales, backtesting sin data leakage y holdouts de validación. |
| **Catastro Nacional (DNC)** | `NOT_CONNECTED` | Enriquecimiento catastral en fase de integración institucional sin bloquear la tasación de mercado. |

---

## 6. MATRIZ DE VERSIONES DE PRODUCCIÓN

- **Normalization Engine:** `v1.2.0-uy-canonical`
- **Deduplication Engine:** `v1.1.0-spatial-fuzzy`
- **Data Quality Engine:** `v1.0.0-completeness-penalty`
- **Comparable Finder Engine:** `v1.3.0-multilevel-search`
- **Valuation Ensemble Engine:** `v1.0.0-robust-hybrid`
- **Appraisal Settings:** `V1 (asking_price_adjustment: 0.1200, min_comparables: 3, max_age: 365d)`
- **AI Prompt Engine:** `v1.0.0-zod-structured-sanitized`
- **AI Model:** `gpt-4o / local-heuristic-fallback`
- **Calibration Engine:** `v1.0.0-zero-leakage-holdout`

---

## 7. AUDITORÍA DE COSTOS Y PROYECCIONES OPERATIVAS

- **Costo por Tasación Determinística (Matemática Pura):** $0.000 USD.
- **Costo por Enriquecimiento de Texto LLM (Tokens):** ~$0.0012 USD (~600 tokens).
- **Costo por Análisis de Fotos con Computer Vision (3 fotos):** ~$0.0075 USD.
- **Costo Total Estimado por Tasación Completa (IA + Visión):** **$0.0087 USD**.
- **Proyección 1,000 Tasaciones / Mes:** **$8.70 USD / mes** (Ampliamente dentro del presupuesto operativo).

---

## 8. CERTIFICACIÓN DE PRODUCCIÓN

- **Estado Final:** `PRODUCTION_CERTIFIED`
- **Garantías de Seguridad:** RLS multi-tenant estricto, 0 secretos en bundle de cliente, `service_role` restringido al backend.
