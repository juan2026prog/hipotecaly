# HIPOTECALY — MOTOR DE AUTOMATIZACIONES Y DISPATCHER DE EVENTOS (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 6 (AI + Automation + CRM + Operational Intelligence)  
**Referencia de Código:** [`src/lib/automationEngine.ts`](src/lib/automationEngine.ts), [`src/components/common/NotificationCenter.tsx`](src/components/common/NotificationCenter.tsx)  

---

## 1. OBJETIVO Y ARQUITECTURA GENERAL

El **Motor de Automatizaciones** de HIPOTECALY es un bus de eventos reactivo diseñado para eliminar la fricción operativa manual en el ciclo de vida del crédito hipotecario. Cada evento significativo en el sistema (ingreso de solicitud, carga de recaudos, aceptación de ofertas o estancamiento de expedientes) desencadena reglas parametrizables con aislamiento estricto por tenant.

---

## 2. EVENTOS DISPARADORES CANÓNICOS (TRIGGERS)

| Evento | Descripción Técnica | Destinatarios Principales | Prioridad |
| :--- | :--- | :--- | :---: |
| `application.created` | Solicitante completa y envía el formulario de originación. | Analistas, Super Admin | Normal / Alta |
| `document.uploaded` | Prestatario o asesor adjunta un nuevo archivo al legajo. | Analista del caso | Normal |
| `document.missing` | La revisión documental o el Copilot detectan ausencia de un título/recibo. | Solicitante | Urgente |
| `offer.created` | Un inversor verificado emite una postura en el portal de prestamistas. | Solicitante, Analista | Alta |
| `offer.accepted` | El prestatario acepta formalmente una oferta presentada. | Prestamista, Notarios | Urgente |
| `underwriting.ready` | Finaliza la evaluación de riesgo y análisis de garantías. | Analistas, Comité | Normal |
| `case.stalled` | El expediente no registra avances ni interacciones en > 7 días. | Analista asignado | Alta |

---

## 3. ACCIONES AUTOMATIZADAS (ACTIONS)

Cada regla puede ejecutar una o más acciones combinadas:

1. **`send_notification`:** Inserción de notificación in-app en la bandeja del usuario (filtrable por rol y persistente con estado de lectura).
2. **`create_operational_task`:** Generación automática de una tarea en el backlog operativo del equipo (ej. "Coordinación Notarial", "Triage Documental").
3. **`suggest_status_transition`:** Sugerencia inteligente de cambio de estado en el expediente (ej. pase a "Coordinación Notarial" tras oferta aceptada).
4. **`send_email_alert`:** Despacho de alerta por correo electrónico con cabeceras y pie de página del branding del tenant correspondiente.

---

## 4. CENTRO DE NOTIFICACIONES EN TIEMPO REAL

El componente [`<NotificationCenter>`](src/components/common/NotificationCenter.tsx) se integra en la barra de navegación superior:
- Muestra el conteo en tiempo real de notificaciones no leídas.
- Permite marcar ítems como leídos individualmente.
- Proporciona enlaces directos a la ficha del expediente asociado (`actionUrl`).
- Aplica códigos cromáticos según la severidad: 🔴 Urgente, 🟡 Alta, 🔵 Informativa.
