# Arquitectura y Modelo de Datos - Tasador IA (Fase0)

Este documento describe la especificación técnica de la **Fase 0 del Tasador IA** en HIPOTECALY: diseño de base de datos inmobiliaria global, deduplicación de inmuebles, historial de precios, hashes fotográficos, configuración de portales y parámetros versionados.

---

## 1. Resumen Ejecutivo y Alcance de Fase 0

El objetivo fundamental de la Fase 0 es establecer la **Base de Datos Inmobiliaria Global** desacoplada de los expedientes crediticios (`applications`).

> [!IMPORTANT]
> **Límites estrictos de la Fase 0:**
> 1. **Sin Crawlers Reales**: No se ejecutan web scrapers ni tareas de rastreo automatizado activo.
> 2. **Sin Conexión a OpenAI**: No se envían consultas a modelos de lenguaje ni vision APIs para valuación.
> 3. **Sin Ejecucción de Tasaciones**: El sistema no produce tasaciones finales ni ajusta ratios LTV de expedientes en esta etapa.
> 4. **Parámetro del 12% Configurable**: El margen de resguardo/descuento de liquidación rápida del 12% queda definido en la tabla versionada `appraisal_settings` como parámetro de entrada sin ejecutarse.

---

## 2. Base Inmobiliaria Global vs. Expedientes

```
+-----------------------------------------------------------------------+
|                 BASE INMOBILIARIA GLOBAL (Fase 0)                     |
|                                                                       |
|  [property_sources]  --->  [property_listings]                        |
|  (Top 20 Portales)         (Anuncios Mercado)                         |
|                                  |                                    |
|                                  v                                    |
|                         [property_master]  <--- [property_photos]     |
|                       (Propiedad Canónica)      (Hashes phash/sha)    |
|                                  |                                    |
|                                  v                                    |
|                     [property_price_history]                          |
|                       (Auditoría de Precios)                          |
+-----------------------------------------------------------------------+
                                   |
                                   | (Referenciado en Fase 1/2)
                                   v
+-----------------------------------------------------------------------+
|                    EXPEDIENTES CREDITICIOS                            |
|                                                                       |
|  [applications]  --->  [guarantee_properties]  (Archivos del cliente) |
+-----------------------------------------------------------------------+
```

---

## 3. Modelo de Entidades y Diccionario de Datos

### 3.1 `property_sources` (Fuentes y Portales Inmobiliarios)
Almacena la configuración declarativa de los 20 principales portales y cadenas inmobiliarias.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único de la fuente |
| `code` | VARCHAR(50) (UQ) | Código único (e.g. `infocasas`, `mercadolibre_uy`) |
| `name` | VARCHAR(100) | Nombre comercial del portal |
| `domain` | VARCHAR(255) | Dominio web oficial |
| `country_code` | VARCHAR(5) | Código de país ISO (`UY`, `AR`, `MX`, etc.) |
| `is_active` | BOOLEAN | Estado de activación del portal |
| `rate_limit_per_minute` | INTEGER | Límite prudencial de solicitudes por minuto |
| `crawler_config` | JSONB | Parámetros de scraping y estructura |

---

### 3.2 `property_master` (Registro Maestro Canónico)
Entidad global que agrupa la información normalizada deduplicada.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador canónico del inmueble |
| `canonical_address` | TEXT | Dirección completa normalizada |
| `department` | VARCHAR(100) | Departamento (e.g. `Montevideo`, `Maldonado`) |
| `city` | VARCHAR(100) | Localidad / Ciudad |
| `neighborhood` | VARCHAR(100) | Barrio / Zona |
| `property_type` | VARCHAR(50) | Tipología (`apartamento`, `casa`, `terreno`, etc.) |
| `covered_surface_m2` | NUMERIC(10,2) | Superficie cubierta |
| `uncovered_surface_m2` | NUMERIC(10,2) | Superficie descubierta / patio |
| `rooms` / `bathrooms` | INTEGER | Cantidad de dormitorios y baños |
| `cadastral_number` | VARCHAR(50) | Padrón catastral |
| `dedup_hash` | VARCHAR(64) (UQ) | Hash SHA-256 de dirección, departamento y padrón |
| `dedup_confidence` | NUMERIC(5,2) | Puntuación de confianza (0-100) |

---

### 3.3 `property_listings` (Anuncios de Portales)
Ofertas individuales capturadas en portales. Relación **N Listings -> 1 Master**.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador del anuncio en el sistema |
| `master_id` | UUID (FK) | Enlace a la propiedad maestra |
| `source_id` | UUID (FK) | Enlace a la fuente/portal |
| `external_id` | VARCHAR(255) | ID nativo del anuncio en el portal |
| `price_amount` | NUMERIC(15,2) | Precio publicado |
| `currency` | VARCHAR(5) | Moneda (`USD` / `UYU`) |
| `price_usd_normalized` | NUMERIC(15,2) | Precio convertido a USD |
| `price_per_m2_usd` | NUMERIC(10,2) | Precio unitario por m2 en USD |
| `status` | VARCHAR(20) | Estado (`active`, `inactive`, `sold`, `removed`) |

