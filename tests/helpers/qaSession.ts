// ==============================================================================
// PLAYWRIGHT TEST HELPER: qaSession.ts
// Utilidad para inicializar y probar sesiones QA de forma segura y reproducible
// ==============================================================================

import { Page } from '@playwright/test';

export interface OpenQaSessionOptions {
  role: 'borrower' | 'applicant' | 'analyst' | 'operator' | 'tenant_admin' | 'lender' | 'super_admin';
  tenantId?: string;
  tenantName?: string;
  durationHours?: number;
}

const QA_STORAGE_KEY = 'hipotecaly_qa_session_ref';

/**
 * Inyecta una sesión QA válida en el contexto del navegador para testing E2E
 */
export async function openQaSession(page: Page, options: OpenQaSessionOptions) {
  const role = options.role === 'applicant' ? 'borrower' : options.role === 'operator' ? 'analyst' : options.role;
  const tenantId = options.tenantId || 'a0000000-0000-0000-0000-000000000001';
  const tenantName = options.tenantName || 'HIPOTECALY Central';
  const durationHours = options.durationHours || 8;
  const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

  const qaSessionData = {
    sessionId: `qa-test-${role}-${Date.now()}`,
    role,
    tenantId,
    tenantName,
    expiresAt,
    keepOnDevice: true,
  };

  await page.addInitScript(({ storageKey, data, roleVal }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
    window.localStorage.setItem('hipotecaly_test_role', roleVal);
  }, { storageKey: QA_STORAGE_KEY, data: qaSessionData, roleVal: role });
}

/**
 * Limpia la sesión QA del navegador
 */
export async function clearQaSession(page: Page) {
  await page.addInitScript(({ storageKey }) => {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem('hipotecaly_test_role');
  }, { storageKey: QA_STORAGE_KEY });
}
