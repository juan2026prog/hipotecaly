# MATRIZ Y REPORTE DE SEGURIDAD Y PRIVACIDAD DE LA DEMO PÚBLICA DE HIPOTECALY
Fecha: 24/09/2026
Versión: 2.0.0
Auditor: Antigravity Autonomous Security Engine

## 1. RESUMEN EJECUTIVO
Se implementó y auditó el esquema de seguridad y aislamiento de la Demo Pública para HIPOTECALY (Estudio Nova / Tenant Demo).
La superficie pública expone exclusivamente la simulación paramétrica preliminar y bloquea la navegación no autenticada o anónima hacia flujos operativos reales.

## 2. PUNTOS DE CONTROL AUDITADOS

1. **Gate Comercial Canónico (DemoCommercialGateModal)**:
   - Bloquea la progresión hacia ApplicationWizard y ApplicantPortal cuando isDemoMode es verdadero.
   - Protege datos confidenciales de leads y evita creación de expedientes fantasmas o leaks de backend.
   - Preserva los valores en memoria (equestedAmount, propertyValue, 	ermMonths) permitiendo al usuario continuar explorando o solicitar una demo formal a /contacto.

2. **Aislamiento de Rutas Operativas**:
   - /demo/:tenantSlug/admin/*: Redirige o bloquea a usuarios anónimos mediante guardas de autenticación.
   - /demo/:tenantSlug/portal/*: Requiere sesión activa del solicitante real.
   - /org/:tenantSlug/solicitar: En tenants productivos reales continúa directamente al Wizard sin interrupción.

3. **Variables y Secretos**:
   - Ninguna clave privada (service_role, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY) está expuesta en el frontend ni en rutas de demo.
   - Todas las configuraciones públicas de tenant consumen endpoints públicos o datos parametrizados seguros.

## 3. CONCLUSIÓN
El entorno de demo pública se encuentra completamente blindado contra filtraciones de datos operativos y brinda una experiencia de conversión clara hacia el equipo de ventas.
