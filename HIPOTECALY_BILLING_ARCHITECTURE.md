# HIPOTECALY — ARQUITECTURA DE FACTURACIÓN, METERING & OVERAGES (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 7 (Enterprise + Integrations + Billing + Security + Commercial Go-Live)  
**Referencia de Código:** [`src/lib/billingService.ts`](src/lib/billingService.ts), [`src/lib/usageMeteringService.ts`](src/lib/usageMeteringService.ts)  

---

## 1. INTRODUCCIÓN

El modelo de facturación de **HIPOTECALY** está diseñado bajo una arquitectura híbrida **Suscripción Fija + Tarificación por Consumo (Metering & Overages)** que garantiza previsibilidad para el cliente y alineación con el crecimiento de su cartera hipotecaria.

---

## 2. COMPOSICIÓN DE LA CUOTA MENSUAL

La factura mensual consolidada de una organización se compone de:

$$\text{Total USD} = \text{Cuota Plan Base} + \sum \text{Add-Ons Activos} + (\text{Expedientes Excedentes} \times \$15) + (\text{Casos AI Excedentes} \times \$10)$$

### 2.1 Planes Base (Mensual vs Anual con 20% descuento)
- **START:** USD 149 / mes (Anual: USD 119/mes) — 2 usuarios, 10 expedientes incluidos.
- **PROFESSIONAL:** USD 349 / mes (Anual: USD 279/mes) — 5 usuarios, 35 expedientes incluidos.
- **PLATFORM:** USD 799 / mes (Anual: USD 639/mes) — 15 usuarios, 100 expedientes incluidos.
- **ENTERPRISE:** USD 1,800 / mes (Anual: USD 1,440/mes) — Usuarios ilimitados, SLA dedicado.

### 2.2 Precios de Referencia de Add-Ons Activos
- **Sindicación Multi-Inversor:** USD 149 / mes
- **Document Intelligence Asistivo:** USD 199 / mes
- **Risk & Consistency Copilot:** USD 199 / mes
- **Red de Tasaciones Periciales:** USD 99 / mes
- **Loan Servicing & Cuotas:** USD 199 / mes
- **Conciliación de Comprobantes:** USD 99 / mes
- **Dominio Personalizado + SSL Dedicado:** USD 149 / mes
- **Analítica Avanzada & Reporting:** USD 149 / mes

---

## 3. CICLO DE VIDA DE FACTURACIÓN & ESTADOS

1. **`pending`:** Factura pro-forma emitida al inicio del período con vencimiento a 10 días.
2. **`paid`:** Comprobante bancario conciliado o cobro automático con tarjeta procesado con éxito.
3. **`overdue`:** Gracia de 5 días hábiles antes de suspender temporalmente el acceso a nuevas originaciones (manteniendo consulta de expedientes existentes).

---

## 4. MEDIOS DE PAGO SOPORTADOS EN URUGUAY & REGIÓN

- **Transferencia Bancaria Local (Uruguay):** Cuentas corrientes corporativas en BROU, Santander, Itaú y BBVA en dólares (USD) o pesos uruguayos (UYU).
- **Tarjetas de Crédito Corporativas:** Procesamiento en línea con pasarelas certificadas PCI-DSS Nivel 1.
- **Facturación Institucional con RUT:** Emisión de factura electrónica de exportación de servicios de software (IVA 0%).
