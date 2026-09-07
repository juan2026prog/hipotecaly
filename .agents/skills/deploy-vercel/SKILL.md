---
name: deploy-vercel
description: Ejecuta el flujo estandarizado de compilación, verificación técnica, commit y despliegue a producción en Vercel para HIPOTECALY (https://hipotecaly.vercel.app/).
---

# Deploy Vercel — HIPOTECALY

Esta skill define el procedimiento para compilar, verificar y desplegar las actualizaciones del proyecto HIPOTECALY en Vercel Producción.

## Cuándo Utilizar Esta Skill
- Al finalizar cualquier tarea, refactorización, rediseño o corrección en el proyecto.
- Cuando el usuario solicite desplegar o actualizar el entorno de producción (`https://hipotecaly.vercel.app/`).

## Pasos del Procedimiento

### 1. Validación de Tipos y Build
```bash
npx tsc --noEmit
npm run build
```
Ambos comandos deben terminar con código 0 sin errores de tipos ni de empaquetado.

### 2. Inspección de Seguridad Previa al Commit
Asegurarse de que no existan credenciales privadas ni secretos en staging:
```bash
git status
```
Verificar que archivos como `.env`, `.env.local`, llaves de API y credenciales de backend permanezcan ignorados por `.gitignore`.

### 3. Commit y Push a Rama Principal
```bash
git add <archivos modificados>
git commit -m "feat/fix: <descripción concisa de cambios>"
git push origin main
```

### 4. Despliegue en Vercel
El repositorio GitHub conectado a Vercel despliega automáticamente cada push a `main`.
Para forzar o verificar vía Vercel CLI:
```bash
npx vercel --prod --yes
```

### 5. Verificación de Producción
Acceder o verificar `https://hipotecaly.vercel.app/` asegurando que la última versión esté en línea y respondiendo HTTP 200.
