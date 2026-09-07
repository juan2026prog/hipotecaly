import React, { useState } from 'react';
import {
  Plus,
  Search,
  Briefcase,
  RefreshCw,
  FolderX,
} from 'lucide-react';
import { GeneratedDocument } from '../../lib/docflow/types';
import { useCaseDocuments } from '../../lib/docflow/hooks';
import { DocumentCard } from './DocumentCard';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentGenerationModal } from './DocumentGenerationModal';
import { NotaryPackModal } from './NotaryPackModal';
import { Button } from '../ui/Button';

interface DocumentHubProps {
  caseId: string;
  appData?: any;
  onGoToSection?: (category: string) => void;
  allowNotaryPack?: boolean;
}

export const DocumentHub: React.FC<DocumentHubProps> = ({
  caseId,
  appData,
  onGoToSection,
  allowNotaryPack = true,
}) => {
  const { documents, loading, reload, counts } = useCaseDocuments(caseId, appData);

  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showNotaryModal, setShowNotaryModal] = useState(false);

  // Filtrado de documentos
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'todos') return true;
    if (activeFilter === 'para_firma') return doc.status === 'ready_for_signature' || doc.status === 'sent_for_signature';
    if (activeFilter === 'firmados') return doc.status === 'signed';
    if (activeFilter === 'generados') return doc.status === 'generated' || doc.status === 'approved';
    if (activeFilter === 'faltantes') return doc.status === 'data_missing';
    if (activeFilter === 'versiones') return doc.status === 'superseded';
    return true;
  });

  return (
    <div className="space-y-5 text-left">
      {/* Barra Superior del Hub */}
      <div className="bg-white rounded-card p-5 border border-slate-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
              DocFlow Hub
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-[11px] font-mono text-slate-500">Expediente {caseId}</span>
          </div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight mt-0.5">
            Gestión Documental & Legajo Digital
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documentación inmutable con autollenado, snapshots de auditoría y hashes SHA-256.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {allowNotaryPack && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotaryModal(true)}
              className="text-xs font-bold border-blue-200 text-[#0A3A60] bg-blue-50/60 hover:bg-blue-100"
            >
              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-[#0A3A60]" /> Paquete para Escribano
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowGenModal(true)}
            className="text-xs font-bold bg-brand-green hover:bg-brand-green-dark text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Generar Documento
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            className="text-xs text-slate-500 hover:text-navy p-2"
            title="Refrescar legajo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveFilter('todos')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'todos' ? 'bg-navy text-white border-navy' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold block uppercase ${activeFilter === 'todos' ? 'text-slate-300' : 'text-slate-400'}`}>
            Total Legajo
          </span>
          <span className="text-xl font-black mt-0.5 block">{counts.total}</span>
        </div>

        <div
          onClick={() => setActiveFilter('generados')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'generados' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold block uppercase ${activeFilter === 'generados' ? 'text-emerald-200' : 'text-slate-400'}`}>
            Generados
          </span>
          <span className="text-xl font-black mt-0.5 block">{counts.generated}</span>
        </div>

        <div
          onClick={() => setActiveFilter('para_firma')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'para_firma' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold block uppercase ${activeFilter === 'para_firma' ? 'text-amber-200' : 'text-slate-400'}`}>
            Para Firma
          </span>
          <span className="text-xl font-black mt-0.5 block">{counts.pendingSignature}</span>
        </div>

        <div
          onClick={() => setActiveFilter('firmados')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'firmados' ? 'bg-brand-green-dark text-white border-brand-green-dark' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-bold block uppercase ${activeFilter === 'firmados' ? 'text-brand-green-light' : 'text-slate-400'}`}>
            Firmados
          </span>
          <span className="text-xl font-black mt-0.5 block">{counts.signed}</span>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white rounded-card p-4 border border-slate-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Pestañas de subsecciones */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'generados', label: 'Generados' },
            { id: 'para_firma', label: 'Para Firma' },
            { id: 'firmados', label: 'Firmados' },
            { id: 'faltantes', label: 'Con Faltantes' },
            { id: 'versiones', label: 'Versiones Anteriores' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === f.id
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-navy focus:ring-2 focus:ring-brand-green bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Listado de Documentos */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-card border border-slate-border">
          Cargando legajo documental...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-card border border-slate-border shadow-card">
          <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-navy">No hay documentos en esta categoría</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hacé clic en &quot;Generar Documento&quot; para autollenar un formulario legal a partir de los datos existentes del expediente.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowGenModal(true)}
            className="text-xs font-bold bg-brand-green hover:bg-brand-green-dark text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Generar Primer Documento
          </Button>
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

      {/* Modales */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <DocumentGenerationModal
        isOpen={showGenModal}
        caseId={caseId}
        appData={appData}
        onClose={() => setShowGenModal(false)}
        onGenerated={reload}
        onGoToSection={onGoToSection}
      />

      <NotaryPackModal
        isOpen={showNotaryModal}
        caseId={caseId}
        appData={appData}
        onClose={() => setShowNotaryModal(false)}
        onGeneratedPack={reload}
      />
    </div>
  );
};
