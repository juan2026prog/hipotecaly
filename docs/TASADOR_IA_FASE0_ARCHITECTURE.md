# Arquitectura y Modelo de Datos Inmobiliario Global - Tasador IA (Fase0)

Este documento contiene la especificación técnica completa y definitiva de la **Fase 0 del Tasador IA** en HIPOTECALY: base inmobiliaria global, modelo deduplicado con candidatos, auditoría de precios inmutable, evidencias trazables, medios con hashes visuales, configuración de los 20 portales locales uruguayos y parámetros versionados.

---

## 1. Resumen Ejecutivo y Alcance de Fase 0

El propósito de la Fase 0 es construir la **Base de Datos Inmobiliaria Global** desacoplada de los expedientes crediticios (`applications`).

```
+-----------------------------------------------------------------------------------------+
|                        BASE INMOBILIARIA GLOBAL (Fase 0)                                |
|                                                                                         |
|  [property_sources] (Top 20 UY)  --->  [property_listings]  ---> [property_snapshots]   |
|                                                |                                        |
|                                                v                                        |
|  [property_duplicate_candidates]  <--- [property_master]  <--- [property_listing_media] |
|                                                |               (Hashes phash/sha256)    |
|                                                v                                        |
|  [property_field_evidence]       <--- [property_price_history]                          |
|  (Trazabilidad de origen)             (Log Inmutable Append-Only)                       |
|                                                                                         |
|  ESTRUCTURAS PREPARADAS (SIN EJECUCIÓN EN FASE 0):                                      |
|  - [property_cadastral_data]        (Catastro Oficial)                                  |
|  - [property_valuations]            (Valuaciones)                                       |
|  - [property_valuation_versions]    (Versiones de Tasación)                             |
|  - [property_valuation_comparables] (Comparables)                                       |
|  - [property_ai_features]           (Características Visión/IA)                         |
|  - [property_transactions]          (Operaciones Reales)                                |
+-----------------------------------------------------------------------------------------+
                                                |
                                                | (Referenciado en Fase 1/2)
                                                v
+-----------------------------------------------------------------------------------------+
|                       EXPEDIENTES CREDITICIOS / APPLICATIONS                            |
|                                                                                         |
|  [applications]  --->  [guarantee_properties]  (Archivos del cliente)                   |
+-----------------------------------------------------------------------------------------+
```

> [!IMPORTANT]
> **Ajuste Conceptual del 12% (`asking_price_adjustment = 12.00%`):**
> El factor del 12.00% (`0.1200`) registrado en `appraisal_settings` representa la **diferencia estimada inicial entre el precio publicado (*asking price*) y el precio real de venta/mercado (*closing price*)**, sujeto a futura calibración con operaciones reales. **NO es un haircut hipotecario, ni un descuento de liquidación rápida, ni un LTV máximo.**

> [!IMPORTANT]
> **Límites de Aislamiento de Fase 0:**
> 1. **Cero Crawlers Reales**: Todas las fuentes tienen `ingestion_enabled = false`.
> 2. **Cero Conexiones a OpenAI / Visión**: No se envían consultas a modelos de IA ni vision APIs.
> 3. **Cero Catastro Vivo**: La tabla `property_cadastral_data` está estructurada pero no conectada.
> 4. **Cero Tasaciones Vinculantes / Comparables Elegidos**: `property_valuations` y `property_valuation_comparables` están estructuradas pero no ejecutan cálculos.

---

## 2. Las 16 Entidades Fundacionales de Fase 0

### 2.1 Fuentes y Portales (`property_sources`)
Configuración de los 20 portales y operadores inmobiliarios locales en Uruguay:
1. **Mercado Libre Inmuebles** (`mercadolibre_uy`)
2. **InfoCasas** (`infocasas`)
3. **Gallito Luis** (`gallito_uy`)
4. **RE/MAX Uruguay** (`remax_uy`)
5. **Engel & Völkers Uruguay** (`engel_volkers_uy`)
6. **Sotheby’s International Realty Uruguay** (`sothebys_uy`)
7. **ACS Inmobiliaria** (`acs_uy`)
8. **Kosak Inversiones Inmobiliarias** (`kosak_uy`)
9. **Meikle Bienes Raíces** (`meikle_uy`)
10. **Caldeiro Victorica Bienes Raíces** (`caldeiro_uy`)
11. **Pallares y Bruzzone** (`pallares_bruzzone_uy`)
12. **Bado y Asociados** (`bado_asociados_uy`)
13. **Braglia Inmobiliaria** (`braglia_uy`)
14. **Cánepa y Cánepa** (`canepa_uy`)
15. **Nicolás de Módena Inmobiliaria** (`nicolas_modena_uy`)
16. **Nieto y Páez** (`nieto_paez_uy`)
17. **Terramar Corporate & Residential** (`terramar_uy`)
18. **Puntamar Real Estate** (`puntamar_uy`)
19. **Century 21 Uruguay** (`century21_uy`)
20. **Varela Inmobiliaria** (`varela_uy`)

