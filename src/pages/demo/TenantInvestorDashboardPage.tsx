// ==============================================================================
// HIPOTECALY: Tenant Private Investor Dashboard (/demo/:tenantSlug/inversor)
// Red Privada de Inversores del Tenant con Aislamiento Estricto
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Target,
  MessageSquare,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { TenantInvestorLayout } from '../../components/layout/TenantInvestorLayout';
import { useTenant } from '../../contexts/TenantContext';
import { getTenantModules } from '../../lib/tenantModulesService';
import { Button } from '../../components/ui/Button';

interface PrivateOpportunity {
  id: string;
  public_id: string;
  zone: string;
  property_type: string;
  requested_amount: number;
  currency: string;
  preliminary_valuation: number;
  ltv: number;
  term_months: number;
  clearing: string;
  status: string;
  assigned_at: string;
}

export const TenantInvestorDashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();

  const [isModuleEnabled, setIsModuleEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Subsección según ruta
  const isOportunidades = location.pathname.endsWith('/oportunidades');
  const isOfertas = location.pathname.endsWith('/ofertas');
  const isMensajes = location.pathname.endsWith('/mensajes');

  const [opportunities] = useState<PrivateOpportunity[]>([
    {
      id: 'opp-nova-1',
      public_id: 'NOV-2026-00089',
      zone: 'Carrasco · Montevideo',
      property_type: 'Casa Residencial',
      requested_amount: 100000,
      currency: 'USD',
      preliminary_valuation: 320000,
      ltv: 31.2,
      term_months: 36,
      clearing: 'Sin antecedentes crediticios',
      status: 'disponible',
      assigned_at: 'Hace 2 horas',
    },
    {
      id: 'opp-nova-2',
      public_id: 'NOV-2026-00094',
      zone: 'Pocitos · Montevideo',
      property_type: 'Apartamento',
      requested_amount: 65000,
      currency: 'USD',
      preliminary_valuation: 190000,
      ltv: 34.2,
      term_months: 24,
      clearing: 'Aprobado técnicamente',
      status: 'en_evaluacion',
      assigned_at: 'Ayer',
    },
  ]);

  useEffect(() => {
    async function checkModule() {
      setLoading(true);
      if (tenant.id) {
        const modules = await getTenantModules(tenant.id);
        setIsModuleEnabled(modules.investor_portal_enabled ?? true);
      }
      setLoading(false);
    }
    checkModule();
  }, [tenant.id]);

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-bg">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si el módulo está deshabilitado para este tenant, devolver 404 / Aviso controlado
  if (isModuleEnabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-bg px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Módulo no habilitado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            La red privada de inversores no se encuentra activa para la organización {brandName}.
          </p>
          <Link to={`/demo/${tenant.slug}`}>
            <Button variant="outline" size="sm">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TenantInvestorLayout title={`Red Privada de Inversores — ${brandName}`}>
      <div className="space-y-8">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                Red Privada {brandName}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-slate-500">Aislamiento por Tenant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight mt-1">
              {isOfertas ? 'Propuestas Emitidas' : isMensajes ? 'Centro de Mensajería' : isOportunidades ? 'Operaciones Asignadas' : 'Panel de Control del Inversor'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Operaciones estructuradas exclusivamente por {brandName} con garantía hipotecaria de primer rango.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link to={`/demo/${tenant.slug}/inversor/oportunidades`}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Target className="w-3.5 h-3.5 mr-1.5" />
                Ver Operaciones
              </Button>
            </Link>
          </div>
        </div>

        {/* Métricas del Inversor */}
        {!isOfertas && !isMensajes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Operaciones Asignadas</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{opportunities.length}</div>
              <span className="text-[11px] text-emerald-600 flex items-center mt-1">
                Disponibles para evaluación
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">LTV Promedio</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">32.7%</div>
              <span className="text-[11px] text-slate-500 flex items-center mt-1">
                Garantía sólida 1er rango
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Tasa de Referencia</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">11.5%</div>
              <span className="text-[11px] text-slate-500 flex items-center mt-1">
                USD Anual en estructuración
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Propuestas Activas</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">1</div>
              <span className="text-[11px] text-amber-600 flex items-center mt-1">
                En revisión por el analista
              </span>
            </div>
          </div>
        )}

        {/* Listado de Operaciones */}
        {!isMensajes && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isOfertas ? 'Historial de Propuestas Financieras' : 'Operaciones Asignadas a tu Perfil'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Operaciones originadas y tasadas bajo los criterios de suscripción de {brandName}.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{opp.public_id}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">{opp.property_type}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">{opp.zone}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>
                        Monto: <strong className="text-slate-800">USD {opp.requested_amount.toLocaleString()}</strong>
                      </span>
                      <span>
                        Tasación: <strong className="text-slate-800">USD {opp.preliminary_valuation.toLocaleString()}</strong>
                      </span>
                      <span>
                        LTV: <strong className="text-emerald-700 font-bold">{opp.ltv}%</strong>
                      </span>
                      <span>
                        Plazo: <strong className="text-slate-800">{opp.term_months} meses</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <Button
                      size="sm"
                      className="text-xs shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => alert(`Enviando manifestación de interés para ${opp.public_id} a ${brandName}`)}
                    >
                      Presentar Propuesta <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensajería Directa */}
        {isMensajes && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Mensajes y Consultas de Operaciones</h2>
            <p className="text-xs text-slate-500">
              Comunicación directa y cifrada con el equipo analista y notarial de {brandName}.
            </p>
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No tenés mensajes pendientes en este momento.
            </div>
          </div>
        )}
      </div>
    </TenantInvestorLayout>
  );
};
