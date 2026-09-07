# Modo Simulación y Entorno de Pruebas (Mock Mode)

SiteOS incluye un modo de simulación integral (`mode: 'mock'`) para permitir el desarrollo, pruebas QA y demostraciones sin incurrir en costos de APIs externas ni requerir hardware de firma (lectores de cédula o tokens).

---

## 1. Características del Modo Simulación

1. **Cero Costo**: No genera llamadas a la API de Didit ni a AGESIC.
2. **Watermarking de Seguridad**: Todo documento firmado en modo mock incluye de forma obligatoria el sello:
   > `DEMO / SIN VALIDEZ JURÍDICA — GENERADO EN MODO SIMULACIÓN`
3. **Control Total de Escenarios**: Permite simular:
   - Aprobación inmediata de KYC (`verified`).
   - Rechazo por documento ilegible o sospecha de fraude (`failed`).
   - Timeout o expiración de sesión (`expired`).
   - Reintento de fotos (`resubmission_required`).
   - Firma mediante TuID Antel simulado o Cédula Digital simulada.

---

## 2. Consola QA para Forzar Resultados

En el panel de administración (`/platform-admin`), los administradores y testers disponen de la herramienta:

- **Forzar Aprobación (`verified`)**: Transiciona la sesión a `verified` y crea el evento de auditoría correspondiente.
- **Forzar Rechazo (`failed`)**: Transiciona la sesión a `failed` con motivo `DOCUMENT_EXPIRED` o `FRAUD_SUSPICION`.
- **Forzar Expiración (`expired`)**: Simula el abandono del usuario.

### Invocación API Directa para Tests Automatizados:
```bash
POST /api/integrations/kyc/test-force
Content-Type: application/json

{
  "sessionId": "demo_session_123",
  "forcedStatus": "verified",
  "reason": "QA Test Verification"
}
```

---

## 3. Fallback Automático

Si un tenant no tiene configuradas credenciales de producción para Didit o Firma.gub.uy, el sistema conmuta automáticamente a los proveedores `MockKycProvider` y `MockSignatureProvider`, garantizando que la aplicación continúe operativa sin lanzar errores no controlados.