### 2.2 Registro Maestro (`property_master`)
Propiedad canónica deduplicada con desglose de ubicación (`department`, `city`, `locality`, `neighborhood`, `sub_neighborhood`, `address`, `location_precision`), atributos físicos (`property_type`, `construction_year`, `approximate_age`, `canonical_status`) y desglose de superficies (`total_area_m2`, `built_area_m2`, `land_area_m2`, `covered_surface_m2`, `uncovered_surface_m2`).

### 2.3 Publicaciones (`property_listings`)
Ofertas individuales en portales. Almacena títulos y descripciones originales y normalizados (`title_raw`, `title_normalized`, `description_raw`, `description_normalized`), desglose de precios (`current_price`, `current_currency`, `price_usd`, `price_uyu`, `price_per_m2`), tipo de operación (`SALE`, `RENT`, `AUCTION`) y estados (`ACTIVE`, `INACTIVE`, `REMOVED`, `EXPIRED`).

### 2.4 Historial Inmutable de Precios (`property_price_history`)
Log append-only que audita fluctuaciones de precio (`price`, `currency`, `price_usd`, `price_uyu`, `price_change_percentage`) y tipos de evento (`FIRST_SEEN`, `PRICE_CHANGED`, `PRICE_CORRECTED`, `OBSERVED`).

### 2.5 Candidatos de Duplicación (`property_duplicate_candidates`)
Mapeo de posibles coincidencias entre inmuebles/anuncios con puntuaciones de similitud (`match_score`, `address_score`, `geo_score`, `photo_score`, `cadastral_score`) y estados (`PENDING`, `MATCH`, `NO_MATCH`, `UNCERTAIN`). **No realiza fusiones automáticas destructivas.**

### 2.6 Medios y Fotografía (`property_listing_media`)
Generalización de fotos/medios (`IMAGE`, `VIDEO`, `FLOOR_PLAN`, `DOCUMENT`) con firmas digitales de contenido (`sha256_hash`) y perceptual hash (`perceptual_hash`) para deduplicación visual.

### 2.7 Atributos Flexibles (`property_listing_attributes`)
Clave-valor para información complementaria aportada por las fuentes.

### 2.8 Evidencia por Campo (`property_field_evidence`)
Trazabilidad de origen por atributo (`field_name`, `raw_value`, `normalized_value`, `source_id`, `confidence`).

### 2.9 Snapshots de Publicación (`property_listing_snapshots`)
Captura inmutable del payload de respuesta del parser (`structured_payload`, `content_hash`).

### 2.10 Datos Catastrales (`property_cadastral_data`)
Estructura oficial para integrar datos registrales y padrones (preparada sin conexión viva).

### 2.11 Valuaciones (`property_valuations`, `property_valuation_versions`, `property_valuation_comparables`)
Estructuras para tasaciones automáticas/profesionales y comparables (preparadas sin ejecutarse en Fase 0).

### 2.12 Características de IA (`property_ai_features`)
Extracción de rasgos por modelos de visión/IA (preparada sin modelos activos).

### 2.13 Transacciones Reales (`property_transactions`)
Registro de operaciones y ventas reales para calibrar el factor *Asking Price vs. Closing Price* (preparada sin datos ficticios).

### 2.14 Configuración Versionada (`appraisal_settings`)
Parámetros versionados del sistema. La versión V1 contiene `asking_price_adjustment = 0.1200` (12.00%), umbrales de deduplicación y pesos de valoración.

---

## 3. Principios de Diseño Obligatorios

1. **Asking Price ≠ Closing Price**: Las ofertas de portales no representan necesariamente valores de venta cerrados.
2. **`NULL != FALSE`**: Si una fuente no informa una propiedad (ej. `pool = NULL`), significa *desconocido*, nunca *false*.
3. **`REMOVED != SOLD`**: Si una publicación desaparece de un portal, su estado cambia a `REMOVED`, jamás a `SOLD` automáticamente.
4. **Mínimo Privilegio RLS**: Habilitado en las 16 tablas. Lectura para usuarios autenticados/anónimos autorizados; escritura restringida a `service_role`.