---

### 3.4 `property_price_history` (Historial de Precios)
Auditoría continua de fluctuaciones de precio generada automáticamente por disparador de base de datos.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | ID de auditoría |
| `listing_id` | UUID (FK) | Anuncio asociado |
| `master_id` | UUID (FK) | Propiedad maestra asociada |
| `price_usd_normalized` | NUMERIC(15,2) | Precio actual en USD |
| `previous_price_usd` | NUMERIC(15,2) | Precio anterior en USD (NULL en creación) |
| `price_change_percentage` | NUMERIC(7,2) | Porcentaje de variación detectado |
| `detected_at` | TIMESTAMPTZ | Fecha de detección de la variación |

---

### 3.5 `property_photos` (Deduplicación Visual de Fotografías)
Catálogo de imágenes asociadas con firmas digitales para evitar duplicación.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | ID de la fotografía |
| `listing_id` / `master_id` | UUID (FK) | Enlace al anuncio o registro maestro |
| `url` | TEXT | URL del recurso de imagen |
| `phash` | VARCHAR(64) | Hash perceptual de imagen para comparación visual |
| `image_hash` | VARCHAR(64) | SHA-256 del contenido de la imagen |
| `is_primary` | BOOLEAN | Marca de fotografía principal de portada |

---

### 3.6 `appraisal_settings` (Parámetros Versionados del Tasador IA)
Configuración de comportamiento del motor con historial de auditoría y parámetro del 12%.

| Campo | Tipo | Valor V1 | Descripción |
| :--- | :--- | :--- | :--- |
| `version` | INTEGER (UQ) | `1` | Número de versión de configuración |
| `is_active` | BOOLEAN | `true` | Indica la versión vigente |
| `safety_margin_percentage` | NUMERIC(5,2) | `12.00` | **Margen del 12% configurado sin ejecutar** |
| `max_dedup_distance_meters` | INTEGER | `100` | Distancia radial máxima para deduplicar |
| `similarity_threshold` | NUMERIC(5,2) | `85.00` | Porcentaje de similitud mínima |
| `min_comparables_count` | INTEGER | `3` | Mínimo de testigos requeridos |
| `max_comparables_age_days` | INTEGER | `180` | Antigüedad máxima de ofertas (días) |
| `weights` | JSONB | Ponderaciones | `{"surface": 0.40, "location": 0.30, "rooms": 0.15, "age": 0.15}` |

---

## 4. Top 20 Portales Inmobiliarios Configurados

1. **InfoCasas Uruguay** (`infocasas`)
2. **MercadoLibre Inmuebles Uruguay** (`mercadolibre_uy`)
3. **Gallito Luis Inmuebles** (`gallito_uy`)
4. **Casas en el Este** (`casaseneleste_uy`)
5. **ZonaProp Uruguay** (`zonaprop_uy`)
6. **Properati Uruguay** (`properati_uy`)
7. **RE/MAX Uruguay** (`remax_uy`)
8. **Century 21 Uruguay** (`century21_uy`)
9. **Buscandocasa** (`buscandocasa_uy`)
10. **Argenprop Latam** (`argenprop`)
11. **Inmuebles24 Regional** (`inmuebles24`)
12. **Plusvalia Latam** (`plusvalia`)
13. **Sothebys Realty Uruguay** (`sothebys_uy`)
14. **Engel & Völkers Uruguay** (`engel_volkers_uy`)
15. **TuCasa Uruguay** (`tucasa_uy`)
16. **Portales Inmobiliarios AR** (`portales_ar`)
17. **Clarín Inmuebles** (`clarin_inmuebles`)
18. **FincaRaíz Latam** (`fincaraiz_latam`)
19. **Brio Inmobiliaria** (`brio_uy`)
20. **Caldeyro Victorica Bienes Raíces** (`caldeyro_uy`)

---

## 5. Estrategia de Deduplicación

La deduplicación opera en tres capas jerárquicas:
1. **Hash Canónico Determinista**: `SHA-256(direccion_normalizada | departamento | padron)`. Coincidencia al 100%.
2. **Coincidencia por Padrón Catastral**: Padrón registral coincidente en el mismo departamento. Coincidencia al 95%.
3. **Firma Perceptual Fotográfica**: Identificación de anuncios duplicados en múltiples portales mediante `phash` de imágenes de portada.

---

## 6. Seguridad y RLS (Row Level Security)

- **RLS Habilitado** en las 6 tablas (`property_sources`, `property_master`, `property_listings`, `property_price_history`, `property_photos`, `appraisal_settings`).
- **Permisos de Lectura**: Otorgados a usuarios autenticados (`authenticated`) y anónimos (`anon`) para consulta del catálogo.
- **Permisos de Escritura**: Restringidos exclusivamente a `service_role` e administradores de la plataforma.
