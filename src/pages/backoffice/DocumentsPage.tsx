import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  FileText,
  ShieldCheck,
  FolderX,
  Plus,
  Search,
  Layers,
  Edit,
  Sparkles,
  Building2,
  Copy,
} from 'lucide-react';
import { DocumentTemplate, GeneratedDocument } from '../../lib/docflow/types';
import { DocumentService } from '../../lib/docflow/documentService';
import { DocumentCard } from '../../components/docflow/DocumentCard';
import { DocumentPreviewModal } from '../../components/docflow/DocumentPreviewModal';
import { TemplateEditorModal } from '../../components/docflow/TemplateEditorModal';
import { Button } from '../../components/ui/Button';

export const DocumentsPage: React.FC = () => {
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'documentos' | 'plantillas'>('plantillas');

  // Documentos
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [searchDoc, setSearchDoc] = useState('');
  const [docFilter, setDocFilter] = useState('todos');

  // Plantillas
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [tplsLoading, setTplsLoading] = useState(true);
  const [searchTpl, setSearchTpl] = useState('');
  const [selectedTpl, setSelectedTpl] = useState<DocumentTemplate | null>(null);
  const [showTplEditor, setShowTplEditor] = useState(false);

  // Modal Preview
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);

  const loadDocuments = async () => {
    setDocsLoading(true);
    const docs = await DocumentService.getDocumentsByTenant(tenant.id);
    setDocuments(docs);
    setDocsLoading(false);
  };

  const loadTemplates = async () => {
    setTplsLoading(true);
    const tpls = await DocumentService.getTemplates(tenant.id);
    setTemplates(tpls);
    setTplsLoading(false);
  };

  useEffect(() => {
    loadDocuments();
    loadTemplates();
  }, [tenant.id]);

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchDoc.toLowerCase()) ||
      d.category.toLowerCase().includes(searchDoc.toLowerCase()) ||
      d.case_id.toLowerCase().includes(searchDoc.toLowerCase());
    if (docFilter === 'todos') return matchesSearch;
    return matchesSearch && d.status === docFilter;
  });

  const globalTemplates = templates.filter(
    (t) =>
      t.is_global &&
      (t.name.toLowerCase().includes(searchTpl.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTpl.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTpl.toLowerCase()))
  );

  const tenantTemplates = templates.filter(
    (t) =>
      !t.is_global &&
      (t.name.toLowerCase().includes(searchTpl.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTpl.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTpl.toLowerCase()))
  );

  const handleDuplicateTemplate = (tpl: DocumentTemplate) => {
    setSelectedTpl({
      ...tpl,
      id: '',
      name: `${tpl.name} (Copia ${tenant.name})`,
      is_global: false,
      tenant_id: tenant.id,
      status: 'draft',
      version: 1,
    });
    setShowTplEditor(true);
  };

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider">
                DocFlow Engine
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-xs font-semibold text-slate-500">{tenant.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight mt-1">
              Documentos & Plantillas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Constructor de plantillas oficiales con autollenado, vista previa con expedientes y repositorio inmutable.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedTpl(null);
                setShowTplEditor(true);
              }}
              className="text-xs font-bold bg-[#102d49] hover:bg-[#102d49]/90 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" /> + Nueva Plantilla
            </Button>

            <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SHA-256 / Ley 18.600</span>
            </div>
          </div>
        </div>

        {/* Pestañas Principales */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'plantillas'
                ? 'border-[#102d49] text-[#102d49]'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Plantillas DocFlow ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'documentos'
                ? 'border-[#102d49] text-[#102d49]'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Hub ({documents.length})</span>
          </button>
        </div>

        {/* TAB 1: PLANTILLAS DOCFLOW */}
        {activeTab === 'plantillas' && (
          <div className="space-y-8">
            {/* Buscador de plantillas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar plantillas por nombre, categoría o palabra clave..."
                  value={searchTpl}
                  onChange={(e) => setSearchTpl(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-[#102d49] focus:ring-2 focus:ring-[#102d49]/20 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <span className="font-semibold">{tenantTemplates.length} de la organización</span>
                <span>·</span>
                <span className="font-semibold">{globalTemplates.length} oficiales globales</span>
              </div>
            </div>

            {tplsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                Cargando catálogo de plantillas...
              </div>
            ) : (
              <>
                {/* SECCIÓN A: PLANTILLAS DE LA ORGANIZACIÓN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-[#102d49]" />
                      <h3 className="text-sm font-bold text-[#102d49] uppercase tracking-wide">
                        Plantillas de {tenant.name}
                      </h3>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {tenantTemplates.length}
                      </span>
                    </div>
                  </div>

                  {tenantTemplates.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">Aún no hay plantillas personalizadas de {tenant.name}</p>
                      <p className="text-[11px] text-slate-400">Podés crear una nueva plantilla desde cero o duplicar una plantilla global de la plataforma.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTpl(null);
                          setShowTplEditor(true);
                        }}
                        className="text-xs font-bold mt-2"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-[#102d49]" /> Crear mi primera plantilla
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tenantTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {tpl.category}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  tpl.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {tpl.status === 'active' ? `v${tpl.version} Activa` : 'Borrador'}
                              </span>
                            </div>

                            <h4 className="font-bold text-[#102d49] text-sm leading-snug">{tpl.name}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {tpl.description || 'Sin descripción.'}
                            </p>

                            <div className="text-[11px] text-slate-400 pt-1 space-y-0.5">
                              <p>Campos requeridos: <strong className="text-slate-600">{tpl.required_fields?.length || 0}</strong></p>
                              <p>Firma electrónica: <strong className="text-slate-600">{tpl.requires_signature ? 'Sí (Ley 18.600)' : 'No requerida'}</strong></p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTpl(tpl);
                                setShowTplEditor(true);
                              }}
                              className="text-xs font-bold text-[#102d49]"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" /> Editar / Probar
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateTemplate(tpl)}
                              className="text-xs text-slate-400 hover:text-[#102d49] p-1.5 rounded-lg hover:bg-slate-100 transition"
                              title="Duplicar plantilla"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECCIÓN B: PLANTILLAS OFICIALES GLOBALES */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-[#102d49] uppercase tracking-wide">
                        Plantillas Oficiales HIPOTECALY (Plataforma)
                      </h3>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {globalTemplates.length} estándar
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {tpl.category}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Global Oficial
                            </span>
                          </div>

                          <h4 className="font-bold text-[#102d49] text-sm leading-snug">{tpl.name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {tpl.description || 'Sin descripción.'}
                          </p>

                          <div className="text-[11px] text-slate-400 pt-1 space-y-0.5">
                            <p>Campos requeridos: <strong className="text-slate-600">{tpl.required_fields?.length || 0}</strong></p>
                            <p>Firma electrónica: <strong className="text-slate-600">{tpl.requires_signature ? 'Sí' : 'No'}</strong></p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTpl(tpl);
                              setShowTplEditor(true);
                            }}
                            className="text-xs font-semibold"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Ver / Probar
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateTemplate(tpl)}
                            className="text-xs font-bold text-[#102d49] hover:bg-slate-100"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" /> Duplicar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENT HUB */}
        {activeTab === 'documentos' && (
          <div className="space-y-4">
            {/* Subpestañas Documentales */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'draft', label: 'Borrador' },
                { id: 'ready', label: 'Generados' },
                { id: 'signed', label: 'Firmados' },
                { id: 'archived', label: 'Archivados' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setDocFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                    docFilter === sub.id
                      ? 'bg-[#102d49] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Buscador de documentos */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar documento por título, caso o categoría..."
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-[#102d49] focus:ring-2 focus:ring-[#102d49]/20 bg-slate-50 focus:bg-white"
                />
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Mostrando {filteredDocs.length} de {documents.length} documentos
              </span>
            </div>

            {docsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                Cargando repositorio documental...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-[#102d49]">No hay documentos generados aún</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Los documentos autollenados desde cada expediente aparecerán listados aquí para su auditoría y descarga segura.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onPreview={(d) => setPreviewDoc(d)}
                    onDownload={(d) => setPreviewDoc(d)}
                    onSign={(d) => setPreviewDoc(d)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <TemplateEditorModal
        isOpen={showTplEditor}
        templateToEdit={selectedTpl}
        tenantId={tenant.id}
        tenantName={tenant.name}
        onClose={() => setShowTplEditor(false)}
        onSaved={() => {
          loadTemplates();
        }}
      />
    </BackofficeLayout>
  );
};
