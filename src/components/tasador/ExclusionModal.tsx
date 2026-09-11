// ==============================================================================
// HIPOTECALY TASADOR IA - MODAL DE EXCLUSIÓN DE COMPARABLES (HUMAN-IN-THE-LOOP)
// Motivos estructurados y notas de auditoría para exclusión justificada
// ==============================================================================

import React, { useState } from 'react';
import { AppraisalComparableItem } from '../../lib/tasador/appraisal/appraisalTypes';
import { AlertTriangle, X } from 'lucide-react';

interface ExclusionModalProps {
  isOpen: boolean;
  comparable: AppraisalComparableItem | null;
  onConfirm: (reason: string, note?: string) => void;
  onCancel: () => void;
}

const EXCLUSION_REASONS = [
  { id: 'inmueble_diferente', label: 'Inmueble diferente (Tipología o categoría no homologable)' },
  { id: 'ubicacion_no_comparable', label: 'Ubicación no comparable (Microzona o entorno dispar)' },
  { id: 'superficie_no_comparable', label: 'Superficie no comparable (Metraje fuera de escala)' },
  { id: 'estado_diferente', label: 'Estado o antigüedad marcadamente dispar' },
  { id: 'publicacion_dudosa', label: 'Publicación dudosa, desactualizada o precio fuera de mercado' },
  { id: 'dato_incorrecto', label: 'Dato técnico incorrecto en el portal de origen' },
  { id: 'otro', label: 'Otro motivo profesional' },
];

export const ExclusionModal: React.FC<ExclusionModalProps> = ({
  isOpen,
  comparable,
  onConfirm,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(EXCLUSION_REASONS[0].label);
  const [analystNote, setAnalystNote] = useState<string>('');

  if (!isOpen || !comparable) return null;

  const handleConfirm = () => {
    onConfirm(selectedReason, analystNote.trim() || undefined);
    setAnalystNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102d49]">Excluir Comparable del Análisis</h3>
              <p className="text-[11px] text-slate-500">Justificación técnica para registro de auditoría</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 text-xs">
          {/* Ficha del comparable */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Comparable seleccionado</span>
            <p className="font-bold text-[#102d49] text-xs mt-0.5">{comparable.candidateData.title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {comparable.candidateData.neighborhood} • {comparable.candidateData.builtAreaM2} m² • USD {comparable.candidateData.adjustedPriceUsd.toLocaleString('es-UY')}
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-2">
              Motivo principal de exclusión:
            </label>
            <div className="space-y-1.5">
              {EXCLUSION_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === r.label
                      ? 'bg-[#102d49]/5 border-[#102d49] text-[#102d49] font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="exclusion_reason"
                    checked={selectedReason === r.label}
                    onChange={() => setSelectedReason(r.label)}
                    className="text-[#102d49] focus:ring-[#102d49]"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Nota o aclaración técnica (Opcional):
            </label>
            <textarea
              rows={2}
              placeholder="Ej: El metraje incluye una terraza no techada de uso exclusivo que distorsiona el valor cubierto..."
              value={analystNote}
              onChange={(e) => setAnalystNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#102d49]/20"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <strong>Aviso de integridad:</strong> La exclusión solo aplica a esta tasación. El registro original de la Base Inmobiliaria no se altera ni elimina.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all"
          >
            Confirmar Exclusión
          </button>
        </div>
      </div>
    </div>
  );
};
