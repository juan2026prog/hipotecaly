import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getLendersList,
  getInvestorLeads,
  getInvestorInterests,
  connectInvestorParties,
  convertLeadToInvestor,
  Lender,
  InvestorLead,
  InvestorInterest,
} from '../../lib/lendersService';
import { getTenantModules } from '../../lib/tenantModulesService';
import { ManualInvestorModal } from '../../components/investor/ManualInvestorModal';
import { ImportInvestorsModal } from '../../components/investor/ImportInvestorsModal';
import {
  Plus,
  FileSpreadsheet,
  Shield,
  ArrowRight,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
  Users,
  Inbox,
  HeartHandshake,
  RefreshCw,
} from 'lucide-react';

export const InvestorsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isOrganizationBackoffice = window.location.pathname.startsWith('/org/');
  const baseRoute = isOrganizationBackoffice
    ? `/org/${tenant.slug}/admin`
    : `/demo/${tenant.slug || 'estudio-nova'}/admin`;

  const activeTabParam = searchParams.get('tab') as 'red' | 'leads' | 'intereses' | null;
  const [activeTab, setActiveTab] = useState<'red' | 'leads' | 'intereses'>(activeTabParam || 'red');

  const [lenders, setLenders] = useState<Lender[]>([]);
  const [leads, setLeads] = useState<InvestorLead[]>([]);
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [loading, setLoading] = useState(true);

  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);

  // Modales
  const [showManualModal, setShowManualModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [connectingInterest, setConnectingInterest] = useState<InvestorInterest | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Toast / Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    if (tenant.id) {
      const modules = await getTenantModules(tenant.id);
      setWhiteLabelEnabled(Boolean(modules.white_label_enabled));

      const [lendersRes, leadsRes, interestsRes] = await Promise.all([
        getLendersList({ organizationId: tenant.id }),
        getInvestorLeads({ organizationId: tenant.id }),
        getInvestorInterests({ organizationId: tenant.id }),
      ]);

      setLenders(lendersRes.lenders);
      setLeads(leadsRes.leads);
      setInterests(interestsRes.interests);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tenant.id]);

  const handleTabChange = (tab: 'red' | 'leads' | 'intereses') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleConnectParties = async () => {
    if (!connectingInterest || !user) return;
    setIsConnecting(true);
    const { success, error } = await connectInvestorParties(connectingInterest.id, user.id);
    setIsConnecting(false);

    if (success) {
      setFeedbackMessage('✓ Las partes fueron conectadas exitosamente y se registró en la auditoría.');
      setConnectingInterest(null);
      loadData();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } else {
      alert('Error al conectar partes: ' + error);
    }
  };

  const handleConvertLead = async (lead: InvestorLead) => {
    const confirm = window.confirm(
      `¿Convertir a ${lead.full_name} en un inversor formal de la red?`
    );
    if (!confirm) return;

    const res = await convertLeadToInvestor(lead, user?.id);
    if (res.lender) {
      setFeedbackMessage(`✓ Inversor creado exitosamente a partir del lead de White Label.`);
      loadData();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } else {
      alert('Error al convertir lead: ' + res.error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <PauseCircle className="w-3 h-3 mr-1" /> Pausado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <AlertCircle className="w-3 h-3 mr-1" /> {status}
          </span>
        );
    }
  };

  return (
    <BackofficeLayout title="Red de Inversores">
      <div className="space-y-6 text-left">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Red de Inversores
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Administrá la red privada de inversores de tu organización.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowImportModal(true)}
              className="text-xs font-bold shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-700" />
              Importar cartera
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowManualModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Agregar inversor
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-700 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Banner de Contacto Protegido y Marco de Actuación */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-700">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-slate-900 block">
              Contacto protegido & Gestión independiente:
            </strong>
            <p className="text-slate-600 leading-relaxed">
              Los inversores reciben oportunidades con la información habilitada por la organización. Los datos de
              contacto se comparten cuando la organización decide conectar a las partes. Hipotecaly facilita la
              gestión y el contacto entre las partes; no formaliza inversiones ni administra fondos.
            </p>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="border-b border-slate-200 flex space-x-4">
          <button
            onClick={() => handleTabChange('red')}
            className={`pb-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'red'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Red de Inversores ({lenders.length})</span>
          </button>

          {whiteLabelEnabled && (
            <button
              onClick={() => handleTabChange('leads')}
              className={`pb-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-colors ${
                activeTab === 'leads'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-4 h-4 text-blue-600" />
              <span>Leads White Label ({leads.length})</span>
            </button>
          )}

          <button
            onClick={() => handleTabChange('intereses')}
            className={`pb-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'intereses'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-rose-600" />
            <span>Intereses Recibidos ({interests.length})</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: RED DE INVERSORES                                      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'red' && (
          <div>
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                Cargando red de inversores...
              </div>
            ) : lenders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">
                  No tenés inversores cargados todavía
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Agregá tu primer inversor manualmente o importá tu cartera desde un archivo CSV o Excel.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowManualModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    + Agregar inversor
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Inversor</th>
                        <th className="px-5 py-3.5">Tipo</th>
                        <th className="px-5 py-3.5">Estado</th>
                        <th className="px-5 py-3.5">Capital Disponible</th>
                        <th className="px-5 py-3.5">Financiación Máx (LTV)</th>
                        <th className="px-5 py-3.5">Rango</th>
                        <th className="px-5 py-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {lenders.map((lender) => (
                        <tr key={lender.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-sm">{lender.display_name}</div>
                            <div className="text-[11px] text-slate-400">
                              {lender.contact_name ? `${lender.contact_name} · ` : ''}
                              {lender.contact_email || 'Sin email'}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="capitalize">{lender.lender_type}</span>
                          </td>
                          <td className="px-5 py-4">{getStatusBadge(lender.status)}</td>
                          <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                            {lender.available_capital
                              ? `USD ${lender.available_capital.toLocaleString('es-UY')}`
                              : 'No informado'}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900">
                            {lender.rules ? `${Math.round(lender.rules.max_ltv * 100)}%` : 'No informado'}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {lender.rules
                              ? `USD ${lender.rules.min_loan.toLocaleString()} - ${lender.rules.max_loan.toLocaleString()}`
                              : 'No informado'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link to={`${baseRoute}/inversores/${lender.id}`}>
                              <Button variant="outline" size="sm">
                                Ver Ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {lenders.map((lender) => (
                    <div key={lender.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{lender.display_name}</h4>
                          <p className="text-[11px] text-slate-400">{lender.contact_email || 'Sin contacto'}</p>
                        </div>
                        {getStatusBadge(lender.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Capital Disponible</span>
                          <strong className="text-slate-900 font-mono">
                            {lender.available_capital
                              ? `USD ${lender.available_capital.toLocaleString('es-UY')}`
                              : 'No informado'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">LTV Máx</span>
                          <strong className="text-slate-900">
                            {lender.rules ? `${Math.round(lender.rules.max_ltv * 100)}%` : 'No informado'}
                          </strong>
                        </div>
                      </div>
                      <Link to={`${baseRoute}/inversores/${lender.id}`} className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: LEADS DE CAPTACIÓN WHITE LABEL                        */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'leads' && (
          <div>
            {leads.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">
                  No hay leads de captación registrados
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Cuando los interesados completen el formulario "Invertí con nosotros" de tu White Label,
                  aparecerán aquí para su revisión y posterior conversión.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Nombre / Lead</th>
                      <th className="px-5 py-3.5">Contacto</th>
                      <th className="px-5 py-3.5">Capital Estimado</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{lead.full_name}</div>
                          <div className="text-[11px] text-slate-400">{lead.investor_type}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div>{lead.email}</div>
                          <div className="text-[11px] text-slate-400">{lead.phone || '—'}</div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">
                          {lead.available_capital
                            ? `USD ${lead.available_capital.toLocaleString('es-UY')}`
                            : 'No especificado'}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              lead.status === 'new'
                                ? 'bg-blue-100 text-blue-800'
                                : lead.status === 'converted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          {lead.status !== 'converted' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConvertLead(lead)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]"
                            >
                              Convertir a Inversor
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: MANIFESTACIONES DE INTERÉS                             */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'intereses' && (
          <div>
            {interests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-2">
                <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Sin manifestaciones de interés registradas
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Cuando un inversor de tu red pulse "Me interesa" sobre una oportunidad, quedará listado aquí
                  para habilitar la conexión entre las partes.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Oportunidad</th>
                      <th className="px-5 py-3.5">Inversor</th>
                      <th className="px-5 py-3.5">Monto Indicativo</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {interests.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">
                          {item.opportunity?.application?.public_id || item.opportunity_id.slice(0, 8)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {item.lender?.display_name || 'Inversor'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.lender?.contact_email || ''}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">
                          {item.indicated_amount
                            ? `USD ${item.indicated_amount.toLocaleString('es-UY')}`
                            : 'Monto estándar'}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'connected'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.status === 'connected' ? 'Partes Conectadas' : 'Interesado'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {item.status !== 'connected' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setConnectingInterest(item)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px]"
                            >
                              Conectar Partes
                            </Button>
                          ) : (
                            <span className="text-emerald-700 font-bold text-xs flex items-center justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Conectado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal Manual */}
        <ManualInvestorModal
          isOpen={showManualModal}
          onClose={() => setShowManualModal(false)}
          organizationId={tenant.id}
          onSuccess={(newLender) => {
            setFeedbackMessage(`✓ Inversor ${newLender.display_name} creado con éxito.`);
            loadData();
            setTimeout(() => setFeedbackMessage(null), 4000);
          }}
        />

        {/* Modal Import */}
        <ImportInvestorsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          organizationId={tenant.id}
          existingLenders={lenders}
          onSuccess={(count) => {
            setFeedbackMessage(`✓ ${count} inversores importados exitosamente.`);
            loadData();
            setTimeout(() => setFeedbackMessage(null), 4000);
          }}
        />

        {/* Modal Confirmación Conectar Partes */}
        {connectingInterest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Conectar partes para esta oportunidad
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Esta acción habilitará el contacto entre las partes. Hipotecaly registra la conexión pero no
                  interviene en la negociación ni formalización posterior.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div>
                  <strong>Inversor:</strong> {connectingInterest.lender?.display_name}
                </div>
                <div>
                  <strong>Email:</strong> {connectingInterest.lender?.contact_email || 'No informado'}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setConnectingInterest(null)}
                  disabled={isConnecting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConnectParties}
                  disabled={isConnecting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isConnecting ? 'Conectando...' : 'Confirmar Conexión'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
};
