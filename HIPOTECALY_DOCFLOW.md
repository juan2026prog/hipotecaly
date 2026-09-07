# HIPOTECALY DOCFLOW — Arquitectura Central de Documentos & Autollenado

## 1. Visión General y Principio Fundamental

`HIPOTECALY DOCFLOW` es la capa transversal y central de gestión documental de HIPOTECALY. Su principio cardinal es:

> **"Los datos se escriben UNA SOLA VEZ".**

DocFlow consume de forma autoritativa la información existente en las tablas de Supabase (`applications`, `borrowers`, `properties`, `property_valuations`, `borrower_income`, `organizations`, `lenders`, `profiles`), garantizando que ningún documento vuelva a solicitar manualmente información que la plataforma ya conoce.

---

## 2. Diagrama de Arquitectura

```mermaid
graph TD
    subgraph PostgreSQL / Supabase
        AppTable[(applications)]
        BorrowerTable[(borrowers)]
        PropertyTable[(properties)]
        ValuationTable[(property_valuations)]
        TemplatesTable[(document_templates)]
        DocsTable[(generated_documents)]
        AuditTable[(audit_logs)]
    end

    subgraph DocFlow Core Engine
        Registry[DocumentVariableRegistry]
        Resolver[Variable & Calculations Resolver]
        Validator[Required Fields Validator]
        Engine[Safe Conditional Template Engine]
        Hasher[SHA-256 Crypto & Snapshots]
    end

    subgraph Plataforma HIPOTECALY
        Wizard[Wizard Público]
        MiCuenta[/mi-cuenta Solicitante]
        Expediente[/app/solicitudes/:id]
        DocsRep[/app/documentos]
        LenderPortal[/lender/oportunidades/:id]
        SuperAdmin[/platform-admin]
        Settings[/app/configuracion]
    end

    AppTable --> Resolver
    BorrowerTable --> Resolver
    PropertyTable --> Resolver
    ValuationTable --> Resolver
    Registry --> Resolver

    Resolver --> Validator
    Resolver --> Engine
    TemplatesTable --> Engine
    Engine --> Hasher
    Hasher --> DocsTable
    Hasher --> AuditTable

    DocsTable --> Wizard
    DocsTable --> MiCuenta
    DocsTable --> Expediente
    DocsTable --> DocsRep
    DocsTable --> LenderPortal
    TemplatesTable --> SuperAdmin
    TemplatesTable --> Settings
```

---

## 3. Modelo de Datos

### 3.1 `document_templates` (Plantillas Reutilizables)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `UUID` | Identificador único de la plantilla |
| `tenant_id` | `UUID` | ID de organización (`NULL` si es global de plataforma) |
| `name` | `VARCHAR(255)` | Nombre descriptivo oficial |
| `slug` | `VARCHAR(120)` | Identificador URI único por tenant y versión |
| `description` | `TEXT` | Finalidad jurídica y operativa |
| `category` | `VARCHAR(100)` | Categoría (`solicitud`, `legal`, `financiero`, `inmueble`, `tasacion`, `notarial`, `comunicacion`) |
| `status` | `ENUM` | `draft`, `active`, `inactive`, `archived` |
| `version` | `INT` | Número de versión de la plantilla |
| `template_content` | `TEXT` | Contenido con placeholders `{{category.key}}` y condicionales seguros |
| `output_format` | `VARCHAR(50)` | `pdf`, `html`, `docx` |
| `requires_signature`| `BOOLEAN` | Indica si requiere firma de partes |
| `required_fields` | `TEXT[]` | Lista de variables obligatorias previas a la emisión |
| `conditional_rules`| `JSONB` | Reglas de visualización de bloques |
| `signers_config` | `JSONB` | Roles firmantes y orden de firma |
| `is_global` | `BOOLEAN` | Disponible para todos los tenants si es `true` |

