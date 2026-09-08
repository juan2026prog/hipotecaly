# CONTROL DE ACCESO Y MATRIZ RBAC — HIPOTECALY

> **Principio Fundamental:** Mínimo Privilegio (Least Privilege) y Deny-by-Default

---

## 1. Definición de Roles

| Rol | Ámbito | Descripción de Permisos |
| :--- | :--- | :--- |
| **super_admin** | Plataforma Global | Gestión de infraestructura, proveedores de IA, onboarding de tenants, auditoría global y métricas de seguridad. |
| **	enant_owner** | Tenant / Estudio | Administración total de la organización, facturación, miembros, reglas de crédito y módulos. |
| **	enant_admin** | Tenant / Estudio | Configuración operativa, gestión de expedientes, asignación de escribanos e inversores. |
| **nalyst** | Tenant / Estudio | Revisión de solicitudes, evaluación de garantías, ejecución de análisis IA y reportes. |
| **operator** | Tenant / Estudio | Carga de datos, seguimiento de trámites y contacto operativo con clientes. |
| **
otary** | Asignación Específica | Revisión notarial, checklist documental, observaciones jurídicas y firma de escrituras asignadas. |
| **lender** | Red Privada Tenant | Consulta de oportunidades autorizadas, simulación de ofertas y matching hipotecario. |
| **orrower** | Expediente Propio | Creación de solicitud, carga de documentos personales, consulta de estado y firma digital. |

---

## 2. Matriz de Autorización Cruzada

| Actor | Expediente Propio | Expediente Ajeno | Otro Tenant | Configuración Global |
| :--- | :---: | :---: | :---: | :---: |
| **Cliente (orrower)** | ✅ Permitido | ❌ Denegado (403) | ❌ Denegado (403) | ❌ Denegado (403) |
| **Escribano (
otary)** | ✅ Solo asignados | ❌ Denegado (403) | ❌ Denegado (403) | ❌ Denegado (403) |
| **Inversor (lender)** | ✅ Solo autorizados | ❌ Denegado (403) | ❌ Denegado (403) | ❌ Denegado (403) |
| **Analista / Backoffice** | ✅ En su tenant | ❌ Denegado (403) | ❌ Denegado (403) | ❌ Denegado (403) |
| **Administrador Tenant** | ✅ En su tenant | ❌ Denegado (403) | ❌ Denegado (403) | ❌ Denegado (403) |
| **Super Admin** | ✅ Auditado | ✅ Auditado | ✅ Auditado | ✅ Permitido |

---

## 3. Resolución de Roles Server-Side
- El frontend **nunca** define el rol efectivo.
- Toda mutación y consulta valida el rol consultando public.organization_members y public.profiles mediante funciones SECURITY DEFINER protegidas contra inyecciones.
