import React, { useState } from 'react';
import { AlertTriangle, Trash2, Archive, X, ShieldAlert } from 'lucide-react';
import { DocumentTemplate } from '../../lib/docflow/types';
import { DocumentService } from '../../lib/docflow/documentService';
import { Button } from '../ui/Button';

interface TemplateDeleteModalProps {
  isOpen: boolean;
  template: DocumentTemplate | null;
  onClose: () => void;
  onSuccess: (action: 'deleted' | 'archived') => void;
  userContext?: { userId?: string; userName?: string; organizationId?: string; isSuperAdmin?: boolean };
}

export const TemplateDeleteModal: React.FC<TemplateDeleteModalProps> = ({
  isOpen,
  template,
  onClose,
  onSuccess,
  userContext,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !template) return null;

  const usageCount = template.usage_count || 0;
  const isZeroUsage = usageCount === 0;

  const handleDeleteDefinitive = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await DocumentService.deleteTemplate(template.id, userContext);
      if (res.success && res.action === 'hard_deleted') {
        onSuccess('deleted');
        onClose();
      } else {
        setError(res.message || 'No fue posible eliminar definitivamente la plantilla.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveInstead = async () => {
    setLoading(true);
    setError(null);
    try {
      const ok = await DocumentService.archiveTemplate(template.id, userContext);
      if (ok) {
        onSuccess('archived');
        onClose();
      } else {
        setError('No fue posible archivar la plantilla.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al archivar plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-left animate-in zoom-in-95">
        {/* Header del Modal */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isZeroUsage ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isZeroUsage ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isZeroUsage ? 'Eliminación Definitiva' : 'Trazabilidad Protegida'}
              </span>
              <h3 className="text-base font-bold text-[#102d49]">
                {isZeroUsage ? 'Eliminar Plantilla' : 'Esta plantilla ya fue utilizada'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#102d49] rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Detalle de la Plantilla */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#102d49]">{template.name}</span>
            <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold">
              v{template.version}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Categoría: {template.category}</span>
            <span className="font-semibold text-slate-700">Usos registrados: {usageCount}</span>
          </div>
        </div>

        {/* Mensaje Contextual según Usos */}
        {isZeroUsage ? (
          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800">
              Esta plantilla <strong>nunca fue utilizada</strong> para generar documentos ni forma parte de expedientes activos.
            </p>
            <p>
              Puede eliminarse definitivamente de la base de datos sin afectar ningún registro legal. Esta acción es permanente.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Esta plantilla fue utilizada en {usageCount} documento(s) histórico(s).</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Para mantener la trazabilidad documental, las firmas electrónicas y la auditoría notarial, no puede eliminarse físicamente de la base de datos.
              </p>
            </div>
            <p>
              Podés <strong>archivarla o retirarla</strong> de la biblioteca para impedir su uso en nuevos expedientes, conservando intactos todos los documentos generados con anterioridad.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="text-xs">
            Cancelar
          </Button>

          {isZeroUsage ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteDefinitive}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {loading ? 'Eliminando...' : 'Eliminar definitivamente'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleArchiveInstead}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              {loading ? 'Archivando...' : 'Archivar / Retirar plantilla'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
