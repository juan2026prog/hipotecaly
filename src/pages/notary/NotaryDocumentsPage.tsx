import React, { useState } from 'react';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import {
  FileText,
  Search,
  Eye,
  Download,
  ShieldCheck,
} from 'lucide-react';

export const NotaryDocumentsPage: React.FC = () => {

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const documents = [
    {
      id: 'doc-1',
      title: 'Título de Propiedad - Compraventa Año 2014',
      caseId: 'HIP-2026-00158',
      applicant: 'Martín López',
      category: 'Título Dominial',
      fileSize: '3.4 MB',
      status: 'Aprobado',
      date: '04/09/2026',
    },
    {
      id: 'doc-2',
      title: 'Borrador Escritura de Hipoteca y Mutuo v3 (DocFlow)',
      caseId: 'HIP-2026-00144',
      applicant: 'Ana Pereira',
      category: 'Escrituración',
      fileSize: '420 KB',
      status: 'Listo para Firma',
      date: '05/09/2026',
    },
    {
      id: 'doc-3',
      title: 'Cédula Catastral Vigente Dirección Nacional de Catastro',
      caseId: 'HIP-2026-00131',
      applicant: 'Carlos Méndez',
      category: 'Catastro',
      fileSize: '890 KB',
      status: 'Aprobado',
      date: '02/09/2026',
    },
    {
      id: 'doc-4',
      title: 'Certificado de Registro de Actos Personales (DGR)',
      caseId: 'HIP-2026-00158',
      applicant: 'Martín López',
      category: 'Registros',
      fileSize: '1.1 MB',
      status: 'En Revisión',
      date: '06/09/2026',
    },
    {
      id: 'doc-5',
      title: 'Testimonio de Declaratoria de Herederos - Roberto Vázquez',
      caseId: 'HIP-2026-00152',
      applicant: 'Lucía Vázquez',
      category: 'Sucesiones',
      fileSize: '4.8 MB',
      status: 'Observado',
      date: '03/09/2026',
    },
  ];

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.caseId.toLowerCase().includes(search.toLowerCase()) ||
      d.applicant.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <NotaryLayout title="Repositorio Documental Notarial">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Documentación de Legajos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta, visualización y descarga segura mediante URLs firmadas de todos los legajos asignados.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Almacenamiento Privado Cifrado</span>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, expediente o solicitante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Todas las categorías</option>
          <option value="Título Dominial">Título Dominial</option>
          <option value="Escrituración">Escrituración</option>
          <option value="Catastro">Catastro</option>
          <option value="Registros">Registros</option>
          <option value="Sucesiones">Sucesiones</option>
        </select>
      </div>

      {/* Tabla de Documentos */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Documento</th>
              <th className="px-4 py-3.5">Expediente</th>
              <th className="px-4 py-3.5">Categoría</th>
              <th className="px-4 py-3.5">Estado</th>
              <th className="px-4 py-3.5">Fecha</th>
              <th className="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      <div className="text-[11px] text-slate-400">{doc.fileSize}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono font-bold text-teal-700">
                  {doc.caseId}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  {doc.category}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.status === 'Aprobado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'Listo para Firma'
                        ? 'bg-purple-100 text-purple-800'
                        : doc.status === 'Observado'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-400">
                  {doc.date}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" title="Ver documento">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" title="Descargar copia firmada">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NotaryLayout>
  );
};
