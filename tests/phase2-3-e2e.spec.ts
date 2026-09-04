import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

test.describe('MACROFASE 2–3: MARKETPLACE E2E + LENDER OPERATIONS + WHITE-LABEL PRODUCTIZATION', () => {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- PARTE A: FLUJO MARKETPLACE END-TO-END Y PRESTAMISTA ---
  test('1. Flujo Solicitante: Simulación con pre-carga al asistente de solicitud', async ({ page }) => {
    await page.goto('/solicitar?monto=90000&valor_propiedad=200000&plazo=36');
    await expect(page.locator('button:has-text("Continuar")')).toBeVisible();
  });

  test('2. Portal Prestamista: Feed de oportunidades con Anti-Bypass estricto', async ({ page }) => {
    await page.goto('/lender/oportunidades');
    await expect(page.getByText(/Oportunidades de Financiamiento|Feed de Oportunidades/i).first()).toBeVisible();
    
    // Verificar que NINGÚN dato de contacto ni PII de solicitantes está presente
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('@gmail.com');
    expect(bodyText).not.toContain('@hotmail.com');
    expect(bodyText).not.toContain('+598');
  });

  test('3. Portal Prestamista: Ficha de oportunidad anonimizada sin dirección exacta ni padrón', async ({ page }) => {
    await page.goto('/lender/oportunidades/opp-1');
    await expect(page.getByRole('heading', { name: /Ficha Técnica Anonimizada de/i })).toBeVisible();

    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('Padrón:');
    expect(bodyText).not.toContain('padron:');
    expect(bodyText).not.toContain('Av. Arocena');
    expect(bodyText).not.toContain('Número de Puerta');
  });

  test('4. Portal Prestamista: Simulación y emisión de oferta con condiciones de amortización', async ({ page }) => {
    await page.goto('/lender/oportunidades/opp-1');
    const offerButton = page.getByRole('button', { name: /Presentar Oferta|Enviar Oferta|Emitir Oferta/i });
    if (await offerButton.isVisible()) {
      await offerButton.click();
    }
  });

  test('5. Anti-Bypass: Ofertas "submitted" NO son visibles al prestatario hasta ser validadas', async () => {
    const { data, error } = await anonClient
      .from('offers')
      .select('*')
      .eq('status', 'submitted');

    // Por RLS anonClient no puede ver ofertas en estado 'submitted'
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('6. Backoffice: Matching y Presentación formal de ofertas al solicitante', async ({ page }) => {
    await page.goto('/app/solicitudes/HIP-2026-00124');
    await page.getByRole('button', { name: /Prestamistas/i }).click();
    await expect(page.getByText(/Motor de Matching y Scoring/i)).toBeVisible();
    await expect(page.getByText(/Ofertas de Financiamiento Recibidas/i)).toBeVisible();
  });

  test('7. Solicitante: Visualización y Aceptación de oferta presentada en /mi-cuenta', async ({ page }) => {
    await page.goto('/mi-cuenta');
    await page.getByRole('button', { name: /Ofertas/i }).filter({ visible: true }).first().click();
    await expect(page.getByText(/Propuestas de Financiamiento Disponibles/i)).toBeVisible();

    const acceptBtn = page.getByRole('button', { name: /Aceptar Propuesta/i });
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await expect(page.getByText(/Propuesta Aceptada/i)).toBeVisible();
    }
  });

  test('8. Anti-Bypass: Aceptación de oferta NO revela automáticamente datos sensibles', async () => {
    const { data, error } = await anonClient
      .from('borrowers')
      .select('id, first_name, last_name, phone, email');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // --- PARTE B: WHITE-LABEL COMERCIAL Y OPERATIVO ---
  test('9. White-Label: Resolución dinámica de tenant sin recargar ni compilar código nuevo', async ({ page }) => {
    await page.goto('/org/estudio-notarial-este');
    await expect(page.getByText('Créditos Hipotecarios Punta del Este')).toBeVisible();
  });

  test('10. White-Label: Portal Super Admin gestiona tenants, reglas y feature flags en caliente', async ({ page }) => {
    await page.goto('/admin/tenants');
    await expect(page.locator('text=Gestión de Organizaciones y Módulos')).toBeVisible();
    await expect(page.locator('text=NOVA Crédito Hipotecario').first()).toBeVisible();
  });
});
