# ESTRATEGIA DE RESPALDO Y RECUPERACIÓN — HIPOTECALY

## 1. Respaldo de Base de Datos PostgreSQL
- Infraestructura nativa Supabase / PostgreSQL con copias de seguridad continuas y Point-in-Time Recovery (PITR).
- Retención: 7 a 30 días según plan activo.

## 2. Respaldo de Archivos y Storage
- Buckets privados (property-photos, application-documents) con replicación geográfica y durabilidad 99.999999999%.
- Verificación de integridad documental mediante hashes SHA-256 en generated_documents.

## 3. RPO / RTO
- RPO: < 24 horas (PITR < 1 hora).
- RTO: < 2 horas.
