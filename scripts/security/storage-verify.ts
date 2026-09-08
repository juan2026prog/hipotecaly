// ==============================================================================
// HIPOTECALY: Storage Integrity Verification Engine (Zero-Cost Native Script)
// Compara la integridad criptográfica SHA-256 de los archivos en disco y en el manifiesto
// ==============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StorageManifestEntry } from './storage-backup.js';

export interface VerificationResult {
  bucket: string;
  path: string;
  expectedSha256: string;
  computedSha256: string;
  verified: boolean;
  sizeBytes: number;
}

export interface VerificationReport {
  timestamp: string;
  totalVerified: number;
  validCount: number;
  corruptedCount: number;
  missingCount: number;
  results: VerificationResult[];
  status: 'ALL_VALID' | 'CORRUPTION_DETECTED' | 'MISSING_FILES';
}

export function verifyStorageBackupIntegrity(backupDir = './storage-backup'): VerificationReport {
  const absoluteBackupDir = path.resolve(process.cwd(), backupDir);
  const manifestPath = path.join(absoluteBackupDir, 'storage-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifiesto de backup no encontrado en: ${manifestPath}`);
  }

  const manifestData: StorageManifestEntry[] = JSON.parse(
    fs.readFileSync(manifestPath, 'utf8')
  );

  const results: VerificationResult[] = [];
  let validCount = 0;
  let corruptedCount = 0;
  let missingCount = 0;

  for (const entry of manifestData) {
    const filePath = path.join(absoluteBackupDir, entry.bucket, entry.path);

    if (!fs.existsSync(filePath)) {
      results.push({
        bucket: entry.bucket,
        path: entry.path,
        expectedSha256: entry.sha256,
        computedSha256: '',
        verified: false,
        sizeBytes: 0,
      });
      missingCount++;
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const isValid = computedHash === entry.sha256;

    results.push({
      bucket: entry.bucket,
      path: entry.path,
      expectedSha256: entry.sha256,
      computedSha256: computedHash,
      verified: isValid,
      sizeBytes: fileBuffer.length,
    });

    if (isValid) {
      validCount++;
    } else {
      corruptedCount++;
    }
  }

  let status: VerificationReport['status'] = 'ALL_VALID';
  if (corruptedCount > 0) status = 'CORRUPTION_DETECTED';
  else if (missingCount > 0) status = 'MISSING_FILES';

  return {
    timestamp: new Date().toISOString(),
    totalVerified: manifestData.length,
    validCount,
    corruptedCount,
    missingCount,
    results,
    status,
  };
}

// Ejecución CLI directa
if (process.argv[1] && process.argv[1].endsWith('storage-verify.ts')) {
  const report = verifyStorageBackupIntegrity();
  console.log('[STORAGE_VERIFICATION_REPORT]', JSON.stringify(report, null, 2));
}
