// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/tasador
// Orquestador Serverless para Base Inmobiliaria, Discovery, Worker y Scheduler
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../server/supabase';
import { SourceHealthCheck } from '../src/lib/tasador/ingestion/SourceHealthCheck';
import { SourceDiscoveryService } from '../src/lib/tasador/ingestion/SourceDiscoveryService';
import { ListingIngestionWorker } from '../src/lib/tasador/ingestion/ListingIngestionWorker';
import { SourceSchedulerService } from '../src/lib/tasador/ingestion/SourceSchedulerService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const action = (req.query.action as string) || '';

  try {
    // 1. GET: Resumen General de Base Inmobiliaria
    if (req.method === 'GET' && action === 'summary') {
      const { data, error } = await supabaseAdmin.rpc('fn_superadmin_get_base_inmobiliaria_summary');
      if (error) throw error;
      return res.status(200).json({ success: true, summary: data });
    }

    // 2. GET: Listado de 20 Fuentes
    if (req.method === 'GET' && action === 'sources') {
      const { data, error } = await supabaseAdmin.rpc('fn_superadmin_get_property_sources');
      if (error) throw error;
      return res.status(200).json({ success: true, sources: data });
    }

    // 3. GET: Inspector de Base Inmobiliaria (Búsqueda y Filtrado)
    if (req.method === 'GET' && action === 'listings') {
      const search = (req.query.search as string) || null;
      const sourceCode = (req.query.source_code as string) || null;
      const status = (req.query.status as string) || null;
      const propertyType = (req.query.property_type as string) || null;
      const department = (req.query.department as string) || null;
      const minQuality = req.query.min_quality ? parseFloat(req.query.min_quality as string) : null;
      const comparableEligibility = (req.query.comparable_eligibility as string) || null;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const { data, error } = await supabaseAdmin.rpc('fn_superadmin_list_properties_inspector', {
        p_search: search,
        p_source_code: sourceCode,
        p_status: status,
        p_property_type: propertyType,
        p_department: department,
        p_min_quality: minQuality,
        p_comparable_eligibility: comparableEligibility,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) throw error;
      return res.status(200).json({ success: true, listings: data });
    }

    // 4. POST: Toggle de Switches / Kill Switch
    if (req.method === 'POST' && action === 'switch') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { sourceCode, field, value } = body || {};

      const { data, error } = await supabaseAdmin.rpc('fn_superadmin_toggle_source_switch', {
        p_source_code: sourceCode || 'GLOBAL',
        p_field: field,
        p_value: Boolean(value),
      });

      if (error) throw error;
      return res.status(200).json({ success: true, result: data });
    }

    // 5. POST: Ejecutar Auditoría de Salud (Health Check)
    if (req.method === 'POST' && action === 'health-check') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const sourceCode = body?.sourceCode;
      const healthChecker = SourceHealthCheck.getInstance();

      if (sourceCode && sourceCode !== 'ALL') {
        const report = await healthChecker.checkSource(sourceCode);
        return res.status(200).json({ success: true, report });
      } else {
        const reports = await healthChecker.checkAllSources();
        return res.status(200).json({ success: true, reports });
      }
    }

    // 6. POST: Ejecutar Discovery Controlado
    if (req.method === 'POST' && action === 'discovery') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { sourceCode, limit, department } = body || {};
      if (!sourceCode) {
        return res.status(400).json({ error: 'sourceCode requerido.' });
      }

      const discoveryService = SourceDiscoveryService.getInstance();
      const result = await discoveryService.runDiscovery(sourceCode, {
        limit: limit ? parseInt(limit, 10) : 50,
        department,
      });

      return res.status(200).json({ success: true, result });
    }

    // 7. POST: Procesar Lote de Jobs de Ingesta
    if (req.method === 'POST' && action === 'worker') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const batchSize = body?.batchSize ? parseInt(body.batchSize, 10) : 25;

      const worker = ListingIngestionWorker.getInstance();
      const result = await worker.processBatch(batchSize);

      return res.status(200).json({ success: true, result });
    }

    // 8. POST: Ejecutar Ciclo de Scheduler
    if (req.method === 'POST' && action === 'scheduler') {
      const scheduler = SourceSchedulerService.getInstance();
      const result = await scheduler.executeScheduledCycle();

      return res.status(200).json({ success: true, result });
    }

    return res.status(400).json({ error: `Acción no soportada: ${action}` });
  } catch (err: any) {
    console.error('[API /api/tasador] Error:', err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor.' });
  }
}
