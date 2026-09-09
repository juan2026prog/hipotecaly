# HIPOTECALY — AUDITORÍA TÉCNICA EXHAUSTIVA DE AGENDA Y GOOGLE CALENDAR (2026)

**Fecha de Auditoría:** Septiembre 2026  
**Entorno:** HIPOTECALY Core Multi-Tenant Platform  
**Objetivo:** Determinar con rigor técnico el estado actual de la agenda, eventos de firma, entrega de documentación física, integración con Google Calendar y proponer el modelo de datos y roadmap para la implementación definitiva.

---

## 1. PRINCIPIO ARQUITECTÓNICO FUNDAMENTAL

```
┌────────────────────────────────────────────────────────────────────────┐
│                      AGENDA PROPIA HIPOTECALY                          │
│                      (FUENTE ÚNICA DE VERDAD)                          │
├────────────────────────────────────────────────────────────────────────┤
│  • Expediente Oficial (Case ID / Public ID)                            │
│  • Estado Notarial (Firma por coordinar, Agendada, Originales)         │
│  • Responsable Asignado (Escribano / Analista)                         │
│  • Participantes Legales (Deudor, Acreedor, Escribano, Garantes)       │
│  • Auditoría Registrada y Registro Inmutable                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼ (Sincronización Unidireccional Opcional)
┌────────────────────────────────────────────────────────────────────────┐
│                       GOOGLE CALENDAR API                              │
│                      (ESPEJO EXTERNO DE USUARIO)                       │
├────────────────────────────────────────────────────────────────────────┤
│  • Conexión Opcional por Usuario (Cuenta Google del Escribano/Operador)│
│  • Recordatorio en agenda personal del profesional                     │
│  • Información Sanitizada (Sin datos financieros sensibles)            │
└────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **No utilizar Google Calendar como base de datos primaria.** Toda la lógica de negocio, trazabilidad, estados de expediente y control de acceso RLS multi-tenant debe residir de forma canónica en la base de datos de HIPOTECALY en Supabase.

---

## 2. DIAGNÓSTICO DEL ESTADO ACTUAL DEL REPOSITORIO

### A. Resumen de Clasificación Global

| Componente | Clasificación | Detalle Técnico |
| :--- | :---: | :--- |
| **Google Calendar API** | ⚪ **MOCK** | Servicio cliente en `src/lib/calendar/googleCalendarService.ts` que almacena eventos en `localStorage` del navegador y genera identificadores `gcal_*` simulados. No existen llamadas HTTP a `googleapis.com` ni manejo de OAuth Tokens/Refresh Tokens. |
| **Agenda Propia Hipotecaly** | 🟡 **PARCIAL** | La UI notarial (`NotarySignaturesPage`, `NotaryCalendarPage`, `NotaryApplicationDetailPage`) permite visualizar y coordinar firmas, pero los eventos residen en memoria/`localStorage`. En Supabase DB solo se persiste la transición de estado `applications.notary_status`. |
| **Tablas de Eventos / Citas** | 🔴 **NO EXISTEN** | No existen tablas `calendar_events`, `appointments`, `meetings` ni `signature_schedules` en las migraciones de PostgreSQL/Supabase. |
| **Tracking de Originales** | 🟡 **PARCIAL** | Existe el estado `originals_required` y `originals_received` en `types.ts`, y se muestra en la UI como "Originales cotejados", pero no existe una entidad de remesa física con fecha límite ni trazabilidad de entrega de títulos en DB. |
| **Recordatorios Automáticos** | 🔴 **NO EXISTEN** | Los flags `reminders: { hours24: true, hours2: true }` son propiedades estáticas en la UI; no hay cron jobs, edge functions ni envíos de correo programados en backend. |

---

## 3. AUDITORÍA DETALLADA POR PERFIL DE USUARIO

### 1. Backoffice White Label (Admin, Analista, Operador)
- **Vistas**: `ApplicationsPage`, `ApplicationDetailPage`, `TasksPage`, `ValuationsPage`.
- **Estado Actual**: Las tareas operativas tienen campos conceptuales de fecha (`due_date`), pero no están articuladas en una agenda global del tenant ni vinculadas con un calendario interactivo.
- **Acciones**: Pueden ver el estado de formalización del expediente, pero la coordinación formal de la firma está delegada al módulo notarial.

### 2. Escribano (`/notary`)
- **Vistas**: 
  - `NotaryCalendarPage.tsx`: Muestra una cuadrícula mensual con eventos estáticos hardcodeados (vencimientos de certificados DGR, audiencias de firma).
  - `NotarySignaturesPage.tsx`: Divide los expedientes en dos bloques operativos:
    1. *Firmas por coordinar*: Expedientes con revisión notarial aprobada pendientes de fijar fecha.
    2. *Firmas agendadas*: Expedientes con evento confirmado (consumiendo `googleCalendarService`).
  - `NotaryApplicationDetailPage.tsx`: Dispone de un modal de agendamiento con selector de fecha, hora, lugar y slots disponibles simulados (`getAvailableCalendarSlots`).
- **Persistencia Real**: Al confirmar el agendamiento, actualiza `applications.notary_status = 'signature_scheduled'` en Supabase, pero el detalle del evento (fecha, hora, lugar, participantes) se guarda en `localStorage`.

### 3. Cliente / Solicitante (`/demo/:tenant/cliente`)
- **Vistas**: `ApplicantAccount.tsx`, `MyApplicationsSection.tsx`, `ApplicationDetailView.tsx`.
- **Estado Actual**: El cliente visualiza el stepper de 6 etapas (`Etapa 5: Formalización & Firma`). Puede firmar documentos con hash y subir archivos a Storage.
- **Faltante**: No dispone de una tarjeta destacada de "Próxima Cita de Firma" donde pueda ver la fecha, hora, dirección del estudio notarial o enlace a Google Meet y lista de requisitos previos para el día del acto.

### 4. Super Admin (`/superadmin`)
- **Estado Actual**: Supervisa el estado de los tenants e integraciones globales. Correctamente **no interviene** en la agenda privada de los expedientes individuales de cada tenant o estudio notarial.

---

## 4. MATRIZ DE ACCIONES EN UI VS PERSISTENCIA REAL

| Acción en Interfaz | Existe en UI | Persiste en DB | Notificación / Correo | Google Calendar Real | Comportamiento Técnico Actual |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Coordinar Firma** | ✅ | 🟡 | ❌ | ❌ | Abre modal en detalle notarial; pasa estado a `signature_to_coordinate` en `applications`. |
| **Agendar Firma** | ✅ | 🟡 | ❌ | ⚪ | Guarda fecha/hora en `localStorage`; actualiza `applications.notary_status = 'signature_scheduled'`. |
| **Reprogramar Firma** | 🟡 | 🟡 | ❌ | ❌ | Método `rescheduleEvent` existe en servicio cliente; no hay endpoint REST ni tabla DB. |
| **Cancelar Cita** | 🟡 | 🟡 | ❌ | ❌ | Método `cancelEvent` en `localStorage`; no revierte formalmente el estado del expediente en DB. |
| **Solicitar Originales** | 🟡 | 🟡 | ❌ | ❌ | Botón condicional que pasa `notary_status` a `originals_required`; no registra remesa ni fecha límite. |
| **Recibir Originales** | 🟡 | 🟡 | ❌ | ❌ | Muestra badge "Originales cotejados" en UI; no hay registro de recepción con firma o acta. |
| **Ver Disponibilidad** | ⚪ | ❌ | ❌ | ⚪ | Función `getAvailableCalendarSlots` devuelve un array estático en memoria (`09:30`, `11:00`, `15:30`). |

---

## 5. ENTREGABLE OFICIAL DE AUDITORÍA DE CALENDARIO

| Función | Estado | Fuente | Persistencia | UI | Integración Google |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **Firma por coordinar** | 🟡 PARCIAL | `applications.notary_status` | Supabase DB (`applications`) | ✅ | ❌ |
| **Firma agendada** | 🟡 PARCIAL | `googleCalendarService` / DB | `localStorage` + `applications` | ✅ | ⚪ MOCK |
| **Reprogramación** | 🟡 PARCIAL | `googleCalendarService` | `localStorage` | 🟡 | ❌ |
| **Cancelación** | 🟡 PARCIAL | `googleCalendarService` | `localStorage` | 🟡 | ❌ |
| **Pedido de originales**| 🟡 PARCIAL | `applications.notary_status` | Supabase DB (`applications`) | 🟡 | ❌ |
| **Recordatorios (24h/2h)**| 🔴 NO IMPLEMENTADO| N/A | N/A | ⚪ | ❌ |
| **Google Calendar Real**| ⚪ MOCK | `localStorage` | Ninguna | ✅ | ⚪ MOCK |

---

## 6. ESPECIFICACIÓN DE LA FUENTE DE VERDAD: TABLA `calendar_events`

Para la futura implementación de la Fase 1, la entidad canónica en Supabase será la siguiente:

```sql
CREATE TYPE calendar_event_type_enum AS ENUM (
    'signature',             -- Firma de escritura / mutuo / hipoteca
    'original_documents',    -- Entrega o cotejo de títulos originales
    'valuation',             -- Inspección o tasación pericial del inmueble
    'client_meeting',        -- Reunión presencial o remota con el solicitante
    'notary_review',         -- Audiencia o revisión notarial de recaudos
    'deadline',              -- Plazo límite o vencimiento registral
    'other'
);

