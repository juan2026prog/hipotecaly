// ==============================================================================
// HIPOTECALY DOCFLOW: Modal de Generación Documental (DocumentGenerationModal)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { DocumentTemplate, ResolvedCaseData, ValidationResult } from '../../lib/docflow/types';
import { DocumentService } from '../../lib/docflow/documentService';
import { MissingDataAlert } from './MissingDataAlert';
import { Button } from '../ui/Button';

interface DocumentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  appData?: any;
  preselectedTemplateId?: string;
  onGenerated: (doc: any) => void;
  onGoToSection?: (category: string) => void;
}

export const DocumentGenerationModal: React.FC<DocumentGenerationModalProps> = ({
  isOpen,
  onClose,
  caseId,
  appData,
  preselectedTemplateId,
  onGenerated,
  onGoToSection,
}) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTplId, setSelectedTplId] = useState<string>('');
  const [caseData, setCaseData] = useState<ResolvedCaseData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      DocumentService.getTemplates(),
      DocumentService.resolveCaseData(appData || caseId),
    ]).then(([tpls, cData]) => {
      setTemplates(tpls);
      setCaseData(cData);
      const chosen = preselectedTemplateId || (tpls.length > 0 ? tpls[0].id : '');
      setSelectedTplId(chosen);
      setLoading(false);
    });
  }, [isOpen, caseId, appData, preselectedTemplateId]);

  useEffect(() => {
    if (!selectedTplId || !caseData) {
      setValidation(null);
      return;
    }
    const tpl = templates.find((t) => t.id === selectedTplId);
    if (tpl) {
      DocumentService.validateTemplateForCase(tpl, caseData).then((val) => {
        setValidation(val);
      });
    }
  }, [selectedTplId, caseData, templates]);

  if (!isOpen) return null;

  const selectedTpl = templates.find((t) => t.id === selectedTplId);

  const handleGenerate = async () => {
    if (!selectedTplId || !caseId) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await DocumentService.generateDocument(caseId, selectedTplId, undefined, appData);
      onGenerated(result.document);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al generar documento');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green-dark">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">Generar Documento con Autollenado</h3>
              <p className="text-xs text-slate-500">
                Expediente {caseData?.case?.code || caseId} · Los datos se extraerán automáticamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-navy rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando plantillas y datos...</div>
          ) : (
            <>
              {/* Selector de Plantilla */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Seleccionar Plantilla Oficial
                </label>
                <select
                  value={selectedTplId}
                  onChange={(e) => setSelectedTplId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-navy focus:ring-2 focus:ring-brand-green bg-white"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category.toUpperCase()})
                    </option>
                  ))}
                </select>
                {selectedTpl?.description && (
                  <p className="text-[11px] text-slate-500 mt-1">{selectedTpl.description}</p>
                )}
              </div>

              {/* Validación de Datos */}
              {validation && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Estado de los Datos Requeridos
                  </h4>
                  <MissingDataAlert
                    validation={validation}
                    documentTitle={selectedTpl?.name}
                    onGoToSection={onGoToSection}
                  />
                </div>
              )}

              {/* Resumen de Variables que se autollenarán */}
              {caseData && selectedTpl && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-navy font-bold">
                    <ShieldCheck className="w-4 h-4 text-brand-green" />
                    <span>Mapeo autoritativo de variables</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <strong>Titular:</strong> {caseData.applicant.full_name} ({caseData.applicant.document_id})
                    </div>
                    <div>
                      <strong>Inmueble:</strong> Padrón {caseData.property.padron} ({caseData.property.department})
                    </div>
                    <div>
                      <strong>Monto:</strong> {caseData.loan.currency} {caseData.loan.requested_amount.toLocaleString('es-UY')}
                    </div>
                    <div>
                      <strong>LTV / Plazo:</strong> {caseData.loan.ltv}% · {caseData.loan.term_months} meses
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleGenerate}
            disabled={loading || generating || Boolean(validation && !validation.isValid)}
            className="text-xs font-bold bg-brand-green hover:bg-brand-green-dark text-white shadow-xs"
          >
            {generating ? (
              'Generando y Calculando Hash...'
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generar Documento Inmutable
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
