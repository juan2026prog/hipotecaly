import React, { useState } from 'react';
import {
  X,
  FileText,
  Plus,
  Save,
  Tag,
} from 'lucide-react';
import { DocumentTemplate, DocumentCategory } from '../../lib/docflow/types';
import { DOCUMENT_VARIABLES, VARIABLE_CATEGORIES } from '../../lib/docflow/variableRegistry';
import { DocumentService } from '../../lib/docflow/documentService';
import { Button } from '../ui/Button';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: DocumentTemplate | null;
  onSaved: (template: DocumentTemplate) => void;
  tenantId?: string;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSaved,
  tenantId,
}) => {
  const [name, setName] = useState(templateToEdit?.name || '');
  const [slug] = useState(templateToEdit?.slug || '');
  const [description, setDescription] = useState(templateToEdit?.description || '');
  const [category, setCategory] = useState<DocumentCategory>(templateToEdit?.category || 'solicitud');
  const [content, setContent] = useState(templateToEdit?.template_content || '');
  const [requiresSignature, setRequiresSignature] = useState(templateToEdit?.requires_signature || false);
  const [requiredFields, setRequiredFields] = useState<string[]>(templateToEdit?.required_fields || []);
  const [activeCategory, setActiveCategory] = useState<string>('solicitante');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInsertVariable = (variableKey: string) => {
    setContent((prev) => prev + `{{${variableKey}}}`);
  };

  const handleToggleRequired = (key: string) => {
    if (requiredFields.includes(key)) {
      setRequiredFields(requiredFields.filter((k) => k !== key));
    } else {
      setRequiredFields([...requiredFields, key]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setError('El nombre y el contenido son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (templateToEdit?.id) {
        const updated = await DocumentService.updateTemplate(templateToEdit.id, {
          name,
          slug: generatedSlug,
          description,
          category,
          template_content: content,
          requires_signature: requiresSignature,
          required_fields: requiredFields,
        });
        if (updated) onSaved(updated);
      } else {
        const created = await DocumentService.createTemplate({
          name,
          slug: generatedSlug,
          description,
          category,
          document_type: generatedSlug.replace(/-/g, '_'),
          status: 'active',
          version: 1,
          output_format: 'pdf',
          template_content: content,
          requires_signature: requiresSignature,
          required_fields: requiredFields,
          is_global: !tenantId,
          tenant_id: tenantId || null,
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const filteredVars = DOCUMENT_VARIABLES.filter((v) => v.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green-dark">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">
                {templateToEdit ? `Editar Plantilla: ${templateToEdit.name}` : 'Nueva Plantilla Documental'}
              </h3>
              <p className="text-xs text-slate-500">
                Diseñá el documento e insertá variables dinámicas que se autollenarán con datos del caso.
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

        {/* Formulario */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Nombre de la Plantilla
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ficha del Solicitante y Capacidad"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-navy focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-navy bg-white focus:ring-2 focus:ring-brand-green"
              >
                <option value="solicitud">Solicitud</option>
                <option value="legal">Legal & Privacidad</option>
                <option value="financiero">Financiero & Ofertas</option>
                <option value="inmueble">Inmueble</option>
                <option value="tasacion">Tasación</option>
                <option value="notarial">Notarial</option>
                <option value="comunicacion">Comunicación</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Descripción Breve
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Documento de uso interno y comunicación para formalización."
              className="w-full p-2 rounded-lg border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-brand-green"
            />
          </div>

          {/* Panel de Inserción de Variables */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-brand-green" />
                <h4 className="text-xs font-bold text-navy uppercase tracking-wide">
                  Diccionario de Variables Disponibles (Hacer clic para insertar)
                </h4>
              </div>
            </div>

            {/* Categorías de Variables */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2.5">
              {VARIABLE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-navy text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Chips de variables */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {filteredVars.map((v) => {
                const isRequired = requiredFields.includes(v.key);
                return (
                  <div
                    key={v.key}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      className="inline-flex items-center space-x-1 hover:text-brand-green-dark"
                      title="Insertar en plantilla"
                    >
                      <Plus className="w-3 h-3 text-brand-green" />
                      <span>{`{{${v.key}}}`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleRequired(v.key)}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-sans font-bold ml-1 transition-colors ${
                        isRequired
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={isRequired ? 'Campo marcado como obligatorio' : 'Marcar como obligatorio'}
                    >
                      {isRequired ? 'Req ★' : '+Req'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editor de Contenido HTML / Plantilla */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Contenido del Documento (HTML / Variables)
              </label>
              <span className="text-[11px] text-slate-400">
                Soporta etiquetas HTML estándar y bloques condicionales <code className="font-mono">{`{{#if ...}}`}</code>
              </span>
            </div>
            <textarea
              required
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 font-mono text-xs text-navy bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:ring-2 focus:ring-brand-green leading-relaxed"
              placeholder="<div class='p-8'><h1>Título</h1><p>Yo, {{applicant.full_name}}, con CI {{applicant.document_id}}...</p></div>"
            />
          </div>

          {/* Opciones y Firma */}
          <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={requiresSignature}
                onChange={(e) => setRequiresSignature(e.target.checked)}
                className="rounded text-brand-green focus:ring-brand-green"
              />
              <span>Requiere firma de partes interesadas</span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose} type="button" className="text-xs">
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={saving}
              className="text-xs font-bold bg-brand-green hover:bg-brand-green-dark text-white shadow-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Guardando Plantilla...' : 'Guardar Plantilla'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
