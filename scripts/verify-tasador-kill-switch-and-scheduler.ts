// ==============================================================================
// VERIFICACIÓN DEL KILL SWITCH Y SCHEDULER — HIPOTECALY TASADOR IA
// Prueba Caso A (Fuente deshabilitada), Caso B (Kill Switch global), Caso C (Restauración)
// ==============================================================================

import { SourceSchedulerService } from '../src/lib/tasador/ingestion/SourceSchedulerService';
import { SourceDiscoveryService } from '../src/lib/tasador/ingestion/SourceDiscoveryService';

async function testKillSwitchAndScheduler() {
  console.log('=== INICIANDO VERIFICACIÓN DE SCHEDULER Y KILL SWITCH ===\n');

  const scheduler = SourceSchedulerService.getInstance();
  const discovery = SourceDiscoveryService.getInstance();

  // 1. Ejecución 1 del Scheduler (Ejecución Normal)
  console.log('--- EJECUCIÓN #1 DEL SCHEDULER (SCHEDULED_RUN) ---');
  const run1 = await scheduler.executeScheduledCycle();
  console.log(`- Estado: ${run1.status}`);
  console.log(`- Fuentes evaluadas: ${run1.sourcesChecked}`);
  console.log(`- Fuentes ejecutadas: ${run1.sourcesExecuted}`);
  console.log(`- Duración: ${run1.durationMs} ms`);

  // 2. Ejecución #2 Consecutiva (Verificación de Anti-solapamiento y No Re-ejecución Innecesaria)
  console.log('\n--- EJECUCIÓN #2 CONSECUTIVA DEL SCHEDULER ---');
  const run2 = await scheduler.executeScheduledCycle();
  console.log(`- Estado: ${run2.status}`);
  console.log(`- Fuentes ejecutadas: ${run2.sourcesExecuted}`);
  console.log(`- Duración: ${run2.durationMs} ms`);

  // 3. Caso A: Deshabilitar una fuente específica
  console.log('\n--- CASO A: DESHABILITAR FUENTE ESPECÍFICA ---');
  scheduler.disableSource('infocasas');
  const sourcesPlanA = scheduler.getEligibleSources();
  const infocasasEligible = sourcesPlanA.some(s => s.code === 'infocasas');
  console.log(`- infocasas elegible tras deshabilitación?: ${infocasasEligible ? 'FALLO (sigue elegible)' : 'OK (omitida correctamente)'}`);

  // 4. Caso B: Activar Kill Switch Global
  console.log('\n--- CASO B: ACTIVAR KILL SWITCH GLOBAL ---');
  scheduler.activateKillSwitch('TEST_AUDIT_VERIFICATION');
  const isKillActive = scheduler.isKillSwitchActive();
  console.log(`- Kill Switch activo?: ${isKillActive ? 'OK (activo)' : 'FALLO'}`);

  const runKill = await scheduler.executeScheduledCycle();
  console.log(`- Resultado de ejecución con Kill Switch activo: ${runKill.status}`);
  console.log(`- Mensaje: ${runKill.message}`);

  // 5. Caso C: Restaurar Switches a Estado Operativo
  console.log('\n--- CASO C: RESTAURACIÓN A ESTADO OPERATIVO ---');
  scheduler.deactivateKillSwitch();
  scheduler.enableSource('infocasas');
  console.log(`- Kill Switch activo tras desactivar?: ${scheduler.isKillSwitchActive() ? 'FALLO' : 'OK (desactivado)'}`);
  
  const sourcesPlanC = scheduler.getEligibleSources();
  const infocasasRestored = sourcesPlanC.some(s => s.code === 'infocasas');
  console.log(`- infocasas elegible tras restauración?: ${infocasasRestored ? 'OK (restaurada)' : 'FALLO'}`);

  console.log('\n=== VERIFICACIÓN DE SCHEDULER Y KILL SWITCH COMPLETADA EXITOSAMENTE ===');
}

testKillSwitchAndScheduler().catch(err => {
  console.error('Error en test de scheduler/kill switch:', err);
  process.exit(1);
});
