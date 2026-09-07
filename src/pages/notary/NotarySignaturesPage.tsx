import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  ChevronRight,
  Stamp,
  Users,
  ShieldCheck,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { AdvancedSignatureModal } from '../../components/signature/AdvancedSignatureModal';
import { SignatureEvidenceModal } from '../../components/signature/SignatureEvidenceModal';
import { NotaryElectronicSupportBadge } from '../../components/signature/NotaryElectronicSupportBadge';

export const NotarySignaturesPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const [showFeaModal, setShowFeaModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState('sp-demo-002');
  const [selectedDocTitle, setSelectedDocTitle] = useState('Escritura Pública de Préstamo con Garantía Hipotecaria y Mutuo');
  const [selectedCaseId, setSelectedCaseId] = useState('e0000000-0000-0000-0000-000000000001');
  const [selectedPublicId, setSelectedPublicId] = useState('HIP-2026-00158');

  // Bandeja de Documentos que Requieren Firma Inmediata del Escribano
  const pendingForNotary = [
    {
      id: 'sp-pen-1',
      caseId: 'e0000000-0000-0000-0000-000000000001',
      publicId: 'HIP-2026-00158',
      title: 'Escritura Pública de Préstamo con Garantía Hipotecaria y Mutuo (v4)',
      applicant: 'Martín López Arispe',
      lender: 'Fondo Inmobiliario del Este',
      preparedAt: '07/09/2026 10:42',
      isNotarial: true,
      supportCode: 'SNE-2026-UY-48291-0021',
      sha256: '8f542a1b9e02c7891234567890abcdef...',
    },
    {
      id: 'sp-pen-2',
      caseId: 'e0000000-0000-0000-0000-000000000002',
      publicId: 'HIP-2026-00142',
      title: 'Certificado de Vigencia y Representación de Sociedad Anónima (v1)',
      applicant: 'Rodrigo Gómez Silveira',
      lender: 'Inversor Privado Registrado',
      preparedAt: '06/09/2026 16:15',
      isNotarial: true,
      supportCode: 'SNE-2026-UY-48291-0019',
      sha256: '9a112f4c8e90a1231234567890abcdef...',
    },
  ];

  // Procesos en Curso Multilateral
  const ongoingProcesses = [
    {
      id: 'sig-1',
      caseId: 'HIP-2026-00131',
      title: 'Escritura Pública de Préstamo Hipotecario',
      applicant: 'Carlos Méndez Fontana',
      lender: 'Inversor Calificado Privado',
      status: 'prepared',
      signersCount: 3,
      signedCount: 2,
      provider: 'Firma.gub.uy (AGESIC)',
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
      provider: 'Didit / Firma Avanzada',
      createdAt: '04/09/2026',
    },
  ];

  // Documentos Validados con Evidencia
  const validatedDocuments = [
    {
      processId: 'sp-demo-002',
      caseId: 'HIP-2026-00120',
      title: 'Certificado de Gravámenes y Gravámenes Registrales — Versión 2',
      signedAt: '06/09/2026 14:20',
      signer: 'Esc. María Pérez Morales',
      notarialSupport: 'SNE-2026-UY-48291-0012',
      provider: 'Firma.gub.uy (AGESIC)',
    },
  ];

  const handleOpenSignModal = (doc: typeof pendingForNotary[0]) => {
    setSelectedDocTitle(doc.title);
    setSelectedCaseId(doc.caseId);
    setSelectedPublicId(doc.publicId);
    setShowFeaModal(true);
  };

  return (
    <NotaryLayout title="Firmas Electrónicas Avanzadas (FEA)">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Control Notarial de Firma Digital</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Firma Electrónica Avanzada conforme a la Ley N.º 18.600 y el Reglamento Notarial de la SCJ.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 shadow-sm">
          <Stamp className="w-4 h-4 text-teal-600" />
          <span>Firma.gub.uy Oficial Habilitada</span>
        </div>
      </div>

      {/* BANDEJA: DOCUMENTOS QUE REQUIEREN TU FIRMA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-black text-slate-900">Documentos Pendientes de tu Firma</h3>
            <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
              {pendingForNotary.length} urgentes
            </span>
          </div>
          <span className="text-xs text-slate-400">Certificado digital listo para firmar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingForNotary.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-2xl border border-teal-500/30 shadow-sm space-y-4 hover:shadow-md transition-all ring-1 ring-teal-500/10"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  {doc.publicId}
                </span>
                <NotaryElectronicSupportBadge
                  isNotarialElectronicDocument={doc.isNotarial}
                  notarialSupportCode={doc.supportCode}
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                  <div>Deudor: <span className="font-semibold text-slate-700">{doc.applicant}</span></div>
                  <div>Acreedor: <span className="font-semibold text-slate-700">{doc.lender}</span></div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[10px] text-slate-500 truncate">
                Hash original pre-firma: <span className="text-slate-800 font-bold">{doc.sha256}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">Preparado: {doc.preparedAt}</span>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`${basePath}/expedientes/${doc.caseId}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Ver expediente
                  </Link>
                  <button
                    onClick={() => handleOpenSignModal(doc)}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <Stamp className="w-3.5 h-3.5" />
                    <span>Firmar con FEA</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROCESOS MULTILATERALES EN CURSO */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-black text-slate-900">Procesos Multilaterales en Curso</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ongoingProcesses.map((proc) => (
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
                <h4 className="text-sm font-bold text-slate-900">{proc.title}</h4>
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
      </div>

      {/* DOCUMENTOS FIRMADOS Y EVIDENCIA */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-black text-slate-900">Documentos Notariales Validados</h3>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100 text-xs">
          {validatedDocuments.map((valDoc, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-teal-700">{valDoc.caseId}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-slate-900">{valDoc.title}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Firmante: <strong className="text-slate-700">{valDoc.signer}</strong> · Soporte: <span className="font-mono text-purple-700 font-bold">{valDoc.notarialSupport}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    setSelectedProcessId(valDoc.processId);
                    setShowEvidenceModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Ver Evidencia</span>
                </button>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Descargando PDF firmado original byte-for-byte con firma criptográfica preservada.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      <AdvancedSignatureModal
        isOpen={showFeaModal}
        onClose={() => setShowFeaModal(false)}
        documentTitle={selectedDocTitle}
        documentVersion={4}
        applicationId={selectedCaseId}
        applicationPublicId={selectedPublicId}
        notaryUserId="u-test-notary"
        onSignatureCompleted={() => {
          setShowFeaModal(false);
          setSelectedProcessId('sp-demo-002');
          setShowEvidenceModal(true);
        }}
      />

      <SignatureEvidenceModal
        isOpen={showEvidenceModal}
        processId={selectedProcessId}
        onClose={() => setShowEvidenceModal(false)}
      />
    </NotaryLayout>
  );
};
