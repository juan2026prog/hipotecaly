import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import { useTenant } from '../../contexts/TenantContext';
import { FileText, Download, ShieldCheck, FolderX } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { tenant } = useTenant();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({
        organizationId: tenant.id,
        useDemoMode: isDemo,
      });

      const docs = apps.flatMap((app) =>
        (app.documents || []).map((doc: any) => ({
          ...doc,
          appId: app.id,
          publicId: app.public_id,
          borrowerName: app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Solicitante',
        }))
      );

      setDocuments(docs);
      setLoading(false);
    }
    loadDocs();
  }, [tenant.id, tenant.demo_mode]);

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Gestión Documental
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
              Repositorio de documentación privada con enlaces firmados temporales para {tenant.name}.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-brand-green bg-brand-green-light px-3 py-1.5 rounded-full font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Almacenamiento Seguro Privado</span>
          </div>
        </div>

        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-navy">
            <span>Documentos Subidos ({documents.length})</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando documentos...</div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No hay documentos registrados aún.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Los archivos adjuntados por solicitantes aparecerán listados aquí para su auditoría y descarga segura.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-navy text-sm">{doc.document_type}</h5>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {doc.file_name} · {((doc.file_size || 1048576) / (1024 * 1024)).toFixed(1)} MB · Solicitud{' '}
                        <Link to={`/app/solicitudes/${doc.appId}`} className="font-mono text-brand-green font-bold hover:underline">
                          {doc.publicId}
                        </Link>{' '}
                        ({doc.borrowerName})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                      {doc.status || 'verificado'}
                    </span>
                    <button className="inline-flex items-center px-3 py-1.5 rounded-btn bg-slate-100 hover:bg-brand-green hover:text-white transition-colors text-slate-700 font-semibold text-[11px]">
                      <Download className="w-3 h-3 mr-1" /> Enlace firmado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};
