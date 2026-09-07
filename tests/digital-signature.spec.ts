import { test, expect } from '@playwright/test';
import { computeSha256, computeBase64Sha256, verifyHashesMatch } from '../src/lib/siteos/signature/hashUtil';
import { MockSignatureProvider } from '../src/lib/siteos/signature/providers/MockSignatureProvider';
import { FirmaGubSignatureProvider } from '../src/lib/siteos/signature/providers/FirmaGubSignatureProvider';
import {
  canTransitionSignature,
  normalizeFirmaGubStatus,
  computeOverallProcessStatus,
} from '../src/lib/siteos/signature/stateMachine';

test.describe('SiteOS Digital Signature Core Unit / Integration Tests', () => {
  test('hashUtil: calcula y verifica hashes SHA-256 correctamente', async () => {
    const text = 'HIPOTECALY_LEGAL_CONTRACT_CONTENT_2026';
    const hash = await computeSha256(text);

    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // 256 bits en hex

    const hashAgain = await computeSha256(text);
    expect(verifyHashesMatch(hash, hashAgain)).toBe(true);

    const differentHash = await computeSha256('ALTERED_CONTENT');
    expect(verifyHashesMatch(hash, differentHash)).toBe(false);
  });

  test('MockSignatureProvider: crea proceso y ejecuta firma con marcas de agua y hashes', async () => {
    const provider = new MockSignatureProvider();
    const process = await provider.createProcess({
      tenantId: 'tenant-demo',
      caseId: 'case-demo',
      documents: [
        {
          title: 'Contrato Hipotecario Mutuo',
          sha256Original: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      ],
      signers: [
        { name: 'Solicitante Demo', email: 'solicitante@demo.uy', role: 'applicant' },
      ],
    });

    expect(process.processId).toBeDefined();
    expect(process.status).toBe('pending');

    // Ejecutar firma simulada
    const signResult = await provider.executeMockSign(process.processId, 0, 'Firma con TuID Antel');
    expect(signResult.allCompleted).toBe(true);
    expect(signResult.process.status).toBe('signed');

    const signedDocs = await provider.getSignedDocuments(process.processId);
    expect(signedDocs.length).toBeGreaterThan(0);
    expect(signedDocs[0].sha256Signed).toBeDefined();
    expect(signedDocs[0].sha256Signed?.length).toBe(64);
  });

  test('Firma.gub.uy Provider: configuración dinámica y fallback a MOCK si endpoint no está configurado', async () => {
    const unconfiguredProvider = new FirmaGubSignatureProvider({ baseUrl: '' });
    expect(unconfiguredProvider.isConfigured()).toBe(false);

    const process = await unconfiguredProvider.createProcess({
      tenantId: 'tenant-01',
      caseId: 'case-01',
      documents: [{ title: 'Doc 1', sha256Original: 'hash1' }],
      signers: [{ name: 'Juan', email: 'juan@test.uy', role: 'applicant' }],
    });

    expect(process.provider).toBe('firma_gub');
    expect(process.mode).toBe('mock');
    expect(process.metadata?.providerStatus).toBe('WAITING_PROVIDER_CONFIGURATION');
  });

  test('Signature State Machine & Firma.gub Status Normalizer', () => {
    expect(normalizeFirmaGubStatus('FINALIZADO')).toBe('signed');
    expect(normalizeFirmaGubStatus('FIRMADO')).toBe('signed');
    expect(normalizeFirmaGubStatus('RECHAZADO')).toBe('rejected');
    expect(normalizeFirmaGubStatus('INICIADO')).toBe('pending');
    expect(normalizeFirmaGubStatus('EN_PROCESO')).toBe('in_progress');

    expect(canTransitionSignature('draft', 'prepared')).toBe(true);
    expect(canTransitionSignature('prepared', 'pending')).toBe(true);
    expect(canTransitionSignature('pending', 'signed')).toBe(true);
    expect(canTransitionSignature('signed', 'pending')).toBe(false); // Signed es terminal

    // Status aggregation
    const signersPending = [{ status: 'pending' as const }, { status: 'pending' as const }];
    expect(computeOverallProcessStatus(signersPending, 'pending')).toBe('pending');

    const signersPartial = [{ status: 'signed' as const }, { status: 'pending' as const }];
    expect(computeOverallProcessStatus(signersPartial, 'pending')).toBe('partially_signed');

    const signersAllSigned = [{ status: 'signed' as const }, { status: 'signed' as const }];
    expect(computeOverallProcessStatus(signersAllSigned, 'pending')).toBe('signed');
  });
});
