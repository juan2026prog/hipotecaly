import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Edit,
  Copy,
  GitBranch,
  History,
  Archive,
  RotateCcw,
  Trash2,
  Eye,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { DocumentTemplate } from '../../lib/docflow/types';
import { Button } from '../ui/Button';

interface TemplateCardProps {
  template: DocumentTemplate;
  isGlobal?: boolean;
  canManage?: boolean;
  isDeriving?: boolean;
  newerGlobalVersion?: number | null;
  onEdit: (template: DocumentTemplate) => void;
  onDuplicate: (template: DocumentTemplate) => void;
  onNewVersion?: (template: DocumentTemplate) => void;
  onHistory?: (template: DocumentTemplate) => void;
  onArchive?: (template: DocumentTemplate) => void;
  onRestore?: (template: DocumentTemplate) => void;
  onDelete?: (template: DocumentTemplate) => void;
  onDerive?: (template: DocumentTemplate) => void;
  onPreview?: (template: DocumentTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isGlobal = false,
  canManage = true,
  newerGlobalVersion,
  onEdit,
  onDuplicate,
  onNewVersion,
  onHistory,
  onArchive,
  onRestore,
  onDelete,
  onDerive,
  onPreview,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const usageCount = template.usage_count || 0;
  const isDerived = Boolean(template.parent_template_id);
  const isArchived = template.status === 'archived' || template.status === 'retired';

  const getStatusBadge = () => {
    switch (template.status) {
      case 'active':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            v{template.version} Activa
          </span>
        );
      case 'draft':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            v{template.version} Borrador
          </span>
        );
      case 'retired':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            v{template.version} Retirada
          </span>
        );
      case 'archived':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            v{template.version} Archivada
          </span>
        );
    }
  };

  const getOriginBadge = () => {
    if (isGlobal) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
          OFICIAL HIPOTECALY
        </span>
      );
    }
    if (isDerived) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
          PERSONALIZADA
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
        PROPIA
      </span>
    );
  };

  const formattedDate = template.updated_at
    ? new Date(template.updated_at).toLocaleDateString('es-UY')
    : new Date().toLocaleDateString('es-UY');

  return (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left relative ${
        isArchived ? 'border-slate-200 bg-slate-50/50 opacity-90' : 'border-slate-200'
      }`}
    >
      <div className="space-y-2.5">
        {/* Header de la tarjeta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {template.category}
            </span>
            {getOriginBadge()}
            {getStatusBadge()}
          </div>

          {/* Menú de Acciones ••• */}
          {!isGlobal && canManage && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#102d49] hover:bg-slate-100 transition-colors"
                title="Acciones de plantilla"
                aria-label="Menú de opciones"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-30 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(template);
                    }}
                    className="w-full px-3 py-2 flex items-center space-x-2 text-slate-700 hover:bg-slate-50 hover:text-[#102d49] font-medium transition"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-600" />
                    <span>Editar plantilla</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(template);
                    }}
                    className="w-full px-3 py-2 flex items-center space-x-2 text-slate-700 hover:bg-slate-50 hover:text-[#102d49] font-medium transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Duplicar como borrador</span>
                  </button>

                  {onNewVersion && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNewVersion(template);
                      }}
                      className="w-full px-3 py-2 flex items-center space-x-2 text-slate-700 hover:bg-slate-50 hover:text-[#102d49] font-medium transition"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Crear nueva versión (v{template.version + 1})</span>
                    </button>
                  )}

                  {onHistory && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onHistory(template);
                      }}
                      className="w-full px-3 py-2 flex items-center space-x-2 text-slate-700 hover:bg-slate-50 hover:text-[#102d49] font-medium transition"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver historial de versiones</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  {isArchived ? (
                    onRestore && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRestore(template);
                        }}
                        className="w-full px-3 py-2 flex items-center space-x-2 text-emerald-700 hover:bg-emerald-50 font-medium transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar a Activas</span>
                      </button>
                    )
                  ) : (
                    onArchive && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onArchive(template);
                        }}
                        className="w-full px-3 py-2 flex items-center space-x-2 text-amber-700 hover:bg-amber-50 font-medium transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archivar plantilla</span>
                      </button>
                    )
                  )}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(template);
                      }}
                      className="w-full px-3 py-2 flex items-center space-x-2 text-rose-700 hover:bg-rose-50 font-medium transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar plantilla</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nombre y Descripción */}
        <div>
          <h4 className="font-bold text-[#102d49] text-base leading-snug">{template.name}</h4>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {template.description || (isGlobal ? 'Plantilla oficial de la plataforma HIPOTECALY.' : 'Plantilla de la organización.')}
          </p>
        </div>

        {/* Alerta si hay versión global más nueva */}
        {newerGlobalVersion && newerGlobalVersion > (template.parent_version || 1) && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
            <div className="flex items-center space-x-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Nueva versión global disponible (v{newerGlobalVersion})</span>
            </div>
            <p className="text-[10px] text-amber-700">
              Tu versión está basada en v{template.parent_version || 1}. Tu plantilla se mantiene intacta.
            </p>
          </div>
        )}

        {/* Indicadores Técnicos & USOS */}
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-600 font-semibold">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Indicador de Uso:
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                usageCount === 0
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {usageCount === 0 ? 'Usos: 0' : `Usos: ${usageCount} doc(s)`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Firma electrónica:</span>
            <strong className={template.requires_signature ? 'text-emerald-700' : 'text-slate-500'}>
              {template.requires_signature ? 'Sí (Ley 18.600)' : 'No requerida'}
            </strong>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Modificado:</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas del Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {isGlobal ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview && onPreview(template)}
              className="text-xs font-semibold text-slate-700 hover:text-navy flex-1"
            >
              <Eye className="w-3.5 h-3.5 mr-1" /> Ver plantilla
            </Button>

            {onDerive && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onDerive(template)}
                className="text-xs font-bold bg-[#102d49] hover:bg-[#102d49]/90 text-white shadow-xs flex-1"
              >
                <GitBranch className="w-3.5 h-3.5 mr-1 text-[#f4b43b]" />
                Crear versión
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(template)}
              className="text-xs font-bold text-[#102d49] flex-1"
            >
              <Edit className="w-3.5 h-3.5 mr-1" /> Modificar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(template)}
              className="text-xs text-slate-600 hover:text-[#102d49] hover:bg-slate-100 px-2.5"
              title="Duplicar como borrador independiente"
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Duplicar
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
