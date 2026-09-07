# Guía de Reutilización e Instalación con SiteOS

El módulo de Identidad, KYC y Firma Digital está empaquetado en el registro global de SiteOS como:

- Módulos individuales:
  - `identity-core`: Máquina de estados KYC, eventos, repositorio y MockKycProvider.
  - `kyc-didit`: Adaptador Didit Verification API v3 y validador X-Signature-V2.
  - `signature-core`: Orquestador de firmas, dual SHA-256 hash util y MockSignatureProvider.
  - `signature-firma-gub`: Adaptador AGESIC Firma.gub.uy (Proceso 1 y Proceso 2).
- Pack consolidado:
  - `identity-signature`: Instala todos los módulos anteriores con sus migraciones y UI unificada.

---

## 1. Instalación en Nuevos Proyectos con SiteOS CLI

En cualquier proyecto que use SiteOS:

```bash
# Instalar el pack completo de identidad y firma
npx siteos install identity-signature

# O instalar únicamente el módulo deseado
npx siteos install identity-core
npx siteos install kyc-didit
```

---

## 2. Ejecutar Migraciones SQL

Al instalar el módulo, SiteOS provee la migración unificada:
```bash
# Aplicar migración en Supabase
supabase migration up
```

O copiar el archivo `supabase/migrations/20260904000014_identity_kyc_digital_signature_core.sql` al directorio de migraciones de su proyecto.

---

## 3. Uso en TypeScript / React

```typescript
import { 
  identityRegistry, 
  signatureRegistry,
  KycVerificationCard,
  SignatureProcessCard 
} from '@/lib/siteos';

// Registrar proveedores según configuración del tenant
const kycProvider = identityRegistry.get('didit');
const signatureProvider = signatureRegistry.get('firma_gub');

// En componentes React
<KycVerificationCard caseId={solicitud.id} applicantName={solicitud.titular} />
<SignatureProcessCard processId={firma.id} />
```

---

## 4. Diagnóstico de Salud con SiteOS Doctor

Para verificar que la infraestructura de identidad y firma esté correctamente configurada:

```bash
npx siteos doctor
```

SiteOS Doctor validará:
- Presencia de tablas en Supabase (`identity_verifications`, `signature_processes`).
- Existencia de endpoints `/api/integrations/kyc/*` y `/api/integrations/signature/*`.
- Configuración de variables de entorno y ausencia de secretos en el frontend.
