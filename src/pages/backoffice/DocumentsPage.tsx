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
} from 'lucide-react';
import { DocumentTemplate, GeneratedDocument } from '../../lib/docflow/types';
import { DocumentService } from '../../lib/docflow/documentService';
import { DocumentCard } from '../../components/docflow/DocumentCard';
import { DocumentPreviewModal } from '../../components/docflow/DocumentPreviewModal';
import { TemplateEditorModal } from '../../components/docflow/TemplateEditorModal';
import { Button } from '../../components/ui/Button';

export const DocumentsPage: React.FC = () => {
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'documentos' | 'plantillas'>('documentos');

  // Documentos
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [searchDoc, setSearchDoc] = useState('');

  // Plantillas
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [tplsLoading, setTplsLoading] = useState(true);
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

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchDoc.toLowerCase()) ||
      d.category.toLowerCase().includes(searchDoc.toLowerCase()) ||
      d.case_id.toLowerCase().includes(searchDoc.toLowerCase())
  );

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                DocFlow Engine
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[11px] font-mono text-slate-500">{tenant.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-0.5">
              Infraestructura Documental & Plantillas
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
              Administración de plantillas oficiales, autollenado de expedientes y repositorio inmutable.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'plantillas' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedTpl(null);
                  setShowTplEditor(true);
                }}
                className="text-xs font-bold bg-brand-green hover:bg-brand-green-dark text-white shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva Plantilla
              </Button>
            )}

            <div className="flex items-center space-x-2 text-xs text-brand-green bg-brand-green-light px-3 py-1.5 rounded-full font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Criptografía SHA-256</span>
            </div>
          </div>
        </div>

        {/* Pestañas Principales */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'documentos'
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documentos Generados ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plantillas')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'plantillas'
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Plantillas Oficiales ({templates.length})</span>
          </button>
        </div>

        {/* TAB 1: DOCUMENTOS GENERADOS */}
        {activeTab === 'documentos' && (
          <div className="space-y-4">
            {/* Buscador */}
            <div className="bg-white rounded-card p-4 border border-slate-border shadow-card flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar documento por título, caso o categoría..."
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-navy focus:ring-2 focus:ring-brand-green bg-slate-50 focus:bg-white"
                />
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Mostrando {filteredDocs.length} de {documents.length} documentos
              </span>
            </div>

            {docsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-card border border-slate-border">
                Cargando repositorio documental...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-white rounded-card border border-slate-border shadow-card">
                <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-navy">No hay documentos generados aún</h4>
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

        {/* TAB 2: PLANTILLAS OFICIALES */}
        {activeTab === 'plantillas' && (
          <div className="space-y-4">
            {tplsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-card border border-slate-border">
                Cargando catálogo de plantillas...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {tpl.category}
                        </span>
                        {tpl.is_global && (
                          <span className="text-[10px] font-bold text-brand-green bg-brand-green-light px-2 py-0.5 rounded-full">
                            Global Plataforma
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-navy text-sm leading-snug">{tpl.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {tpl.description || 'Sin descripción.'}
                      </p>

                      <div className="text-[11px] text-slate-400 pt-1 space-y-0.5">
                        <p>Campos obligatorios: {tpl.required_fields?.length || 0}</p>
                        <p>Firma requerida: {tpl.requires_signature ? 'Sí' : 'No'}</p>
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
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>

                      <span className="text-[10px] font-mono text-slate-400">v{tpl.version}</span>
                    </div>
                  </div>
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
        onClose={() => setShowTplEditor(false)}
        onSaved={() => {
          loadTemplates();
        }}
      />
    </BackofficeLayout>
  );
};
