import React, { useState, useEffect } from 'react';
import { History, X, Clock, CheckCircle2, Eye } from 'lucide-react';
import { DocumentTemplate, TemplateVersionHistoryItem } from '../../lib/docflow/types';
import { DocumentService } from '../../lib/docflow/documentService';
import { Button } from '../ui/Button';

interface TemplateHistoryModalProps {
  isOpen: boolean;
  template: DocumentTemplate | null;
  onClose: () => void;
  onSelectVersion?: (versionTemplate: DocumentTemplate) => void;
}

export const TemplateHistoryModal: React.FC<TemplateHistoryModalProps> = ({
  isOpen,
  template,
  onClose,
  onSelectVersion: _onSelectVersion,
}) => {
  const [history, setHistory] = useState<TemplateVersionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TemplateVersionHistoryItem | null>(null);

  useEffect(() => {
    if (isOpen && template) {
      setLoading(true);
      DocumentService.getTemplateVersionHistory(template.id, template.tenant_id || undefined)
        .then((items) => {
          setHistory(items);
          if (items.length > 0) {
            setSelectedItem(items[0]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, template]);

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono">
                Trazabilidad Histórica DocFlow
              </span>
              <h3 className="text-base font-bold text-[#102d49] mt-0.5">
                Historial de Versiones: {template.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#102d49] rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Cada vez que se modifica una plantilla utilizada, HIPOTECALY genera una nueva versión inmutable. Los documentos generados en expedientes anteriores conservan su versión original y su hash criptográfico intacto.
          </p>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Cargando historial de versiones...
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No se registraron versiones adicionales para esta plantilla.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const formattedDate = new Date(item.created_at).toLocaleString('es-UY');
                const isSelected = selectedItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs font-black bg-[#102d49] text-white px-2 py-0.5 rounded">
                          v{item.version}.0
                        </span>
                        <h4 className="font-bold text-xs text-[#102d49]">{item.name}</h4>
                        {item.is_current && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Versión Actual
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.usage_count} documentos generados
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        Fecha: {formattedDate}
                      </span>
                      {item.created_by_name && (
                        <span>Autor: <strong className="text-slate-600">{item.created_by_name}</strong></span>
                      )}
                      <span>Estado: <strong className="capitalize text-slate-600">{item.status}</strong></span>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 text-xs text-slate-700 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] uppercase tracking-wide text-indigo-900 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-indigo-600" /> Vista Previa del Código de Plantilla
                          </span>
                        </div>
                        <pre className="p-3 bg-slate-900 text-slate-200 text-[10px] font-mono rounded-lg overflow-x-auto max-h-36">
                          {item.template_content}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Total de versiones archivadas: {history.length}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
