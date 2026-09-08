// ==============================================================================
// HIPOTECALY: Storage Backup Engine (Zero-Cost Native Script)
// Realiza backup físico de Supabase Storage con generación de manifiesto SHA-256
// ==============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabaseAdmin } from '../../server/supabase.js';

export interface StorageManifestEntry {
  bucket: string;
  path: string;
  size: number;
  contentType: string;
  sha256: string;
  backedUpAt: string;
}

export interface StorageBackupReport {
  timestamp: string;
  totalBuckets: number;
  totalFiles: number;
  totalBytes: number;
  entries: StorageManifestEntry[];
  manifestSha256: string;
}

export async function runStorageBackup(
  backupDir = './storage-backup',
  bucketsToBackup = [
    'property-photos',
    'application-documents',
    'notary-documents',
    'signed-contracts',
    'kyc-documents',
  ]
): Promise<StorageBackupReport> {
  const absoluteBackupDir = path.resolve(process.cwd(), backupDir);
  if (!fs.existsSync(absoluteBackupDir)) {
    fs.mkdirSync(absoluteBackupDir, { recursive: true });
  }

  const entries: StorageManifestEntry[] = [];
  let totalFiles = 0;
  let totalBytes = 0;

  for (const bucket of bucketsToBackup) {
    const bucketDir = path.join(absoluteBackupDir, bucket);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    try {
      // Listar objetos del bucket
      const { data: files, error } = await supabaseAdmin.storage.from(bucket).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error || !files) {
        continue;
      }

      for (const file of files) {
        if (!file.name || file.id === null) continue; // Directorio o placeholder

        // Descargar archivo
        const { data: blob, error: downloadErr } = await supabaseAdmin.storage
          .from(bucket)
          .download(file.name);

        if (downloadErr || !blob) {
          continue;
        }

        const buffer = Buffer.from(await blob.arrayBuffer());
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const filePath = path.join(bucketDir, file.name);

        const parentDir = path.dirname(filePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(filePath, buffer);

        const entry: StorageManifestEntry = {
          bucket,
          path: file.name,
          size: buffer.length,
          contentType: blob.type || 'application/octet-stream',
          sha256: hash,
          backedUpAt: new Date().toISOString(),
        };

        entries.push(entry);
        totalFiles++;
        totalBytes += buffer.length;
      }
    } catch {
      // Continuar con siguientes buckets
    }
  }

  const manifestContent = JSON.stringify(entries, null, 2);
  const manifestPath = path.join(absoluteBackupDir, 'storage-manifest.json');
  fs.writeFileSync(manifestPath, manifestContent);

  const manifestSha256 = crypto.createHash('sha256').update(manifestContent).digest('hex');

  const report: StorageBackupReport = {
    timestamp: new Date().toISOString(),
    totalBuckets: bucketsToBackup.length,
    totalFiles,
    totalBytes,
    entries,
    manifestSha256,
  };

  return report;
}

// Ejecución CLI directa
if (process.argv[1] && process.argv[1].endsWith('storage-backup.ts')) {
  runStorageBackup().then((report) => {
    console.log('[STORAGE_BACKUP_SUCCESS]', JSON.stringify(report, null, 2));
  }).catch((err) => {
    console.error('[STORAGE_BACKUP_ERROR]', err);
  });
}
