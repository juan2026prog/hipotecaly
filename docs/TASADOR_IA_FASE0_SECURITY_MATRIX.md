# HIPOTECALY — TASADOR IA FASE 0: MATRIZ DE SEGURIDAD, POLÍTICAS RLS Y MATRIZ DE ACCESO REAL

> **ESTADO DE AUDITORÍA**: FASE 0 — CERTIFICADA EN SEGURIDAD  
> **FECHA DE CERTIFICACIÓN**: 2026-09-11  
> **ÁMBITO**: 19 Tablas de la Base Inmobiliaria Global del Tasador IA  

---

## 1. PRINCIPIO DE SEGURIDAD APLICADO (DENY BY DEFAULT REAL)

1. **Acceso nulo a `anon`**: El rol `anon` no posee ningún privilegio de lectura (`SELECT`), inserción (`INSERT`), actualización (`UPDATE`), eliminación (`DELETE`), referencias ni triggers (`REVOKE ALL FROM anon`).
2. **Acceso nulo directo a `authenticated`**: Los usuarios autenticados ordinarios (incluyendo miembros, analistas y administradores de organizaciones) poseen **0 acceso directo** a las 19 tablas globales (`REVOKE ALL FROM authenticated`).
3. **Sin excepciones por Organización**: La Base Inmobiliaria Global no pertenece a ninguna organización. `Org A`, `Org B` y `Org C` no pueden realizar consultas directas via cliente Supabase/browser a ninguna tabla global.
4. **Ruta privilegiada para Super Admin**: Acceso a datos de auditoría restringido a la función `public.is_super_admin()`.
5. **Ruta privilegiada para `service_role`**: Exclusivamente server-side mediante backend/API interna segura.

---

## 2. MATRIZ DE ACCESO EFECTIVA POR TABLA Y ROL (19 TABLAS)

| # | Recurso (Tabla) | `anon` | `authenticated` (Normal) | Usuario Org | Admin Org | Super Admin | `service_role` | Estado RLS |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `property_sources` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 2 | `property_master` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 3 | `property_listings` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 4 | `property_price_history` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 5 | `property_photos` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 6 | `property_listing_media` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 7 | `property_listing_attributes` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 8 | `property_duplicate_candidates` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 9 | `property_field_evidence` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 10 | `property_listing_snapshots` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 11 | `property_cadastral_data` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 12 | `property_valuations` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 13 | `property_valuation_versions` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 14 | `property_valuation_comparables` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 15 | `property_ai_features` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 16 | `property_transactions` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 17 | `appraisal_settings` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 18 | `crawler_runs` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |
| 19 | `ai_usage_events` | ❌ DENIED | ❌ DENIED | ❌ DENIED | ❌ DENIED | 👁️ `is_super_admin()` | ⚡ FULL CONTROL | 🔒 ENABLED |

---

## 3. MATRIZ DE OPERACIONES EFECTIVAS (TABLA × ROL × OPERACIÓN)

| Recurso | Rol | Direct SELECT | Direct INSERT | Direct UPDATE | Direct DELETE | Resultado Efectivo |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 19 Tablas Globales | `anon` | ❌ | ❌ | ❌ | ❌ | **PERMISSION DENIED / 0 ROWS** |
| 19 Tablas Globales | `authenticated` | ❌ | ❌ | ❌ | ❌ | **PERMISSION DENIED / 0 ROWS** |
| 19 Tablas Globales | `Org A User` | ❌ | ❌ | ❌ | ❌ | **PERMISSION DENIED / 0 ROWS** |
| 19 Tablas Globales | `Org B User` | ❌ | ❌ | ❌ | ❌ | **PERMISSION DENIED / 0 ROWS** |
| 19 Tablas Globales | `Org A Admin` | ❌ | ❌ | ❌ | ❌ | **PERMISSION DENIED / 0 ROWS** |
| 19 Tablas Globales | `Org B Admin` | ❌ | ❌ | ❌ | ❌ | **PERMISSION DENIED / 0 ROWS** |
| 19 Tablas Globales | `Super Admin` | 👁️ (vía `is_super_admin()`) | 👁️ (vía server-side) | 👁️ (vía server-side) | 👁️ (vía server-side) | **AUTHORIZATION PASS** |
| 19 Tablas Globales | `service_role` | ⚡ PASS | ⚡ PASS | ⚡ PASS | ⚡ PASS | **SERVER-SIDE EXCLUSIVE PASS** |

---

## 4. MATRIZ DE FUNCIONES Y RPCs AUDITADAS

| Función / RPC | Tipo / Security | Direct EXECUTE `anon` | Direct EXECUTE `authenticated` | Authorized Caller (`service_role` / `super_admin`) |
| :--- | :--- | :---: | :---: | :---: |
| `fn_track_property_price_change()` | SECURITY DEFINER (search_path set) | ❌ REVOKED | ❌ REVOKED | ⚡ Executed via Trigger (`service_role`) |
| `calculate_property_dedup_hash()` | IMMUTABLE SECURITY DEFINER | ❌ REVOKED | ❌ REVOKED | ⚡ Authorized `service_role` Only |
| `get_active_appraisal_settings()` | STABLE SECURITY DEFINER | ❌ REVOKED | ❌ REVOKED | ⚡ Authorized `service_role` / SuperAdmin |

---

## 5. INVARIANTES DE FASE 0 PRESERVADAS

- **Top 20 Fuentes Inmobiliarias UY**: 20 portales registrados (`ingestion_enabled = false` en 20 de 20).
- **Parámetro del 12 %**: `asking_price_adjustment = 0.1200` (12.00%) intacto en versión 1 de `appraisal_settings`.
- **Crawler Runs activos**: 0 crawler runs ejecutadas.
- **Consumo de IA**: 0 llamadas a modelos de IA.
- **Tasaciones automáticas**: 0 valuaciones generadas.
- **Regla de Estado**: `SOLD_OR_REMOVED_UNKNOWN` explícito (`REMOVED != SOLD`).
- **Deduplicación**: Candidatos registrados en `property_duplicate_candidates` sin auto-merge destructivo.
