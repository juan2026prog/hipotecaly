// ==============================================================================
// HIPOTECALY: Storage Restore Engine (Zero-Cost Native Script)
// Restaura objetos desde el backup físico validando coincidencia criptográfica SHA-256
// ==============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabaseAdmin } from '../../server/supabase.js';
import { StorageManifestEntry } from './storage-backup.js';

export interface StorageRestoreResult {
  bucket: string;
  path: string;
  originalSha256: string;
  restoredSha256: string;
  integrityVerified: boolean;
  status: 'RESTORED' | 'FAILED' | 'MISMATCH';
  error?: string;
}

export interface StorageRestoreReport {
  timestamp: string;
  totalEntries: number;
  successCount: number;
  failureCount: number;
  mismatchCount: number;
  results: StorageRestoreResult[];
  allIntegrityVerified: boolean;
}

export async function runStorageRestore(
  backupDir = './storage-backup'
): Promise<StorageRestoreReport> {
  const absoluteBackupDir = path.resolve(process.cwd(), backupDir);
  const manifestPath = path.join(absoluteBackupDir, 'storage-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifiesto de backup no encontrado en ${manifestPath}`);
  }

  const manifestData: StorageManifestEntry[] = JSON.parse(
    fs.readFileSync(manifestPath, 'utf8')
  );

  const results: StorageRestoreResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let mismatchCount = 0;

  for (const entry of manifestData) {
    const localFilePath = path.join(absoluteBackupDir, entry.bucket, entry.path);

    if (!fs.existsSync(localFilePath)) {
      results.push({
        bucket: entry.bucket,
        path: entry.path,
        originalSha256: entry.sha256,
        restoredSha256: '',
        integrityVerified: false,
        status: 'FAILED',
        error: 'Archivo local no encontrado en el directorio de backup',
      });
      failureCount++;
      continue;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const localHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (localHash !== entry.sha256) {
      results.push({
        bucket: entry.bucket,
        path: entry.path,
        originalSha256: entry.sha256,
        restoredSha256: localHash,
        integrityVerified: false,
        status: 'MISMATCH',
        error: 'El hash SHA-256 local no coincide con el manifiesto',
      });
      mismatchCount++;
      continue;
    }

    try {
      // Subir archivo al bucket de destino
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(entry.bucket)
        .upload(entry.path, fileBuffer, {
          contentType: entry.contentType,
          upsert: true,
        });

      if (uploadErr) {
        results.push({
          bucket: entry.bucket,
          path: entry.path,
          originalSha256: entry.sha256,
          restoredSha256: '',
          integrityVerified: false,
          status: 'FAILED',
          error: uploadErr.message,
        });
        failureCount++;
        continue;
      }

      // Descargar inmediatamente para verificar coincidencia criptográfica
      const { data: downloadedBlob, error: downloadErr } = await supabaseAdmin.storage
        .from(entry.bucket)
        .download(entry.path);

      if (downloadErr || !downloadBlob) {
        results.push({
          bucket: entry.bucket,
          path: entry.path,
          originalSha256: entry.sha256,
          restoredSha256: '',
          integrityVerified: false,
          status: 'FAILED',
          error: 'Fallo al verificar descarga post-restore',
        });
        failureCount++;
        continue;
      }

      const downloadedBuffer = Buffer.from(await downloadedBlob.arrayBuffer());
      const restoredHash = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');

      const isMatch = restoredHash === entry.sha256;

      if (isMatch) {
        results.push({
          bucket: entry.bucket,
          path: entry.path,
          originalSha256: entry.sha256,
          restoredSha256: restoredHash,
          integrityVerified: true,
          status: 'RESTORED',
        });
        successCount++;
      } else {
        results.push({
          bucket: entry.bucket,
          path: entry.path,
          originalSha256: entry.sha256,
          restoredSha256: restoredHash,
          integrityVerified: false,
          status: 'MISMATCH',
          error: 'El archivo restaurado en Supabase no coincide con el hash original',
        });
        mismatchCount++;
      }
    } catch (err: any) {
      results.push({
        bucket: entry.bucket,
        path: entry.path,
        originalSha256: entry.sha256,
        restoredSha256: '',
        integrityVerified: false,
        status: 'FAILED',
        error: err?.message,
      });
      failureCount++;
    }
  }

  const allIntegrityVerified = failureCount === 0 && mismatchCount === 0;

  const report: StorageRestoreReport = {
    timestamp: new Date().toISOString(),
    totalEntries: manifestData.length,
    successCount,
    failureCount,
    mismatchCount,
    results,
    allIntegrityVerified,
  };

  return report;
}

// Ejecución CLI directa
if (process.argv[1] && process.argv[1].endsWith('storage-restore.ts')) {
  runStorageRestore().then((report) => {
    console.log('[STORAGE_RESTORE_REPORT]', JSON.stringify(report, null, 2));
  }).catch((err) => {
    console.error('[STORAGE_RESTORE_ERROR]', err);
  });
}
