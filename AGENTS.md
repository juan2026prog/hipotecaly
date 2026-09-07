# REGLAS DEL PROYECTO HIPOTECALY

## REGLA GLOBAL: DEPLOY AUTOMÁTICO A VERCEL EN PRODUCCIÓN

Al finalizar cualquier modificación, rediseño, refactorización o desarrollo de nuevas funcionalidades en este proyecto, Antigravity DEBE ejecutar de forma obligatoria el flujo de validación y deploy a producción en Vercel:

URL de producción: `https://hipotecaly.vercel.app/`

### Flujo Obligatorio de Finalización:

1. **Validación Técnica:**
   - Ejecutar `npx tsc --noEmit` (debe finalizar con 0 errores).
   - Ejecutar `npm run build` (debe compilar exitosamente).

2. **Seguridad Estricta:**
   - Verificar que ningún archivo `.env`, credencial privada, clave `service_role` o secreto quede trackeado o commiteado.
   - Respetar `.gitignore`.

3. **Commit & Push a GitHub:**
   - Realizar `git add <archivos modificados>`.
   - Realizar `git commit -m "<mensaje descriptivo>"`.
   - Realizar `git push origin main`.

4. **Deploy a Vercel:**
   - El push a la rama `main` en `origin` dispara automáticamente el build y deploy en Vercel a `https://hipotecaly.vercel.app/`.
   - Si se requiere deploy directo o forzado por CLI: ejecutar `npx vercel --prod --yes` asegurando que no exponga variables privadas.

5. **Verificación de Disponibilidad:**
   - Confirmar que el build en producción quede operativo en `https://hipotecaly.vercel.app/`.
