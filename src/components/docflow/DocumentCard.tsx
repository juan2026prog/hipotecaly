// ==============================================================================
// HIPOTECALY DOCFLOW: Tarjeta de Documento (DocumentCard)
// Diseñada con el lenguaje visual exacto de HIPOTECALY: financiero, limpio y nítido.
// ==============================================================================

import React from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PenTool,
  ShieldCheck,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { GeneratedDocument, DocFlowStatus } from '../../lib/docflow/types';
import { Button } from '../ui/Button';

interface DocumentCardProps {
  document: GeneratedDocument;
  onPreview: (doc: GeneratedDocument) => void;
  onDownload?: (doc: GeneratedDocument) => void;
  onSign?: (doc: GeneratedDocument) => void;
  onRegenerate?: (doc: GeneratedDocument) => void;
  compact?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPreview,
  onDownload,
  onSign,
  onRegenerate,
  compact: _compact = false,
}) => {
  const getStatusBadge = (status: DocFlowStatus) => {
    switch (status) {
      case 'signed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Firmado
          </span>
        );
      case 'ready_for_signature':
      case 'sent_for_signature':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 animate-pulse">
            <PenTool className="w-3 h-3 mr-1" /> Pendiente de Firma
          </span>
        );
      case 'data_missing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> Datos Faltantes
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <FileCheck className="w-3 h-3 mr-1" /> Aprobado
          </span>
        );
      case 'superseded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
            Reemplazado (v{document.document_version})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 mr-1" /> Generado
          </span>
        );
    }
  };

  const formattedDate = new Date(document.generated_at).toLocaleDateString('es-UY');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green-dark shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-navy text-sm">{document.title}</h4>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                v{document.document_version}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
              Categoría: {document.category} · Generado el {formattedDate}
            </p>
          </div>
        </div>

        <div className="shrink-0">{getStatusBadge(document.status)}</div>
      </div>

      {document.status === 'data_missing' && document.missing_fields?.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-[11px] text-rose-800 space-y-1">
          <span className="font-bold flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" /> Campos obligatorios faltantes:
          </span>
          <p className="font-mono text-[10px]">{document.missing_fields.join(', ')}</p>
        </div>
      )}

      {document.file_hash && (
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
          <span className="truncate">Hash: {document.file_hash.slice(0, 24)}...</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(document)}
            className="text-xs font-semibold py-1 px-2.5 h-7"
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-slate-600" /> Ver
          </Button>

          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(document)}
              className="text-xs font-semibold py-1 px-2.5 h-7"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-600" /> Descargar
            </Button>
          )}

          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate(document)}
              className="text-xs text-slate-500 hover:text-navy py-1 px-2 h-7"
              title="Regenerar con datos actuales"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {onSign && (document.status === 'ready_for_signature' || document.status === 'sent_for_signature') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSign(document)}
            className="text-xs font-bold py-1 px-3 h-7 bg-brand-green hover:bg-brand-green-dark text-white shadow-xs"
          >
            <PenTool className="w-3.5 h-3.5 mr-1" /> Firmar
          </Button>
        )}
      </div>
    </div>
  );
};
