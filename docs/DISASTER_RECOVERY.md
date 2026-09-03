# HIPOTECALY — Plan de Continuidad de Negocio y Recuperación ante Desastres (Disaster Recovery)

## 1. Objetivos de Recuperación

- **Recovery Point Objective (RPO):** $\le 5$ minutos (pérdida máxima tolerable de datos).
- **Recovery Time Objective (RTO):** $\le 30$ minutos (tiempo máximo para restablecer la operatividad total).

---

## 2. Estrategia de Respaldos (Backups)

### 2.1 Base de Datos PostgreSQL (Supabase Cloud)
- **Point-in-Time Recovery (PITR):** Activado en Supabase Cloud Pro/Enterprise con retención continua de WAL logs durante 7 días.
- **Backups Diarios Automatizados:** Volcado completo `pg_dump` cifrado en reposo (AES-256) replicado en almacenamiento secundario multirregión.
- **Inmutabilidad de Auditoría:** La tabla `audit_logs` con triggers anti-tampering asegura que ningún incidente borre trazas forenses.

### 2.2 Almacenamiento de Archivos (Supabase Storage)
- Replicación geográfica multirregión activa para los buckets `property-photos` y `application-documents`.
- Versionado de objetos activado para prevenir sobreescrituras accidentales.

---

## 3. Protocolo de Failover y Conmutación

En caso de indisponibilidad severa de la región principal de Supabase o Vercel:

1. **Detección y Alerta:** Monitoreo mediante Health Checks sintéticos que alertan a la mesa técnica ante 3 fallos consecutivos en 60 segundos.
2. **Promoción de Réplica:**
   - Si la base principal falla, promover la réplica de lectura a primaria.
   - En Supabase Cloud, el failover de alta disponibilidad (HA) se ejecuta automáticamente en $\le 60$ segundos sin intervención manual.
3. **Actualización de Variables de Entorno en Vercel:**
   - Actualizar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el dashboard de Vercel apuntando a la nueva instancia si se utiliza un proyecto de respaldo caliente.
   - Disparar `vercel --prod` para desplegar el frontend en segundos.
4. **Verificación de Integridad Post-Conmutación:**
   - Ejecutar la suite automatizada: `npx playwright test`.
   - Verificar integridad de tablas críticas (`applications`, `borrowers`, `lender_rules`, `audit_logs`).

---

## 4. Simulacro de Restauración Periódico

- Se realiza un simulacro semestral de restauración completa en un entorno aislado (`staging`).
- Se mide el tiempo exacto de restauración de datos y se auditan las firmas de integridad.
