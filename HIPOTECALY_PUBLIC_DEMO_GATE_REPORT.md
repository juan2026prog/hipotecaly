# REPORTE DE GATE COMERCIAL Y EXPERIENCIA DEMO EN HIPOTECALY
Fecha: 24/09/2026
Autor: Antigravity Autonomous Development Agent

## 1. OBJETIVOS LOGRADOS

1. **Corrección Conceptual de Modalidades de Integración**:
   - **01 — SOLO BOTÓN**: La web externa solo incluye el botón CTA y deriva al simulador alojado de la organización.
   - **02 — SIMULADOR EMBEBIDO**: La web externa aloja directamente el simulador canónico de Hipotecaly.
   - **03 — SITIO COMPLETO**: Demostración institucional integral (Estudio Nova).
   - Aclaración transversal: White-Label es la característica común a todas las modalidades, no una modalidad segregada.

2. **Implementación del Gate Comercial Canónico (DemoCommercialGateModal)**:
   - Se ubica en el momento clave de conversión: al hacer clic en [CONTINUAR SOLICITUD] dentro del simulador demo.
   - Opciones claras:
     - [SOLICITAR DEMO]: Redirige al formulario /contacto?demo=true manteniendo monto, valor y origen.
     - [SEGUIR EXPLORANDO]: Cierra el modal sin destruir los datos simulados ni resetear inputs.

3. **Preservación del Flujo de Producción**:
   - Organizaciones reales (isDemoMode === false) no muestran el gate comercial; continúan de forma transparente al Wizard y Portal del Solicitante.

4. **Refinamiento de Copys y Terminología**:
   - De \ Portal de clientes\ ambiguo a \Portal del solicitante\ o \Mi solicitud\.
   - Enlace a \Acceso empresas\ / \Backoffice\.
   - Copy de simulador: *\Simulá tu financiación\* con carácter preliminar no vinculante.
