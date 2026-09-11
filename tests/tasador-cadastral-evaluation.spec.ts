// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE AUDITORÍA CATASTRAL OFICIAL
// Verificación del Estado Oficial de Catastro Uruguayo (DNC / IDEuy)
// ==============================================================================

import { test, expect } from '@playwright/test';
import { CadastralAdapter } from '../src/lib/tasador/cadastral/CadastralAdapter';

test.describe('TASADOR IA - AUDITORÍA CATASTRAL URUGUAY', () => {
  const cadastralAdapter = CadastralAdapter.getInstance();

  test('Req 01: Estado oficial de conexión documentado como NOT_CONNECTED', () => {
    const report = cadastralAdapter.getAuditReport();
    expect(report.status).toBe('NOT_CONNECTED');
    expect(report.directApiAvailable).toBe(false);
  });

  test('Req 02: Resumen técnico y legal fundamentado de la DNC / IDEuy', () => {
    const report = cadastralAdapter.getAuditReport();
    expect(report.officialEntity).toContain('Dirección Nacional de Catastro');
    expect(report.legalAndTechnicalSummary).toContain('no provee una REST API pública abierta');
    expect(report.requiredAuthorizationForLiveSync).toContain('Convenio');
  });

  test('Req 03: Prohibición absoluta de datos sintéticos o simulados de Catastro', async () => {
    const report = cadastralAdapter.getAuditReport();
    expect(report.simulatedDataAllowed).toBe(false);

    // Consulta directa debe retornar null y no datos falsos
    const result = await cadastralAdapter.fetchCadastralData('12345', 'Montevideo');
    expect(result).toBeNull();
  });

  test('Req 04: Estructura de datos catastrales preparada para cuando exista autorización', () => {
    const report = cadastralAdapter.getAuditReport();
    expect(report.dataPointsReadyForIngestion.length).toBeGreaterThanOrEqual(4);
    expect(report.dataPointsReadyForIngestion).toContain('Padrón Matriz / Padrón Urbano / Padrón Rural');
  });
});