### 3.2 `generated_documents` (Documentos Emitidos & Inmutables)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `UUID` | ID único del documento emitido |
| `tenant_id` | `UUID` | Aislamiento RLS por inquilino |
| `case_id` | `UUID` | Referencia a `applications.id` |
| `template_id` | `UUID` | Referencia a `document_templates.id` |
| `template_version` | `INT` | Versión de plantilla utilizada |
| `document_version` | `INT` | Versión incremental (`1`, `2`, `3...`) |
| `title` | `VARCHAR(255)` | Título con versión |
| `status` | `ENUM` | `draft`, `data_missing`, `generated`, `under_review`, `approved`, `ready_for_signature`, `signed`, `superseded` |
| `file_hash` | `VARCHAR(64)` | Hash criptográfico **SHA-256** del contenido |
| `snapshot_json` | `JSONB` | **Snapshot integral** de los datos del caso en el momento de generación |
| `missing_fields` | `TEXT[]` | Lista de variables faltantes si el estado es `data_missing` |
| `change_detected` | `BOOLEAN` | `true` si los datos del expediente cambiaron posterior a la emisión |

---

## 4. Registro Central de Variables (`DocumentVariableRegistry`)

Las plantillas utilizan variables declarativas estructuradas en categorías normalizadas:

1. **`applicant.*`**: `full_name`, `first_name`, `last_name`, `document_id`, `email`, `phone`, `address`, `department`, `marital_status`, `occupation`, `monthly_income`.
2. **`spouse.*`**: `full_name`, `document_id`, `occupation`.
3. **`property.*`**: `padron`, `department`, `city`, `neighborhood`, `address`, `type`, `area_m2`, `estimated_value`, `appraised_value`, `legal_status`.
4. **`loan.*`**: `requested_amount`, `approved_amount`, `currency`, `term_months`, `interest_rate`, `monthly_payment`, `ltv`, `repayment_mode`.
5. **`lender.*`**: `name`, `document_id`, `contact_name`, `contact_email`.
6. **`notary.*`**: `name`, `email`, `phone`, `license`.
7. **`case.*`**: `code`, `created_at`, `status`, `days_open`.
8. **`tenant.*`**: `name`, `legal_name`, `legal_representative`, `legal_address`, `logo_url`, `footer_text`.
9. **`dates.*`**: `today_formatted`, `current_year`, `current_month_name`.

---

## 5. Las 15 Plantillas Base Oficiales

1. **`solicitud-credito`**: Solicitud Formal de Crédito Hipotecario.
2. **`autorizacion-consulta`**: Autorización de Consulta de Información Crediticia / Clearing.
3. **`consentimiento-privacidad`**: Consentimiento Ley N° 18.331 de Protección de Datos Personales.
4. **`declaracion-jurada-ingresos`**: Declaración Jurada de Ingresos y Situación Patrimonial.
5. **`origen-de-fondos`**: Declaración de Origen Lícito de Fondos (PLAFT / Ley N° 19.574).
6. **`ficha-solicitante`**: Ficha Integral del Solicitante.
7. **`ficha-inmueble`**: Ficha Técnica del Inmueble en Garantía.
8. **`resumen-operacion`**: Resumen Ejecutivo de la Operación Crediticia.
9. **`oferta-credito`**: Propuesta / Oferta Formal de Financiamiento.
10. **`aceptacion-condiciones`**: Aceptación Formal de Condiciones de Crédito.
11. **`instrucciones-escribano`**: Instrucciones y Minuta para Escribano Actuante.
12. **`checklist-documental`**: Checklist de Legajo y Documentación Registral.
13. **`resumen-tasacion`**: Informe Preliminar de Valuación Inmobiliaria.
14. **`comunicacion-aprobacion`**: Comunicación Oficial de Aprobación Crediticia.
15. **`comunicacion-observaciones`**: Comunicación de Observaciones y Recaudos Pendientes.

---

## 6. Seguridad, Aislamiento RLS & Hashes Criptográficos

* **Row Level Security (RLS)**: Ningún tenant puede leer ni modificar templates o documentos de otro tenant.
* **Inmutabilidad y Versionado**: Los documentos generados no se sobreescriben; al actualizar datos se genera la versión `v(n+1)` marcando la anterior como `superseded`.
* **Hash SHA-256**: Cada documento cuenta con su huella digital criptográfica calculada sobre su contenido final.
* **Storage Privado**: Las descargas se realizan mediante enlaces firmados con expiración temporal.
