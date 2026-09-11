// ==============================================================================
// HIPOTECALY TASADOR IA - EXPEDIENTE OPERACIONAL Y DE AUDITORÍA (PARTE 3)
// Vista de Expediente Completo (Secciones A - H), Histórico de Runs y Timeline
// ==============================================================================

import React, { useState } from 'react';
import {
  AppraisalRecord,
  AppraisalValuationRun,
  AppraisalAuditLog,
  AppraisalReportMetadata,
} from '../../lib/tasador/appraisal/appraisalTypes';
import {
  Layers,
  Clock,
  ShieldCheck,
  Download,
  ArrowLeft,
  RotateCcw,
  FileCheck,
} from 'lucide-react';

interface AppraisalDossierViewProps {
  appraisal: AppraisalRecord;
  runs: AppraisalValuationRun[];
  auditLogs: AppraisalAuditLog[];
  reports: AppraisalReportMetadata[];
  onBackToResult: () => void;
  onDownloadPdf: () => void;
  isDownloadingPdf?: boolean;
}

export const AppraisalDossierView: React.FC<AppraisalDossierViewProps> = ({
  appraisal,
  runs,
  auditLogs,
  reports,
  onBackToResult,
  onDownloadPdf,
  isDownloadingPdf = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'timeline' | 'audit'>('overview');

  const target = appraisal.propertyInput;
  const currentRun = appraisal.currentRun || runs[runs.length - 1];
  const allComps = appraisal.comparables || [];
  const includedComps = allComps.filter((c) => c.selected || c.status === 'INCLUDED');
  const excludedComps = allComps.filter((c) => !c.selected || c.status === 'EXCLUDED');

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header del Expediente */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase mb-1">
            <Layers className="w-4 h-4 text-blue-600" />
            Expediente Inmobiliario Auditable
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Expediente {appraisal.id}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organización: <strong className="text-slate-700">{appraisal.organizationId}</strong> | Creado: {new Date(appraisal.createdAt).toLocaleDateString('es-UY')} | Estado: <span className="font-bold text-blue-700">{appraisal.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToResult}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Resultado
          </button>

          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2 bg-[#102d49] hover:bg-[#0c243a] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloadingPdf ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Selector de Pestañas del Expediente */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-[#102d49] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Ficha General (Secciones A - F)
        </button>

        <button
          onClick={() => setActiveTab('runs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'runs'
              ? 'bg-[#102d49] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Histórico de Runs ({runs.length})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'bg-[#102d49] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Timeline Operacional
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-[#102d49] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Registro de Auditoría ({auditLogs.length})
        </button>
      </div>

      {/* CONTENIDO TAB 1: FICHA GENERAL (SECCIONES A - F) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Secciones A y B: Identificación e Inmueble */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sec A: Identificación */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-[#102d49] uppercase tracking-wider border-b pb-2">
                A. Identificación del Expediente
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">ID Tasación:</span>
                  <strong className="text-slate-700 font-mono">{appraisal.id}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Organización:</span>
                  <strong className="text-slate-700">{appraisal.organizationId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Creador:</span>
                  <strong className="text-slate-700">{appraisal.creatorEmail || 'Analista'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Estado Actual:</span>
                  <strong className="text-emerald-700">{appraisal.status}</strong>
                </div>
              </div>
            </div>

            {/* Sec B: Inmueble Objetivo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-[#102d49] uppercase tracking-wider border-b pb-2">
                B. Inmueble Objetivo
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Dirección:</span>
                  <strong className="text-slate-700">
                    {target.location.streetName} {target.location.streetNumber}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Ubicación:</span>
                  <strong className="text-slate-700">
                    {target.location.neighborhood}, {target.location.department}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Tipología:</span>
                  <strong className="text-slate-700 uppercase">{target.propertyType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Superficie:</span>
                  <strong className="text-slate-700">
                    {target.surfaces.builtAreaM2 || target.surfaces.totalAreaM2} m²
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Distribución:</span>
                  <strong className="text-slate-700">
                    {target.layout.bedrooms} D | {target.layout.bathrooms} B | {target.layout.garages} G
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Padrón Catastral:</span>
                  <strong className="text-slate-700 font-mono">
                    {target.location.cadastralNumber || 'S/D'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sec D: Comparables Participantes vs Excluidos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-[#102d49] uppercase tracking-wider border-b pb-2">
              D. Registro de Comparables ({includedComps.length} Incluidos / {excludedComps.length} Excluidos)
            </h4>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5">Fuente / ID</th>
                    <th className="p-2.5">Ubicación</th>
                    <th className="p-2.5">Superficie</th>
                    <th className="p-2.5">P. Original</th>
                    <th className="p-2.5">P. Ajustado (-12%)</th>
                    <th className="p-2.5">Score</th>
                    <th className="p-2.5">Causal / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allComps.map((comp) => {
                    const isInc = comp.selected || comp.status === 'INCLUDED';
                    const d = comp.candidateData;
                    return (
                      <tr key={comp.id} className={isInc ? 'hover:bg-slate-50' : 'bg-rose-50/30'}>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              isInc
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isInc ? 'INCLUIDO' : 'EXCLUIDO'}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-800">
                          {d.sourceName || d.sourceCode}
                        </td>
                        <td className="p-2.5 text-slate-600">{d.neighborhood}</td>
                        <td className="p-2.5 text-slate-600">{d.builtAreaM2} m²</td>
                        <td className="p-2.5 text-slate-500">USD {Math.round(d.priceUsd).toLocaleString('es-UY')}</td>
                        <td className="p-2.5 font-bold text-slate-800">USD {Math.round(d.adjustedPriceUsd).toLocaleString('es-UY')}</td>
                        <td className="p-2.5 font-bold text-blue-700">{comp.similarityScore} pts</td>
                        <td className="p-2.5 text-slate-600">
                          {isInc ? (
                            <span className="text-emerald-700">Muestra activa</span>
                          ) : (
                            <span className="text-rose-700">
                              {comp.exclusionReason}: {comp.analystNote || 'Excluido por analista'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sec E: Valoración Actual */}
          {currentRun && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-[#102d49] uppercase tracking-wider border-b pb-2">
                E. Valoración Activa (RUN #{currentRun.runNumber})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Valor Estimado</div>
                  <div className="text-xl font-black text-[#102d49] mt-0.5">
                    USD {currentRun.estimatedMarketValue.toLocaleString('es-UY')}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Rango P25 - P75</div>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">
                    USD {currentRun.valueRangeMin.toLocaleString('es-UY')} – {currentRun.valueRangeMax.toLocaleString('es-UY')}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Valor por M²</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    USD {currentRun.estimatedPricePerM2Usd.toLocaleString('es-UY')} / m²
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Nivel de Confianza</div>
                  <div className="text-sm font-bold text-blue-700 mt-0.5">
                    {currentRun.confidenceLevel}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sec F: Informes Técnicos PDF Emitidos */}
          {reports && reports.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-[#102d49] uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>F. Informes Técnicos PDF Emitidos ({reports.length})</span>
              </h4>
              <div className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <div key={rep.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{rep.fileName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Hash SHA-256: {rep.fileHashSha256} • {(rep.fileSizeBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">{new Date(rep.createdAt).toLocaleString('es-UY')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO TAB 2: HISTÓRICO DE RUNS */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Ejecuciones de Valoración Registradas ({runs.length})
            </h4>
            <p className="text-xs text-slate-500">
              Cada ejecución preserva un snapshot inmutable de los datos de entrada y comparables.
            </p>
          </div>

          <div className="space-y-4">
            {runs.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#102d49] text-white rounded-lg text-xs font-bold">
                      RUN #{r.runNumber}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(r.createdAt).toLocaleString('es-UY')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">({r.id})</span>
                  </div>

                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    Confianza: {r.confidenceLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Valor Central Estimado</span>
                    <strong className="text-base text-[#102d49]">
                      USD {r.estimatedMarketValue.toLocaleString('es-UY')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rango P25 - P75</span>
                    <strong className="text-slate-700">
                      USD {r.valueRangeMin.toLocaleString('es-UY')} – {r.valueRangeMax.toLocaleString('es-UY')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">USD/M²</span>
                    <strong className="text-slate-700">
                      USD {r.estimatedPricePerM2Usd.toLocaleString('es-UY')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Comparables Muestra</span>
                    <strong className="text-slate-700">
                      {r.comparablesUsedCount} incluidos / {r.excludedComparablesCount} descartados
                    </strong>
                  </div>
                </div>

                {r.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border">
                    <strong>Notas del analista:</strong> {r.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: TIMELINE OPERACIONAL */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            Línea de Tiempo del Expediente
          </h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {auditLogs.map((log) => (
              <div key={log.id} className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                  ✓
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#102d49]">{log.eventType}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString('es-UY')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{log.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 4: AUDIT LOG TÉCNICO */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            Registro de Auditoría Detallado ({auditLogs.length} Eventos)
          </h4>

          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Evento</th>
                  <th className="p-2.5">Usuario / Email</th>
                  <th className="p-2.5">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('es-UY')}
                    </td>
                    <td className="p-2.5 font-bold text-blue-700">{l.eventType}</td>
                    <td className="p-2.5 text-slate-600">{l.userEmail || l.userId || 'Sistema'}</td>
                    <td className="p-2.5 text-slate-700">{l.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
