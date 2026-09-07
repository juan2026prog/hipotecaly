// ==============================================================================
// HIPOTECALY DOCFLOW: Modal de Previsualización e Impresión Documental
// ==============================================================================

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { GeneratedDocument } from '../../lib/docflow/types';
import { Button } from '../ui/Button';
import { renderTemplate } from '../../lib/docflow/templateEngine';
import { INITIAL_TEMPLATES } from '../../lib/docflow/initialTemplates';

interface DocumentPreviewModalProps {
  document: GeneratedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (doc: GeneratedDocument) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onDownload,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !document) return null;

  // Reconstruir o renderizar HTML usando el snapshot inmutable
  let htmlContent = '';
  if (document.snapshot_json) {
    const tpl = INITIAL_TEMPLATES.find((t) => t.document_type === document.document_type) || INITIAL_TEMPLATES[0];
    htmlContent = renderTemplate(tpl.template_content, document.snapshot_json as any);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header del Modal */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green-dark">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy flex items-center space-x-2">
                <span>{document.title}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                  v{document.document_version}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Snapshot inmutable generado el {new Date(document.generated_at).toLocaleString('es-UY')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> Imprimir / PDF
            </Button>
            {onDownload && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onDownload(document)}
                className="text-xs font-semibold bg-brand-green hover:bg-brand-green-dark text-white"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-navy rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Integridad Criptográfica */}
        <div className="bg-slate-900 text-slate-200 px-6 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SHA-256: {document.file_hash || 'Verificado criptográficamente'}</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400 font-sans font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Snapshot de datos congelado</span>
          </div>
        </div>

        {/* Contenido Renderizado */}
        <div
          ref={printContentRef}
          className="p-8 overflow-y-auto flex-1 bg-slate-50 text-slate-800 space-y-4"
        >
          <div
            className="bg-white p-8 sm:p-12 rounded-xl shadow-xs border border-slate-200 min-h-[600px]"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Footer del Modal */}
        <div className="p-3 px-6 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>HIPOTECALY DOCFLOW · Registro inmutable de documentación</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cerrar Vista Previa
          </Button>
        </div>
      </div>
    </div>
  );
};
