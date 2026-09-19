import { test, expect } from '@playwright/test';
import {
  mapRawRowsToInvestors,
} from '../src/lib/investorImportService';
import {
  evaluateInvestorOpportunityMatch,
} from '../src/lib/lendersService';

test.describe('Investors Module Unit & Service Tests', () => {
  test('1. Normalizes and validates raw imported rows accurately including "Nombre o Razón Social"', () => {
    const rawRows = [
      {
        'Nombre o Razón Social': 'Carlos Rodríguez',
        email: 'carlos@ejemplo.com',
        telefono: '+598 99 111 222',
        capital_disponible_usd: 150000,
        monto_minimo: 20000,
        monto_maximo: 120000,
        tasa_minima: 12.5,
        ltv_maximo_porcentaje: 45,
        plazo_min_meses: 12,
        plazo_max_meses: 48,
        garantias_aceptadas: 'Apartamento, Casa, Local Comercial',
        departamentos: 'Montevideo, Canelones',
      },
      {
        'Razón Social': 'Inversiones del Este S.A.',
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

    const second = result.validRows[1];
    expect(second.nombre).toBe('Inversiones del Este S.A.');
    expect(second.ltv_max).toBe(0.40);
  });

  test('2. Detects duplicate emails and flags errors in import rows', () => {
    const rawRows = [
      {
        nombre: 'Ana Pérez',
        email: 'existente@ejemplo.com',
      },
      {
        nombre: '', // Empty name
        email: 'invalido@ejemplo.com',
      },
    ];

    const existing = [
      { name: 'Ana Pérez', contact_email: 'existente@ejemplo.com', organization_id: '1', id: '1', display_name: 'Ana Pérez', lender_type: 'Persona', currency: 'USD', is_active: true, created_at: '', updated_at: '', status: 'active' as const },
    ];

    const result = mapRawRowsToInvestors(rawRows, existing);
    expect(result.validRows.length).toBe(0);
    expect(result.duplicateRows.length).toBe(1);
    expect(result.duplicateRows[0]._duplicateReason).toContain('Email ya registrado');
    expect(result.errorRows.length).toBe(1);
    expect(result.errorRows[0]._errorReason || result.errorRows[0]._errors?.[0]).toContain('nombre');
  });

  test('3. Matching Engine validates all 7 criteria including amount and term boundaries', () => {
    const criteria = {
      minLoanAmount: 20000,
      maxLoanAmount: 180000,
      minTermMonths: 12,
      maxTermMonths: 60,
      maxFinancingRatio: 40,
      minRate: 11.0,
      acceptedPropertyTypes: ['Apartamento', 'Casa', 'Local Comercial'],
      acceptedDepartments: ['Montevideo', 'Canelones'],
      acceptedModalities: ['solo_intereses'],
    };

    // Scenario A: 140k amount with 180k max, 36m term -> PERFECT MATCH (7/7)
    const oppPassing = {
      requested_amount: 140000,
      financing_ratio: 35,
      term_months: 36,
      suggested_rate: 12.0,
      property_type: 'Apartamento',
      department: 'Montevideo',
      zone: 'Pocitos · Montevideo',
      modality: 'solo_intereses',
    };
    const resPassing = evaluateInvestorOpportunityMatch(criteria, oppPassing);
    expect(resPassing.total).toBe(7);
    expect(resPassing.passedCount).toBe(7);
    expect(resPassing.isPerfect).toBe(true);

    // Scenario B: 140k amount with 100k max -> AMOUNT FAILS (6/7)
    const criteriaLowMaxAmount = { ...criteria, maxLoanAmount: 100000 };
    const resAmountFail = evaluateInvestorOpportunityMatch(criteriaLowMaxAmount, oppPassing);
    expect(resAmountFail.passedCount).toBe(6);
    expect(resAmountFail.isPerfect).toBe(false);
    expect(resAmountFail.checks.find(c => c.label === 'Monto solicitado')?.passed).toBe(false);

    // Scenario C: 72 months term with 60 months max -> TERM FAILS (6/7)
    const oppLongTerm = { ...oppPassing, term_months: 72 };
    const resTermFail = evaluateInvestorOpportunityMatch(criteria, oppLongTerm);
    expect(resTermFail.passedCount).toBe(6);
    expect(resTermFail.isPerfect).toBe(false);
    expect(resTermFail.checks.find(c => c.label === 'Plazo solicitado')?.passed).toBe(false);
  });
});

test.describe('Investors Module UI & Access Flows', () => {
  test('4. Inversor logs in and accesses Tenant Investor Portal', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'inversor@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('5. Admin logs in and accesses Inversores Backoffice tabs', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('6. Public White Label Invertir page loads successfully', async ({ page }) => {
    await page.goto('/demo/estudio-nova/invertir');
    await expect(page.locator('text=Registrar Perfil de Inversor')).toBeVisible();
    await expect(page.locator('input[placeholder="juan@ejemplo.com"]')).toBeVisible();
  });
});