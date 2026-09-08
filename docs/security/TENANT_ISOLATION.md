# AISLAMIENTO MULTI-TENANT — HIPOTECALY

## 1. Aislamiento Físico y Lógico
- Tablas vinculadas estrictamente con organization_id o tenant_id.
- Políticas RLS en PostgreSQL con Deny-by-Default.

## 2. Regla Cero Fugas Cross-Tenant
Intentos de acceso a recursos de otro tenant devuelven 0 filas o HTTP 403 Forbidden.
