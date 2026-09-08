import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Tag,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  GitBranch,
  Code,
  Clock,
  Send,
  Building2,
} from 'lucide-react';
import { DocumentTemplate, DocumentCategory, TemplateStatus } from '../../lib/docflow/types';
import { DOCUMENT_VARIABLES, VARIABLE_CATEGORIES } from '../../lib/docflow/variableRegistry';
import { DocumentService } from '../../lib/docflow/documentService';
import { getApplicationsList } from '../../lib/backofficeService';
import { Button } from '../ui/Button';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: DocumentTemplate | null;
  onSaved: (template: DocumentTemplate) => void;
  tenantId?: string;
  tenantName?: string;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSaved,
  tenantId,
  tenantName = 'HIPOTECALY',
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'versioning'>('editor');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('solicitud');
  const [content, setContent] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('solicitante');
  const [status, setStatus] = useState<TemplateStatus>('draft');
  const [version, setVersion] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live test preview with application
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showConditionalModal, setShowConditionalModal] = useState(false);

  // Sync state on open or template change
  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setDescription(templateToEdit.description || '');
      setCategory(templateToEdit.category || 'solicitud');
      setContent(templateToEdit.template_content || '');
      setRequiresSignature(templateToEdit.requires_signature || false);
      setRequiredFields(templateToEdit.required_fields || []);
      setStatus(templateToEdit.status || 'active');
      setVersion(templateToEdit.version || 1);
    } else {
      setName('');
      setDescription('');
      setCategory('solicitud');
      setContent(
        `<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">\n  <div class="border-b-2 border-[#102d49] pb-4 mb-6 flex justify-between items-center">\n    <h1 class="text-xl font-bold text-[#102d49] uppercase">Nuevo Documento</h1>\n    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>\n  </div>\n\n  <p class="text-xs mb-4">En la ciudad de {{property.department}}, a los {{dates.today_formatted}}.</p>\n\n  <div class="space-y-4 text-xs text-slate-700">\n    <p>Por la presente, comparece <strong>{{applicant.full_name}}</strong>, titular de la Cédula de Identidad N° <strong>{{applicant.document_id}}</strong>, con domicilio en <strong>{{applicant.address}}</strong>.</p>\n  </div>\n</div>`
      );
      setRequiresSignature(false);
      setRequiredFields(['applicant.full_name', 'applicant.document_id', 'case.code']);
      setStatus('draft');
      setVersion(1);
    }
  }, [templateToEdit, isOpen]);

  // Load applications for preview testing
  useEffect(() => {
    if (isOpen) {
      getApplicationsList({ organizationId: tenantId, useDemoMode: true }).then((apps) => {
        setApplications(apps);
        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
          setSelectedApp(apps[0]);
        }
      });
    }
  }, [isOpen, tenantId]);

  // Update selected application when dropdown changes
  useEffect(() => {
    const found = applications.find((a) => a.id === selectedAppId);
    if (found) {
      setSelectedApp(found);
    }
  }, [selectedAppId, applications]);

  // Compute live test preview when entering preview tab or changing selected app / content
  useEffect(() => {
    if (!selectedApp || !content) {
      setPreviewHtml(content);
      return;
    }

    const appData = {
      applicant: {
        full_name: `${selectedApp.borrower?.first_name || ''} ${selectedApp.borrower?.last_name || ''}`.trim() || 'Juan Manuel Silva Gómez',
        first_name: selectedApp.borrower?.first_name || 'Juan Manuel',
        last_name: selectedApp.borrower?.last_name || 'Silva Gómez',
        document_id: selectedApp.borrower?.document_id || '4.182.930-1',
        email: selectedApp.borrower?.email || 'juan.silva@ejemplo.com',
        phone: selectedApp.borrower?.phone || '099 123 456',
        address: selectedApp.borrower?.address || 'Benito Blanco 1245 Apto 402',
        department: selectedApp.borrower?.department || selectedApp.property?.department || 'Montevideo',
        marital_status: selectedApp.borrower?.marital_status || 'Casado/a',
        occupation: selectedApp.borrower?.occupation || 'Ingeniero de Software / Dependiente',
        employer: selectedApp.borrower?.employer || 'Tecnologías del Plata S.A.',
        monthly_income: selectedApp.borrower?.monthly_income ? `$ ${Number(selectedApp.borrower.monthly_income).toLocaleString('es-UY')}` : '$ 95.000',
      },
      spouse: {
        full_name: selectedApp.spouse?.full_name || 'María Elena Larrosa',
        document_id: selectedApp.spouse?.document_id || '3.987.654-2',
      },
      property: {
        padron: selectedApp.property?.cadastral_number || selectedApp.property?.padron || '48.912',
        department: selectedApp.property?.department || 'Montevideo',
        city: selectedApp.property?.city || 'Montevideo',
        neighborhood: selectedApp.property?.neighborhood || 'Pocitos',
        address: selectedApp.property?.address || 'Av. Brasil 2840',
        type: selectedApp.property?.property_type || 'Apartamento',
        area_m2: selectedApp.property?.surface_m2 || 120,
        estimated_value: `USD ${Number(selectedApp.property?.estimated_value || 180000).toLocaleString('es-UY')}`,
        appraised_value: `USD ${Number(selectedApp.valuation?.preliminary_value || 185000).toLocaleString('es-UY')}`,
        legal_status: selectedApp.property?.legal_status || 'Libre de gravámenes',
      },
      loan: {
        requested_amount: `USD ${Number(selectedApp.requested_amount || 60000).toLocaleString('es-UY')}`,
        approved_amount: `USD ${Number(selectedApp.approved_amount || selectedApp.requested_amount || 60000).toLocaleString('es-UY')}`,
        currency: selectedApp.currency || 'USD',
        term_months: selectedApp.term_months || 36,
        interest_rate: '11.50%',
        monthly_payment: 'USD 575',
        ltv: selectedApp.property?.estimated_value ? `${((Number(selectedApp.requested_amount || 60000) / Number(selectedApp.property.estimated_value)) * 100).toFixed(1)}%` : '33.3%',
        repayment_mode: 'Solo Intereses',
      },
      lender: {
        name: 'Fondo Inmobiliario del Este',
        document_id: '219876540018',
      },
      notary: {
        full_name: 'Esc. María Pérez Morales',
        name: 'María Pérez',
        document_number: '3.892.415-8',
        notarial_fund_affiliate_number: '48.291',
        professional_address: 'Rincón 487 Piso 3 Esc. 302',
        professional_city: 'Montevideo',
        professional_department: 'Montevideo',
        electronic_domicile: 'maria.perez@notarios.org.uy',
        notary_office_name: 'Estudio Fernández & Asociados',
        digital_certificate_identifier: 'UY-CA-ABITAB-48291-MP',
        email: 'escribania@estudiofernandez.uy',
      },
      case: {
        code: selectedApp.public_id || 'HPT-2026-00124',
        created_at: new Date(selectedApp.created_at || Date.now()).toLocaleDateString('es-UY'),
        days_open: 3,
      },
      dates: {
        today_formatted: new Date().toLocaleDateString('es-UY', { year: 'numeric', month: 'long', day: 'numeric' }),
      },
      tenant: {
        name: tenantName,
        legal_name: `${tenantName} S.A.S.`,
        legal_representative: 'Dr. Alejandro Méndez',
      },
    };

    // Calculate missing fields
    const missing: string[] = [];
    requiredFields.forEach((fieldKey) => {
      const parts = fieldKey.split('.');
      let val: any = appData;
      for (const p of parts) {
        val = val ? val[p] : undefined;
      }
      if (val === undefined || val === null || val === '') {
        missing.push(fieldKey);
      }
    });
    setMissingFields(missing);

    // Replace variables in content
    let rendered = content;
    DOCUMENT_VARIABLES.forEach((v) => {
      const parts = v.key.split('.');
      let val: any = appData;
      for (const p of parts) {
        val = val ? val[p] : undefined;
      }
      const repl = val !== undefined && val !== null ? String(val) : `<span class="bg-amber-100 text-amber-800 px-1 rounded font-mono font-bold">[${v.label}: PENDIENTE]</span>`;
      const regex = new RegExp(`\\{\\{\\s*${v.key.replace('.', '\\.')}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, `<span class="bg-emerald-50 text-emerald-900 border-b border-emerald-400 font-semibold" title="Variable: {{${v.key}}}">${repl}</span>`);
    });

    // Replace simple conditional tags for preview
    rendered = rendered.replace(/\{\{#if\s+([a-zA-Z0-9_.]+)\}\}/g, '<div class="border-l-2 border-indigo-400 pl-3 my-2 bg-indigo-50/40 p-2 rounded text-xs"><strong>[Bloque Condicional si $1]:</strong> ');
    rendered = rendered.replace(/\{\{\/if\}\}/g, '</div>');

    setPreviewHtml(rendered);
  }, [selectedApp, content, requiredFields, tenantName]);

  if (!isOpen) return null;

  const handleInsertVariable = (variableKey: string) => {
    setContent((prev) => prev + `{{${variableKey}}}`);
  };

  const handleInsertConditional = (conditionField: string, sampleContent: string) => {
    const block = `\n{{#if ${conditionField}}}\n<div class="p-3 bg-slate-50 border border-slate-200 rounded my-3">\n  <p>${sampleContent}</p>\n</div>\n{{/if}}\n`;
    setContent((prev) => prev + block);
    setShowConditionalModal(false);
  };

  const handleToggleRequired = (key: string) => {
    if (requiredFields.includes(key)) {
      setRequiredFields(requiredFields.filter((k) => k !== key));
    } else {
      setRequiredFields([...requiredFields, key]);
    }
  };

  const handleSave = async (publishAsActive: boolean = false) => {
    if (!name.trim() || !content.trim()) {
      setError('El nombre y el contenido son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const targetStatus = publishAsActive ? 'active' : status;
      const targetVersion = templateToEdit ? (publishAsActive ? (templateToEdit.version || 1) + 1 : templateToEdit.version || 1) : 1;

      if (templateToEdit?.id) {
        const updated = await DocumentService.updateTemplate(templateToEdit.id, {
          name,
          slug: generatedSlug,
          description,
          category,
          template_content: content,
          requires_signature: requiresSignature,
          required_fields: requiredFields,
          status: targetStatus,
          version: targetVersion,
        });
        if (updated) onSaved(updated);
      } else {
        const created = await DocumentService.createTemplate({
          name,
          slug: generatedSlug,
          description,
          category,
          document_type: generatedSlug.replace(/-/g, '_'),
          status: targetStatus,
          version: targetVersion,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#102d49] flex items-center justify-center text-[#f4b43b] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Constructor DocFlow No-Code
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {status === 'active' ? `Publicado v${version}` : 'Borrador'}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#102d49] mt-0.5">
                {templateToEdit ? `Modificar Plantilla: ${templateToEdit.name}` : 'Crear Nueva Plantilla Documental'}
              </h3>
            </div>
          </div>

          {/* Tab Switcher inside Builder */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'editor' ? 'bg-white text-[#102d49] shadow-xs' : 'text-slate-600 hover:text-navy'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Estructura & Variables</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-white text-[#102d49] shadow-xs' : 'text-slate-600 hover:text-navy'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Probar con Expediente</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('versioning')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'versioning' ? 'bg-white text-[#102d49] shadow-xs' : 'text-slate-600 hover:text-navy'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                <span>Versiones</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-[#102d49] rounded-lg hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB 1: ESTRUCTURA & VARIABLES */}
        {activeTab === 'editor' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Metadatos principales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nombre Oficial de la Plantilla
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Contrato de Mutuo e Hipoteca Tipo"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-[#102d49] focus:ring-2 focus:ring-[#102d49]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]/20"
                >
                  <option value="solicitud">Solicitud & Clientes</option>
                  <option value="legal">Legal & Privacidad</option>
                  <option value="financiero">Financiero & Ofertas</option>
                  <option value="inmueble">Garantía & Inmueble</option>
                  <option value="tasacion">Tasaciones</option>
                  <option value="notarial">Notarial & Escrituración</option>
                  <option value="comunicacion">Comunicaciones</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Descripción Operativa
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Documento de uso notarial con cláusulas de mora y seguro obligatorio."
                className="w-full p-2 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-[#102d49]/20"
              />
            </div>

            {/* Panel de Inserción de Variables Visual Pills */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-extrabold text-[#102d49] uppercase tracking-wide">
                    Diccionario Visual de Variables Disponibles
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConditionalModal(true)}
                    className="text-xs font-bold text-[#102d49] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+ Insertar Bloque Condicional</span>
                  </button>
                </div>
              </div>

              {/* Selector de categorías */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2.5">
                {VARIABLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#102d49] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Chips / Pills de variables con nombre claro en español */}
              <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-1">
                {filteredVars.map((v) => {
                  const isRequired = requiredFields.includes(v.key);
                  return (
                    <div
                      key={v.key}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs shadow-2xs group transition"
                    >
                      <button
                        type="button"
                        onClick={() => handleInsertVariable(v.key)}
                        className="inline-flex items-center space-x-1.5 font-medium text-slate-800 hover:text-[#102d49]"
                        title={`Insertar {{${v.key}}} · Ejemplo: ${v.exampleValue || ''}`}
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition" />
                        <span className="font-semibold">{v.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">({`{{${v.key}}}`})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleRequired(v.key)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ml-1 transition-colors ${
                          isRequired
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title={isRequired ? 'Campo obligatorio en este documento' : 'Marcar como obligatorio'}
                      >
                        {isRequired ? 'Obligatorio ★' : '+Req'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal de inserción rápida de condicional */}
            {showConditionalModal && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Seleccionar Cláusula Condicional Prediseñada
                  </span>
                  <button type="button" onClick={() => setShowConditionalModal(false)} className="text-indigo-400 hover:text-indigo-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleInsertConditional('spouse.full_name', 'Comparece asimismo su cónyuge {{spouse.full_name}} (CI: {{spouse.document_id}}) prestando su formal consentimiento conyugal.')}
                    className="p-2.5 bg-white rounded-lg border border-indigo-200 text-left hover:border-indigo-400 transition"
                  >
                    <strong className="block text-navy">Consentimiento Conyugal</strong>
                    <span className="text-[11px] text-slate-500">Se incluye solo si el titular está casado y registra cónyuge.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertConditional('property.appraised_value', 'La garantía cuenta con tasación pericial por un valor de {{property.appraised_value}}.')}
                    className="p-2.5 bg-white rounded-lg border border-indigo-200 text-left hover:border-indigo-400 transition"
                  >
                    <strong className="block text-navy">Tasación Pericial Registrada</strong>
                    <span className="text-[11px] text-slate-500">Se incluye cuando el informe pericial está completado.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertConditional('loan.approved_amount', 'Las condiciones acordadas contemplan un monto de financiamiento de {{loan.approved_amount}} a una tasa anual de {{loan.interest_rate}}.')}
                    className="p-2.5 bg-white rounded-lg border border-indigo-200 text-left hover:border-indigo-400 transition"
                  >
                    <strong className="block text-navy">Oferta Aprobada</strong>
                    <span className="text-[11px] text-slate-500">Inserta las condiciones económicas finales acordadas.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertConditional('notary.full_name', 'Actúa como escribano designado {{notary.full_name}} (Caja Notarial N° {{notary.notarial_fund_affiliate_number}}).')}
                    className="p-2.5 bg-white rounded-lg border border-indigo-200 text-left hover:border-indigo-400 transition"
                  >
                    <strong className="block text-navy">Escribano Asignado</strong>
                    <span className="text-[11px] text-slate-500">Inserta la designación del profesional notarial.</span>
                  </button>
                </div>
              </div>
            )}

            {/* Editor de Contenido / Plantilla */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-slate-400" />
                  Estructura HTML & Etiquetas de Plantilla
                </label>
                <span className="text-[11px] text-slate-500">
                  Las variables <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">{`{{variable}}`}</code> se autollenarán con los datos del expediente.
                </span>
              </div>
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:ring-2 focus:ring-[#102d49] leading-relaxed shadow-inner"
                placeholder="<div class='p-8'><h1>Título</h1><p>Yo, {{applicant.full_name}}, con CI {{applicant.document_id}}...</p></div>"
              />
            </div>

            {/* Opciones de Firma y Salida */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={requiresSignature}
                  onChange={(e) => setRequiresSignature(e.target.checked)}
                  className="rounded text-[#102d49] focus:ring-[#102d49] w-4 h-4"
                />
                <span>Requiere firma electrónica avanzada (Ley N° 18.600)</span>
              </label>

              <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Salida: PDF con estampa criptográfica SHA-256</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROBAR CON EXPEDIENTE REAL */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Barra de control de prueba */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-[#102d49]" />
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Probar con Expediente Activo
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="mt-0.5 text-xs font-bold text-[#102d49] bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#102d49]"
                  >
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.public_id} — {app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Sin titular'} (USD {Number(app.requested_amount || 0).toLocaleString('es-UY')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diagnóstico de completitud de campos */}
              <div>
                {missingFields.length === 0 ? (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>100% de datos obligatorios presentes</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{missingFields.length} dato(s) obligatorio(s) pendiente(s)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Listado de campos obligatorios faltantes si hubiere */}
            {missingFields.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block">Campos obligatorios requeridos por esta plantilla:</span>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map((f) => (
                    <span key={f} className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800 text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Render del Documento de Prueba */}
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-300 flex justify-center">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-3xl w-full p-8 min-h-[500px]">
                <div
                  className="prose prose-sm max-w-none text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VERSIONES & HISTORIAL */}
        {activeTab === 'versioning' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-[#102d49] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                Historial de Versiones & Publicación Inmutable
              </h4>
              <p className="text-xs text-slate-600">
                DocFlow mantiene versiones inmutables de cada plantilla. Los documentos emitidos en el pasado permanecen vinculados a la versión con la que fueron creados para garantizar validez jurídica.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-4 flex items-center justify-between bg-emerald-50/40">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-[#102d49]">Versión {version}.0</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {status === 'active' ? 'VERSIÓN ACTIVA EN PRODUCCIÓN' : 'BORRADOR EN EDICIÓN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Última actualización: {new Date().toLocaleDateString('es-UY')} por Equipo {tenantName}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {status === 'draft' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSave(true)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Publicar como Versión Activa
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Versión vigente</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 mx-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Footer de Acciones */}
        <div className="p-4 px-6 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <Button variant="ghost" size="sm" onClick={onClose} type="button" className="text-xs">
            Cerrar
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="md"
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="text-xs font-semibold text-slate-700"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Guardar como Borrador
            </Button>

            <Button
              variant="primary"
              size="md"
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="text-xs font-bold bg-[#102d49] hover:bg-[#102d49]/90 text-white shadow-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Guardando...' : 'Publicar Plantilla'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
