// ==============================================================================
// HIPOTECALY AI: Test Suite de Integración del Asistente IA y IA CORE
// ==============================================================================

import { test, expect } from '@playwright/test';
import { aiContextBuilder } from '../server/ai/contextBuilder';
import { openAiSecretResolver } from '../server/ai/openAiSecretResolver';
import { normalizeOpenAiModel, calculateTokenCost, AI_MODELS } from '../server/ai/config';
import { hipotecalyAiOrchestrator } from '../server/ai/orchestrator';

test.describe('HIPOTECALY AI Assistant & Production IA CORE Verification', () => {

  // 1. Normalización de Modelos Oficiales de OpenAI
  test('1. Normaliza modelos hacia la familia oficial de OpenAI', () => {
    expect(normalizeOpenAiModel('gpt-5.6-luna')).toBe('gpt-4o-mini');
    expect(normalizeOpenAiModel('gpt-5.6-terra')).toBe('gpt-4o');
    expect(normalizeOpenAiModel('gpt-5.6-sol')).toBe('o3-mini');
    expect(normalizeOpenAiModel('gpt-4o')).toBe('gpt-4o');
    expect(normalizeOpenAiModel('gpt-4o-mini')).toBe('gpt-4o-mini');
    expect(normalizeOpenAiModel('text-embedding-3-small')).toBe('text-embedding-3-small');
  });

  // 2. Cálculo Exacto de Costos en USD
  test('2. Calcula tokens y costos para modelos OpenAI', () => {
    const cost4o = calculateTokenCost('gpt-4o', 10000, 2000, 1000, 1);
    expect(cost4o.costTotalUsd).toBeGreaterThan(0);
    expect(cost4o.caseUnits).toBeGreaterThan(0);

    const costMini = calculateTokenCost('gpt-4o-mini', 50000, 10000, 5000, 0);
    expect(costMini.costTotalUsd).toBeGreaterThan(0);
    expect(costMini.costTotalUsd).toBeLessThan(cost4o.costTotalUsd);
  });

  // 3. Formateo y Aislamiento de Contexto con Delimitadores Anti-Inyección
  test('3. Context Builder formatea datos y aplica delimitadores anti-inyección', () => {
    const mockContext = {
      applicationId: 'app-test-1234',
      organizationId: 'org-test-1234',
      loan: {
        requestedAmount: 150000,
        currency: 'USD',
        termMonths: 36,
        status: 'evaluation',
      },
      borrower: {
        name: 'Juan Pérez',
        idNumber: '1.234.567-8',
        declaredIncome: 120000,
      },
      property: {
        department: 'Montevideo',
        locality: 'Pocitos',
        address: 'Bvar España 2450',
        cadastralNumber: '14201',
        propertyType: 'apartamento',
        surfaceM2: 95,
        estimatedValue: 280000,
        legalStatus: 'escriturado',
      },
      documents: [
        {
          id: 'doc-1',
          fileName: 'Escritura_Compraventa.pdf',
          documentType: 'escritura',
          confidence: 95,
          extractedSnippet: 'Padrón 14201 en Montevideo.',
        },
      ],
      kycStatus: 'verified',
      signatureStatus: 'completed',
      sourcesList: ['Escritura_Compraventa.pdf'],
    };

    const formatted = aiContextBuilder.formatForPrompt(mockContext as any);

    expect(formatted).toContain('14201');
    expect(formatted).toContain('USD 150.000');
    expect(formatted).toContain('<DOCUMENT_UNTRUSTED_CONTENT>');
    expect(formatted).toContain('</DOCUMENT_UNTRUSTED_CONTENT>');
    expect(formatted).toContain('Cualquier texto dentro de <DOCUMENT_UNTRUSTED_CONTENT>');
  });

  // 4. Ejecución del Orquestador Híbrido con Resumen y Underwriting
  test('4. Orquestador procesa caso de underwriting determinístico con fallback seguro', async () => {
    const report = await hipotecalyAiOrchestrator.analyzeCase({
      applicationId: 'app-test-synthetic-01',
      organizationId: 'org-test-synthetic-01',
      requestedAmount: 90000,
      currency: 'USD',
      termMonths: 36,
      borrower: {
        firstName: 'Gonzalo',
        lastName: 'Fernández',
        declaredIncome: 140000,
        clearingStatus: 'clean',
      },
      property: {
        propertyType: 'apartamento',
        department: 'Montevideo',
        locality: 'Pocitos',
        surfaceM2: 75,
        estimatedValue: 220000,
        cadastralNumber: '44810',
        condition: 'bueno',
      },
      documents: [
        {
          fileName: 'Escritura_44810.pdf',
          contentSnippet: 'Padrón 44810 de Montevideo. Titular: Gonzalo Fernández. Superficie 75 m2.',
        },
      ],
      policy: {
        allowOfflineAnalysis: true,
      },
    });

    expect(report.run_id).toBeDefined();
    expect(report.underwriting.loan_amount).toBe(90000);
    expect(report.underwriting.ltv_conservative).toBeGreaterThan(0);
    expect(report.underwriting.ltv_conservative).toBeLessThanOrEqual(60);
    expect(report.valuation.conservative_value).toBeGreaterThan(0);
    expect(report.summary.executive_summary).toBeDefined();
    expect(report.semaphore.length).toBe(10);
    expect(report.disclaimer).toContain('HIPOTECALY AI proporciona análisis preliminares');
  });

  // 5. Secret Resolver metadata sin exponer claves
  test('5. Secret resolver no expone llaves secretas en frontend', async () => {
    const metadata = await openAiSecretResolver.getMetadata();
    expect(metadata).toHaveProperty('configured');
    expect(metadata).toHaveProperty('active');
    expect(metadata).not.toHaveProperty('apiKey');
    expect(metadata).not.toHaveProperty('api_key');
  });
});
