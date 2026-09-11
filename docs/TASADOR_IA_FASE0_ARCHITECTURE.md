# Arquitectura y Modelo de Datos Inmobiliario Global - Tasador IA (Fase0)

Este documento contiene la especificación técnica completa y definitiva de la **Fase 0 del Tasador IA** en HIPOTECALY: 18 entidades fundacionales, deduplicación asistida por candidatos, auditoría de precios inmutable, evidencias trazables, medios con hashes visuales, estado explícito `SOLD_OR_REMOVED_UNKNOWN`, monitoreo de crawlers/IA, políticas RLS por tabla y la **matriz de los 25 requisitos**.

---

## 1. Resumen Ejecutivo y Alcance de Fase 0

El propósito de la Fase 0 es construir la **Base de Datos Inmobiliaria Global** desacoplada de los expedientes crediticios (`applications`).

```
+-----------------------------------------------------------------------------------------+
|                        BASE INMOBILIARIA GLOBAL (Fase 0 - 18 Entidades)                 |
|                                                                                         |
|  [property_sources] (Top 20 UY)  --->  [property_listings]  ---> [property_snapshots]   |
|  [crawler_runs] (Monitoreo)                    |                                        |
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
|  - [ai_usage_events]                (Auditoría de Tokens IA)                            |
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

---

## 2. Las 18 Entidades Fundacionales de Fase 0

1. `property_sources`: Configuración de los 20 portales y operadores inmobiliarios locales en Uruguay.
2. `property_master`: Registro maestro canónico deduplicado e independiente de expedientes.
3. `property_listings`: Ofertas individuales en portales (soporta estado explícito `SOLD_OR_REMOVED_UNKNOWN`).
4. `property_price_history`: Log append-only inmutable de precios (`event_type`).
5. `property_duplicate_candidates`: Candidatos de deduplicación sin fusiones automáticas destructivas.
6. `property_listing_media`: Fotos/medios con `sha256_hash` y `perceptual_hash`.
7. `property_listing_attributes`: Atributos flexibles clave-valor.
8. `property_field_evidence`: Trazabilidad de evidencia por campo individual.
9. `property_listing_snapshots`: Snapshots estructurados inmutables.
10. `property_cadastral_data`: Estructura oficial para Catastro (preparada sin conexión).
11. `property_valuations`: Registro de valuaciones (preparada sin ejecuciones).
12. `property_valuation_versions`: Histórico versionado de valuaciones (preparada).
13. `property_valuation_comparables`: Comparables mapeados (preparada).
14. `property_ai_features`: Rasgos extraídos por IA (preparada).
15. `property_transactions`: Registro de operaciones y ventas reales (preparada).
16. `appraisal_settings`: Configuración versionada (`asking_price_adjustment = 0.1200`).
17. `crawler_runs`: Registro de ejecuciones de scrapers (preparada pero vacía).
18. `ai_usage_events`: Auditoría de consumo de tokens y costos de IA (preparada pero vacía).

---

## 3. Políticas RLS Reales por Tabla

| Tabla | SELECT | INSERT / UPDATE / DELETE | Roles Autorizados |
| :--- | :---: | :---: | :---: |
| `property_sources` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_master` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_listings` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_price_history` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_duplicate_candidates` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_listing_media` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_listing_attributes` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_field_evidence` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_listing_snapshots` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_cadastral_data` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_valuations` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_valuation_versions` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_valuation_comparables` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_ai_features` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `property_transactions` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `appraisal_settings` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `crawler_runs` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |
| `ai_usage_events` | `USING (true)` | Restringido | `authenticated`, `anon`, `service_role` |

---

## 4. Matriz de los 25 Requisitos Mapeados a Tests

