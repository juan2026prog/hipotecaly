import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  ChevronRight,
  Stamp,
  Users,
} from 'lucide-react';

export const NotarySignaturesPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const signatureProcesses = [
    {
      id: 'sig-1',
      caseId: 'HIP-2026-00131',
      title: 'Escritura Pública de Préstamo con Garantía Hipotecaria',
      applicant: 'Carlos Méndez Fontana',
      lender: 'Inversor Calificado Privado',
      status: 'prepared',
      signersCount: 3,
      signedCount: 0,
      provider: 'Firma Gub / Abitab',
      createdAt: '05/09/2026',
    },
    {
      id: 'sig-2',
      caseId: 'HIP-2026-00144',
      title: 'Borrador Escritura de Hipoteca v3',
      applicant: 'Ana Pereira Ramos',
      lender: 'Grupo Financiero del Plata',
      status: 'in_progress',
      signersCount: 2,
      signedCount: 1,
      provider: 'Didit / Firma Digital Avanzada',
      createdAt: '04/09/2026',
    },
  ];

  return (
    <NotaryLayout title="Firmas Digitales Notariales">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Control de Procesos de Firma</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Firma digital avanzada con certificado de escribano, deudor y acreedor conforme a Ley 18.600.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
          <Stamp className="w-4 h-4 text-teal-600" />
          <span>Firma Digital Avanzada SCJ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signatureProcesses.map((proc) => (
          <div
            key={proc.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                {proc.caseId}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  proc.status === 'prepared' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {proc.status === 'prepared' ? 'Preparada para Inicio' : 'En Curso (1/2 Firmado)'}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{proc.title}</h3>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <div>Deudor: <span className="font-semibold text-slate-700">{proc.applicant}</span></div>
                <div>Acreedor: <span className="font-semibold text-slate-700">{proc.lender}</span></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Firmantes: {proc.signedCount} de {proc.signersCount} completados</span>
              </div>
              <span className="font-semibold text-slate-500">{proc.provider}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Creado el {proc.createdAt}</span>
              <Link
                to={`${basePath}/expedientes/e0000000-0000-0000-0000-000000000003`}
                className="inline-flex items-center space-x-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
              >
                <span>Gestionar firma</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </NotaryLayout>
  );
};