CREATE TYPE calendar_event_status_enum AS ENUM (
    'pending_coordination',  -- Pendiente de acordar fecha
    'proposed',              -- Fecha propuesta a las partes
    'scheduled',             -- Confirmada y agendada
    'completed',             -- Realizada con éxito
    'rescheduled',           -- Reprogramada con nueva fecha
    'cancelled'              -- Cancelada
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    event_type calendar_event_type_enum NOT NULL DEFAULT 'signature',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Montevideo',
    location_type VARCHAR(50) NOT NULL DEFAULT 'notary_office', -- 'notary_office', 'virtual', 'property', 'other'
    location_address TEXT,
    virtual_meeting_url TEXT,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array con { name, role, email, phone, status }
    required_documents JSONB DEFAULT '[]'::jsonb,
    status calendar_event_status_enum NOT NULL DEFAULT 'scheduled',
    google_calendar_event_id VARCHAR(255),
    google_sync_status VARCHAR(50) DEFAULT 'not_synced', -- 'not_synced', 'synced', 'sync_error'
    google_last_synced_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices y RLS Estricto
CREATE INDEX idx_cal_events_org ON public.calendar_events(organization_id);
CREATE INDEX idx_cal_events_app ON public.calendar_events(application_id);
CREATE INDEX idx_cal_events_start ON public.calendar_events(start_at);
CREATE INDEX idx_cal_events_status ON public.calendar_events(status);
```

---

## 7. ARQUITECTURA DE INTEGRACIÓN OPCIONAL CON GOOGLE CALENDAR

### 1. Conexión por Usuario (No Global)
- Cada escribano o analista conecta voluntariamente su propia cuenta de Google desde su perfil (`/notary/perfil` o configuración personal).
- Las credenciales y refresh tokens se almacenan cifrados en base de datos (`user_integrations` o Supabase Vault server-side), jamás expuestos al frontend.

### 2. Scopes Mínimos Estrictos
- Scopes para autenticación general de Hipotecaly: `openid email profile`.
- Scope adicional **únicamente** al presionar `[ Conectar Google Calendar ]`: `https://www.googleapis.com/auth/calendar.events` (permite crear y editar solo eventos gestionados por la app, sin acceso a contactos ni otros correos).

### 3. Modelo de Sincronización Unidireccional Recomendado
- `HIPOTECALY -> GOOGLE CALENDAR`:
  - Al agendar en Hipotecaly, se crea el evento en Google Calendar vía API server-side (`calendar.events.insert`).
  - Al reprogramar en Hipotecaly, se actualiza en Google Calendar (`calendar.events.update`).
  - Al cancelar en Hipotecaly, se elimina o cancela en Google Calendar (`calendar.events.delete`).
- *Por qué no bidireccional en Fase 1*: Evita que una modificación accidental desde el móvil en la app de Google Calendar sobreescriba los estados jurídicos del expediente en Hipotecaly sin validación de firmas ni quorum de participantes.

### 4. Privacidad y Seguridad de Datos en Google
- No enviar datos financieros ni crediticios sensibles a los títulos de Google Calendar.
- Formato seguro de evento en Google Calendar:
  - **Título**: `Firma Notarial — Expediente HIP-2026-00158`
  - **Descripción**: `Audiencia de firma de escritura pública. Para consultar los recaudos y antecedentes jurídicos protegidos, ingrese al portal seguro de Hipotecaly.`
  - **Ubicación**: Dirección del estudio notarial o enlace de Google Meet.

---

## 8. ROADMAP TÉCNICO EN 5 FASES

```
FASE 1: Agenda Interna Hipotecaly (Fuente de Verdad en Supabase)
  ├── 1. Migración DB: Crear tabla `calendar_events` con RLS multi-tenant
  ├── 2. Servicio `calendarService.ts`: CRUD con queries reales a Supabase
  └── 3. UI Notarial & Backoffice: Reemplazar `googleCalendarService` mock por `calendarService`

FASE 2: Coordinación de Firmas y Pedido de Originales
  ├── 1. Flujo interactivo: Propuesta de fechas al cliente y confirmación
  ├── 2. Módulo de Originales: Tracking de entrega física de títulos y fecha límite
  └── 3. Vista de Cita en Portal Cliente: Tarjeta con fecha, lugar y requisitos

FASE 3: Notificaciones y Recordatorios
  ├── 1. Edge Function / Cron de recordatorios (T-24h y T-2h)
  └── 2. Envíos transaccionales por email (Resend) con archivos adjuntos e instrucciones

FASE 4: Conexión Opcional Google Calendar
  ├── 1. Botón "Conectar Google Calendar" en perfil del profesional
  ├── 2. Flujo OAuth con scope incremental `calendar.events`
  └── 3. Sincronización server-side `Hipotecaly -> Google Calendar`

FASE 5: Disponibilidad Free/Busy & Sincronización Avanzada
  ├── 1. Consulta de slots libres del escribano vía Google Calendar Free/Busy API
  └── 2. Detección automática de conflictos de agenda antes de proponer fecha
```

---

## 9. CONCLUSIÓN DEL DIAGNÓSTICO

HIPOTECALY cuenta con un excelente diseño de interfaz notarial y un ciclo de estados bien delimitado en frontend. Sin embargo, la persistencia de las citas y la integración con Google Calendar son puramente simuladas en `localStorage`. La ruta trazada en este roadmap permitirá construir una agenda robusta y soberana en Supabase antes de conectar la sincronización externa con Google.
