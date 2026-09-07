// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/documents/[...route]
// Generación y verificación de integridad documental server-side para HIPOTECALY DOCFLOW
// ==============================================================================

import { supabaseAdmin } from '../../server/supabase.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const url = req.url || '';
  const parts = url.split('?')[0].split('/').filter(Boolean);
  // /api/documents/:subpath...
  const route = parts.slice(2).join('/');

  if (route === 'verify-hash' && req.method === 'POST') {
    const { documentId, expectedHash } = req.body || {};
    if (!documentId || !expectedHash) {
      return res.status(400).json({ error: 'Faltan parámetros documentId o expectedHash' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('generated_documents')
        .select('id, file_hash, document_version, status, title')
        .eq('id', documentId)
        .maybeSingle();

      if (error || !data) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      const isMatch = data.file_hash === expectedHash;
      return res.status(200).json({
        verified: isMatch,
        documentId: data.id,
        storedHash: data.file_hash,
        expectedHash,
        version: data.document_version,
        status: data.status,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error al verificar hash', details: err?.message });
    }
  }

  if (route === 'health') {
    return res.status(200).json({
      service: 'HIPOTECALY DOCFLOW Engine',
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'ok',
    message: 'HIPOTECALY DOCFLOW Serverless Engine Active',
  });
}
