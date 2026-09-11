// ==============================================================================
// HIPOTECALY TASADOR IA - TABLA COMPARATIVA MATRICIAL DE COMPARABLES
// Comparación columna a columna: Inmueble Objetivo vs Candidatos
// ==============================================================================

import React from 'react';
import {
  AppraisalPropertyInput,
  AppraisalComparableItem,
} from '../../lib/tasador/appraisal/appraisalTypes';
import { XCircle, RotateCcw } from 'lucide-react';

interface ComparablesTableProps {
  target: AppraisalPropertyInput;
  comparables: AppraisalComparableItem[];
  onToggleInclude: (id: string) => void;
  onExcludeWithReason: (comp: AppraisalComparableItem) => void;
}

export const ComparablesTable: React.FC<ComparablesTableProps> = ({
  target,
  comparables,
  onToggleInclude,
  onExcludeWithReason,
}) => {
  const targetArea = target.surfaces.totalAreaM2 || target.surfaces.builtAreaM2 || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#102d49] uppercase tracking-wider">
          Matriz de Comparación Directa
        </h3>
        <span className="text-xs text-slate-400">
          {comparables.filter((c) => c.selected).length} de {comparables.length} comparables incluidos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-3 font-bold text-left w-44 sticky left-0 bg-slate-50 z-10">
                Atributo / Variable
              </th>
              {/* Columna Inmueble Objetivo */}
              <th className="p-3 font-extrabold text-left min-w-[200px] bg-[#102d49] text-white">
                <span className="text-[10px] text-[#f4b43b] uppercase block">Referencia</span>
                INMUEBLE A TASAR
              </th>
              {/* Columnas de Comparables */}
              {comparables.map((comp, idx) => (
                <th
                  key={comp.id}
                  className={`p-3 font-bold text-left min-w-[180px] border-l border-slate-200 ${
                    comp.selected ? 'bg-slate-50 text-slate-800' : 'bg-slate-100/70 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Comp #{idx + 1}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        comp.similarityScore >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {comp.similarityScore} pts
                    </span>
                  </div>
                  <span className="font-normal text-[10px] truncate block text-slate-500 mt-0.5" title={comp.candidateData.title}>
                    {comp.candidateData.title}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {/* Fila: Ubicación */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Ubicación</td>
              <td className="p-3 bg-[#102d49]/5 font-semibold text-[#102d49]">
                {target.location.neighborhood || target.location.city}, {target.location.department}
              </td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100">
                  {comp.candidateData.neighborhood}, {comp.candidateData.department}
                </td>
              ))}
            </tr>

            {/* Fila: Distancia al Objetivo */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Distancia</td>
              <td className="p-3 bg-[#102d49]/5 text-slate-400 italic">0 m (Objetivo)</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100 font-semibold">
                  {comp.candidateData.distanceMeters !== null && comp.candidateData.distanceMeters !== undefined
                    ? comp.candidateData.distanceMeters >= 1000
                      ? `${(comp.candidateData.distanceMeters / 1000).toFixed(1)} km`
                      : `${comp.candidateData.distanceMeters} m`
                    : '—'}
                </td>
              ))}
            </tr>

            {/* Fila: Tipo */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Tipo Inmueble</td>
              <td className="p-3 bg-[#102d49]/5 font-semibold text-[#102d49] capitalize">{target.propertyType}</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100 capitalize">
                  {comp.candidateData.propertyType}
                </td>
              ))}
            </tr>

            {/* Fila: Superficie */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Superficie Total</td>
              <td className="p-3 bg-[#102d49]/5 font-bold text-[#102d49]">{targetArea} m²</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100 font-semibold">
                  {comp.candidateData.builtAreaM2 || comp.candidateData.totalAreaM2} m²
                </td>
              ))}
            </tr>

            {/* Fila: Dormitorios */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Dormitorios</td>
              <td className="p-3 bg-[#102d49]/5 font-bold text-[#102d49]">{target.layout.bedrooms}</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100">
                  {comp.candidateData.bedrooms}
                </td>
              ))}
            </tr>

            {/* Fila: Baños */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Baños</td>
              <td className="p-3 bg-[#102d49]/5 font-bold text-[#102d49]">{target.layout.bathrooms}</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100">
                  {comp.candidateData.bathrooms}
                </td>
              ))}
            </tr>

            {/* Fila: Garajes */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Garajes</td>
              <td className="p-3 bg-[#102d49]/5 font-bold text-[#102d49]">{target.layout.garages || 0}</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100">
                  {comp.candidateData.garages || 0}
                </td>
              ))}
            </tr>

            {/* Fila: Antigüedad */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Año / Estado</td>
              <td className="p-3 bg-[#102d49]/5 font-semibold text-[#102d49] capitalize">
                {target.constructionYear || '—'} ({target.condition})
              </td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100">
                  {comp.candidateData.constructionYear || '—'}
                </td>
              ))}
            </tr>

            {/* Fila: Precio Ajustado (-12%) */}
            <tr className="hover:bg-slate-50/50 bg-slate-50/30">
              <td className="p-3 font-bold text-slate-800 sticky left-0 bg-white z-10">
                Precio Ajustado (-12%)
              </td>
              <td className="p-3 bg-[#102d49]/5 text-slate-400 italic">A determinar</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100 font-extrabold text-[#102d49]">
                  USD {comp.candidateData.adjustedPriceUsd.toLocaleString('es-UY')}
                </td>
              ))}
            </tr>

            {/* Fila: USD/m² */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-800 sticky left-0 bg-white z-10">USD / m²</td>
              <td className="p-3 bg-[#102d49]/5 text-slate-400 italic">—</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100 font-bold text-emerald-600">
                  USD {comp.candidateData.pricePerM2Usd.toLocaleString('es-UY')}
                </td>
              ))}
            </tr>

            {/* Fila: Calidad de Datos */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10">Calidad Datos</td>
              <td className="p-3 bg-[#102d49]/5 text-emerald-700 font-bold">100% (Manual)</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-100">
                  {comp.candidateData.dataQualityScore}%
                </td>
              ))}
            </tr>

            {/* Fila: Acción Human-in-the-Loop */}
            <tr className="bg-slate-50/60">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-slate-50 z-10">Decisión</td>
              <td className="p-3 bg-[#102d49] text-[#f4b43b] font-bold text-center">OBJETIVO</td>
              {comparables.map((comp) => (
                <td key={comp.id} className="p-3 border-l border-slate-200">
                  {comp.selected ? (
                    <button
                      type="button"
                      onClick={() => onExcludeWithReason(comp)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-[11px] flex items-center space-x-1"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleInclude(comp.id)}
                      className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-[11px] flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-incluir</span>
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
