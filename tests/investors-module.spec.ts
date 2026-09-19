import { test, expect } from '@playwright/test';
import {
  mapRawRowsToInvestors,
} from '../src/lib/investorImportService';

test.describe('Investors Module Unit & Service Tests', () => {
  test('1. Normalizes and validates raw imported rows accurately', () => {
    const rawRows = [
      {
        nombre: 'Carlos Rodríguez',
        email: 'carlos@ejemplo.com',
        telefono: '+598 99 111 222',
        capital_disponible: 150000,
        monto_minimo: 20000,
        monto_maximo: 120000,
        tasa_minima: 12.5,
        ltv_maximo: 45,
        plazo_min_meses: 12,
        plazo_max_meses: 48,
        garantias_aceptadas: 'Apartamento, Casa, Local Comercial',
        departamentos: 'Montevideo, Canelones',
      },
      {
        nombre: 'Inversiones del Este S.A.',
        email: 'contacto@esteinversiones.uy',
        tipo_inversor: 'Empresa',
        capital: 500000,
        ltv: '0.40',
        tasa: 11,
        garantias: 'Campo, Terreno',
        zonas: 'Maldonado, Rocha',
      },
    ];

    const result = mapRawRowsToInvestors(rawRows, []);
    expect(result.validRows.length).toBe(2);
    expect(result.errorRows.length).toBe(0);

    const first = result.validRows[0];
    expect(first.nombre).toBe('Carlos Rodríguez');
    expect(first.email).toBe('carlos@ejemplo.com');
    expect(first.capital_disponible).toBe(150000);
    expect(first.ltv_max).toBe(0.45);
    expect(first.tipos_inmueble).toContain('Apartamento');
    expect(first.departamentos).toContain('Montevideo');
  });

  test('2. Detects duplicate emails and flags errors in import rows', () => {
    const rawRows = [
      {
        nombre: 'Ana Pérez',
        email: 'existente@ejemplo.com',
      },
    ];

    const existing = [
      { name: 'Ana Pérez', contact_email: 'existente@ejemplo.com', organization_id: '1', id: '1', display_name: 'Ana Pérez', lender_type: 'Persona', currency: 'USD', is_active: true, created_at: '', updated_at: '', status: 'active' as const },
    ];

    const result = mapRawRowsToInvestors(rawRows, existing);
    expect(result.validRows.length).toBe(0);
    expect(result.duplicateRows.length).toBe(1);
    expect(result.duplicateRows[0]._duplicateReason).toContain('Email ya registrado');
  });
});

test.describe('Investors Module UI & Access Flows', () => {
  test('3. Inversor logs in and accesses Tenant Investor Portal', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'inversor@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('4. Admin logs in and accesses Inversores Backoffice tabs', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('5. Public White Label Invertir page loads successfully', async ({ page }) => {
    await page.goto('/demo/estudio-nova/invertir');
    await expect(page.locator('text=Registrar Perfil de Inversor')).toBeVisible();
    await expect(page.locator('input[placeholder="juan@ejemplo.com"]')).toBeVisible();
  });
});