| Req # | Descripción del Requisito | Test Mapeado en Playwright (`ai-appraisal-fase0-architecture.spec.ts`) | Estado |
| :---: | :--- | :--- | :---: |
| **01** | Creación de `property_sources` con metadatos completos | `Req 01: Creación de property_sources con metadatos completos y 20 fuentes registradas` | PASADO |
| **02** | Fuentes uruguayas exactas con nombres de pantalla corregidos | `Req 02: Fuentes uruguayas exactas con nombres corregidos preservando los códigos nativos intactos` | PASADO |
| **03** | Ingesta desactivada (`ingestion_enabled = false`) | `Req 03: Desactivación estricta de ingesta (ingestion_enabled = false) en todos los portales` | PASADO |
| **04** | Creación de `property_master` independiente de expedientes | `Req 04: Creación de property_master como base global independiente de la tabla de expedientes` | PASADO |
| **05** | Ubicación desglosada y `location_precision` | `Req 05: Desglose explícito de dirección, barrio, ciudad, departamento y location_precision` | PASADO |
| **06** | `property_listings` N -> 1 a Master con URLs de origen | `Req 06: Creación de property_listings vinculando N publicaciones a una propiedad maestra` | PASADO |
| **07** | Constraint `UNIQUE(source_id, source_listing_id)` | `Req 07: Garantía de identificador único de publicación por fuente (source_id + source_listing_id)` | PASADO |
| **08** | Textos RAW vs Normalizados en títulos y descripciones | `Req 08: Almacenamiento diferenciado de texto original (raw) y normalizado en títulos y descripciones` | PASADO |
| **09** | Historial inmutable append-only en `property_price_history` | `Req 09: Historial inmutable append-only en property_price_history registrando event_type` | PASADO |
| **10** | Trigger audita variaciones de precio sin asumir venta | `Req 10: Trigger audita variación de precio sin marcar caídas de precio como ventas` | PASADO |
| **11** | Medios/Fotos con hashes SHA-256 y Perceptual Hash | `Req 11: Registro en property_listing_media asociando sha256_hash y perceptual_hash` | PASADO |
| **12** | Candidatos deduplicación sin auto-merge destructivo | `Req 12: Evaluación de candidatos en property_duplicate_candidates sin fusión destructiva automática` | PASADO |
| **13** | Estado explícito `SOLD_OR_REMOVED_UNKNOWN` | `Req 13: Soporte del estado explícito SOLD_OR_REMOVED_UNKNOWN (REMOVED != SOLD)` | PASADO |
| **14** | Desglose de superficies y amenities (`NULL != FALSE`) | `Req 14: Desglose explícito de superficies y amenities respetando el principio NULL != FALSE` | PASADO |
| **15** | Atributos flexibles `property_listing_attributes` | `Req 15: Estructura de property_listing_attributes para atributos clave-valor adicionales` | PASADO |
| **16** | Trazabilidad de Evidencia en `property_field_evidence` | `Req 16: Trazabilidad de origen y evidencia en property_field_evidence por atributo individual` | PASADO |
| **17** | Snapshots inmutables `property_listing_snapshots` | `Req 17: Almacenamiento de snapshots inmutables en property_listing_snapshots` | PASADO |
| **18** | Datos catastrales `property_cadastral_data` preparados | `Req 18: Estructura oficial de property_cadastral_data preparada sin conexión viva a Catastro` | PASADO |
| **19** | Valuaciones `property_valuations` preparadas | `Req 19: Estructuras de property_valuations y property_valuation_versions preparadas sin tasaciones` | PASADO |
| **20** | Comparables `property_valuation_comparables` preparados | `Req 20: Estructura de property_valuation_comparables preparada sin selección real de testigos` | PASADO |
| **21** | Características IA `property_ai_features` preparadas | `Req 21: Estructura de property_ai_features preparada sin modelos de IA o visión activos` | PASADO |
| **22** | Transacciones reales `property_transactions` preparadas | `Req 22: Estructura de property_transactions preparada sin inserción de operaciones ficticias` | PASADO |
| **23** | Sesiones de scraping en `crawler_runs` (vacía) | `Req 23: Estructura de crawler_runs para monitoreo de scrapers preparada pero vacía en Fase 0` | PASADO |
| **24** | Auditoría de consumo IA en `ai_usage_events` (vacía) | `Req 24: Estructura de ai_usage_events para auditoría de tokens preparada pero vacía en Fase 0` | PASADO |
| **25** | Parámetro `asking_price_adjustment = 0.1200` (12.00%) | `Req 25: Parámetro versionado asking_price_adjustment = 0.1200 (12.00%) configurado sin ejecutarse` | PASADO |
