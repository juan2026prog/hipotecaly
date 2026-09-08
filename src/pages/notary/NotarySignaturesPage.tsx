import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  FileSignature,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Users,
} from 'lucide-react';
import { googleCalendarService, CalendarEventSchedule } from '../../lib/calendar/googleCalendarService';
import { AdvancedSignatureModal } from '../../components/signature/AdvancedSignatureModal';
import { SignatureEvidenceModal } from '../../components/signature/SignatureEvidenceModal';

export const NotarySignaturesPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  // Modales
  const [showFeaModal, setShowFeaModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('e0000000-0000-0000-0000-000000000001');
  const [selectedPublicId, setSelectedPublicId] = useState('HIP-2026-00158');
  const [selectedDocTitle, setSelectedDocTitle] = useState('Escritura Pública de Préstamo con Garantía Hipotecaria y Mutuo');

  // Firmas por coordinar (Revisión notarial aprobada, esperando fecha)
  const toCoordinateCases = [
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      publicId: 'HIP-2026-00142',
      applicant: 'Rodrigo Gómez Silveira',
      lender: 'Fondo Inversor Privado Nova Capital',
      property: 'Av. Brasil 2980, Pocitos',
      requestedAmount: 110000,
      currency: 'USD',
      statusLabel: 'Revisión notarial aprobada',
      originalsStatus: 'Originales cotejados',
      readySince: '07/09/2026',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000004',
      publicId: 'HIP-2026-00119',
      applicant: 'Sofía Larrañaga Rossi',
      lender: 'Fondo Inversor Privado Nova Capital',
      property: 'Solano Antuña 2710, Punta Carretas',
      requestedAmount: 95000,
      currency: 'USD',
      statusLabel: 'Revisión notarial aprobada',
      originalsStatus: 'No requiere originales',
      readySince: '06/09/2026',
    },
  ];

  // Firmas agendadas (Con evento de Google Calendar confirmado)
  const [scheduledSignatures, setScheduledSignatures] = useState<CalendarEventSchedule[]>([]);

  useEffect(() => {
    const events = googleCalendarService.getAllScheduledSignatures();
    setScheduledSignatures(events);
  }, []);

  return (
    <NotaryLayout title="Firmas Notariales">
      {/* Encabezado Limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Firmas Notariales</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión integral de firmas por coordinar y actos escriturarios agendados con Google Calendar y FEA.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Firma Electrónica Disponible</span>
        </div>
      </div>

      {/* BLOQUE 1: FIRMAS POR COORDINAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              1. Firmas por Coordinar
            </h3>
            <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
              {toCoordinateCases.length} expedientes listos
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Revisión jurídica aprobada · Pendientes de agendar fecha y hora
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toCoordinateCases.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4 hover:border-amber-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {c.publicId}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  🟢 {c.statusLabel}
                </span>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900">{c.applicant}</h4>
                <p className="text-xs text-slate-500">{c.property}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Acreedor:</span>
                  <span className="font-semibold text-slate-800">{c.lender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monto:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {c.currency} {c.requestedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Originales:</span>
                  <span className="font-semibold text-teal-700">✓ {c.originalsStatus}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link
                  to={`${basePath}/expedientes/${c.id}`}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                >
                  <span>Ver Expediente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={`${basePath}/expedientes/${c.id}`}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Coordinar Firma</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BLOQUE 2: FIRMAS AGENDADAS */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              2. Firmas Agendadas
            </h3>
            <span className="bg-teal-100 text-teal-900 font-bold text-[10px] px-2 py-0.5 rounded-full border border-teal-200">
              {scheduledSignatures.length} agendadas
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Sincronizadas con Google Calendar · Recordatorios 24h y 2h activos
          </span>
        </div>

        {scheduledSignatures.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            No hay firmas agendadas actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledSignatures.map((ev) => (
              <div
                key={ev.id}
                className="bg-white p-5 rounded-2xl border border-teal-500/40 shadow-sm space-y-4 hover:shadow-md transition-all ring-1 ring-teal-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                      {ev.applicationPublicId}
                    </span>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-teal-600" />
                      <span>Firma Agendada</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">Google Cal Event</span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-slate-900">{ev.title}</h4>
                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2 font-bold text-teal-950">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>Fecha y hora: {ev.date} · {ev.time} hs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {ev.participants.map((p) => p.name).join(' · ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Link
                    to={`${basePath}/expedientes/${ev.applicationId}`}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                  >
                    <span>Ver Expediente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedCaseId(ev.applicationId);
                      setSelectedPublicId(ev.applicationPublicId);
                      setSelectedDocTitle(ev.title);
                      setShowFeaModal(true);
                    }}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Iniciar Firma FEA</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {showFeaModal && (
        <AdvancedSignatureModal
          isOpen={showFeaModal}
          onClose={() => setShowFeaModal(false)}
          documentTitle={selectedDocTitle}
          documentVersion={4}
          applicationId={selectedCaseId}
          applicationPublicId={selectedPublicId}
          notaryUserId="u-test-notary"
          onSignatureCompleted={() => setShowFeaModal(false)}
        />
      )}

      {showEvidenceModal && (
        <SignatureEvidenceModal
          isOpen={showEvidenceModal}
          processId="sp-demo-002"
          onClose={() => setShowEvidenceModal(false)}
        />
      )}
    </NotaryLayout>
  );
};
