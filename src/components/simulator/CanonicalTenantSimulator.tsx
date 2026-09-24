// ==============================================================================
// HIPOTECALY: Canonical Tenant Simulator Component
// Simulador canónico real de Hipotecaly para integración embebida y páginas de simulación
// Conectado directamente a las reglas crediticias reales del tenant
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  Calculator,
  ShieldCheck,
} from 'lucide-react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Button } from '../ui/Button';
import {
  getTenantLendingRules,
  subscribeToTenantRules,
  TenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
} from '../../lib/tenantRulesService';
import { isDemoMode } from '../../lib/demoControl';
import { DemoCommercialGateModal } from '../demo/DemoCommercialGateModal';

export interface CanonicalTenantSimulatorProps {
  tenantId?: string;
  tenantSlug?: string;
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  sourceMode?: 'embed' | 'button' | 'hosted' | 'full';
  source?: string;
  initialPropertyValue?: number;
  initialLoanAmount?: number;
  initialTermMonths?: number;
  initialRepaymentMode?: 'solo_intereses' | 'amortizable';
  compact?: boolean;
  className?: string;
  showBreakdown?: boolean;
  onContinue?: (params: {
    requestedAmount: number;
    propertyValue: number;
    termMonths: number;
    repaymentMode: 'solo_intereses' | 'amortizable';
  }) => void;
}

export const CanonicalTenantSimulator: React.FC<CanonicalTenantSimulatorProps> = ({
  tenantId = 'd0000000-0000-0000-0000-000000000001',
  tenantSlug = 'estudio-nova',
  brandName = 'Estudio Nova',
  primaryColor = '#173a5e',
  secondaryColor = '#102d49',
  accentColor = '#f4b43b',
  sourceMode = 'embed',
  source = 'embed_demo',
  initialPropertyValue = 200000,
  initialLoanAmount = 70000,
  initialTermMonths = 36,
  initialRepaymentMode = 'solo_intereses',
  className = '',
  showBreakdown = true,
  onContinue,
}) => {
  const navigate = useNavigate();
  const isDemo = isDemoMode({ organizationId: tenantId, organizationSlug: tenantSlug, pathname: window?.location?.pathname });
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);

  const [propertyValue, setPropertyValue] = useState<number>(initialPropertyValue);
  const [loanAmount, setLoanAmount] = useState<number>(initialLoanAmount);
  const [termMonths, setTermMonths] = useState<number>(initialTermMonths);
  const [repaymentMode, setRepaymentMode] = useState<'solo_intereses' | 'amortizable'>(initialRepaymentMode);

  useEffect(() => {
    if (tenantId) {
      getTenantLendingRules(tenantId).then((r) => setRules(r));
      const unsubscribe = subscribeToTenantRules((updatedOrgId, updatedRules) => {
        if (updatedOrgId === tenantId) {
          setRules(updatedRules);
        }
      });
      return () => unsubscribe();
    }
  }, [tenantId]);

  // Cálculos crediticios canónicos
  const financedPercentage = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  const isOverPercentage = financedPercentage > rules.maxFinancedPercentage;
  const isOverAmount = loanAmount > rules.maxLoanAmount;
  const isBelowMinAmount = loanAmount < rules.minLoanAmount;

  const annualRate = rules.defaultRate / 100;
  let estimatedMonthlyPayment = 0;
  if (repaymentMode === 'solo_intereses') {
    estimatedMonthlyPayment = Math.round((loanAmount * annualRate) / 12);
  } else {
    const monthlyRate = annualRate / 12;
    const n = termMonths;
    estimatedMonthlyPayment = Math.round(
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n))) / (Math.pow(1 + monthlyRate, n) - 1)
    );
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverPercentage || isOverAmount || isBelowMinAmount) return;

    if (onContinue) {
      onContinue({
        requestedAmount: loanAmount,
        propertyValue: propertyValue,
        termMonths: termMonths,
        repaymentMode: repaymentMode,
      });
      return;
    }

    // En demo pública, interceptar con el gate comercial unificado
    if (isDemo) {
      setGateModalOpen(true);
      return;
    }

    // En producción, continuar hacia el flujo real
    const query = new URLSearchParams({
      monto: loanAmount.toString(),
      valor_propiedad: propertyValue.toString(),
      plazo: termMonths.toString(),
      modalidad: repaymentMode,
      source: source,
      source_mode: sourceMode,
    }).toString();

    navigate(`/demo/${tenantSlug}/solicitar?${query}`, {
      state: {
        requestedAmount: loanAmount,
        propertyValue: propertyValue,
        termMonths: termMonths,
        repaymentMode: repaymentMode,
        organizationId: tenantId,
        source: source,
        sourceMode: sourceMode,
      },
    });
  };

  return (
    <div
      data-testid="canonical-tenant-simulator"
      className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left ${className}`}
    >
      {/* Header del Simulador */}
      <div
        className="px-6 py-4 text-white flex items-center justify-between border-b"
        style={{ backgroundColor: primaryColor, borderColor: `${secondaryColor}80` }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-serif font-black text-sm text-slate-900 shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <Calculator className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-200 block">
              Simulador Hipotecaly Embebido
            </span>
            <h3 className="text-base font-serif font-bold text-white leading-tight">
              {brandName} · Cotización en Vivo
            </h3>
          </div>
        </div>
        <span className="text-[10px] bg-white/15 text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider">
          MOTOR REAL
        </span>
      </div>

      {/* Formulario */}
      <form onSubmit={handleContinue} className="p-6 space-y-5">
        <div>
          <CurrencyInput
            label="Valor estimado del inmueble (USD)"
            value={propertyValue}
            onChange={(val) => setPropertyValue(val)}
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Inmueble en garantía</span>
            <span className="font-semibold text-slate-700">Tasación técnica de referencia</span>
          </div>
        </div>

        <div>
          <CurrencyInput
            label="Monto solicitado (USD)"
            value={loanAmount}
            onChange={(val) => setLoanAmount(val)}
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Mín: USD {rules.minLoanAmount.toLocaleString()}</span>
            <span>Máx: USD {rules.maxLoanAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Plazo de Financiación</label>
            <select
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {rules.availableTerms.map((t) => (
                <option key={t} value={t}>
                  {t} meses ({t / 12} {t === 12 ? 'año' : 'años'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad de Pago</label>
            <select
              value={repaymentMode}
              onChange={(e) => setRepaymentMode(e.target.value as 'solo_intereses' | 'amortizable')}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="solo_intereses">Solo Intereses (Bullet)</option>
              <option value="amortizable">Cuota Amortizable</option>
            </select>
          </div>
        </div>

        {/* Validaciones en tiempo real */}
        {isOverPercentage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              El porcentaje financiado ({financedPercentage.toFixed(1)}%) supera el límite máximo permitido ({rules.maxFinancedPercentage}%).
            </span>
          </div>
        )}

        {isOverAmount && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              El monto solicitado supera el límite máximo configurado de USD {rules.maxLoanAmount.toLocaleString()}.
            </span>
          </div>
        )}

        {isBelowMinAmount && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              El monto mínimo a financiar es de USD {rules.minLoanAmount.toLocaleString()}.
            </span>
          </div>
        )}

        {/* Resumen y desglose calculado */}
        {showBreakdown && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Porcentaje sobre el inmueble (LTV):</span>
              <strong className={`font-mono ${isOverPercentage ? 'text-amber-600' : 'text-slate-800'}`}>
                {financedPercentage.toFixed(1)}% (Tope {rules.maxFinancedPercentage}%)
              </strong>
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Tasa anual referencial (TEA):</span>
              <strong className="font-mono text-slate-800">{rules.defaultRate}% fija USD</strong>
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Estructura de amortización:</span>
              <span className="font-semibold text-slate-800">
                {repaymentMode === 'solo_intereses' ? 'Interés mensual + capital al vencimiento' : 'Cuota mensual amortizable'}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-900">Cuota mensual estimada:</span>
              <span className="text-2xl font-black font-mono text-slate-900" style={{ color: primaryColor }}>
                USD {estimatedMonthlyPayment.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Botón de Acción Principal */}
        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={isOverPercentage || isOverAmount || isBelowMinAmount}
          className="w-full text-white font-bold py-3.5 shadow-md uppercase tracking-wider flex items-center justify-center space-x-2"
          style={{ backgroundColor: primaryColor }}
        >
          <span>CONTINUAR SOLICITUD</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <div className="text-center pt-1">
          <span className="text-[10px] text-slate-500 inline-flex items-center">
            <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1" />
            Trámite 100% digital respaldado por {brandName} · Sin costo de apertura
          </span>
        </div>
      </form>

      {/* Modal de Gate Comercial para Demo Pública */}
      <DemoCommercialGateModal
        isOpen={gateModalOpen}
        onClose={() => setGateModalOpen(false)}
        source={sourceMode === 'embed' ? 'embed-demo' : sourceMode === 'button' ? 'button-demo' : 'simulador'}
        tenantSlug={tenantSlug}
        brandName={brandName}
        simulationSummary={{
          requestedAmount: loanAmount,
          propertyValue: propertyValue,
          termMonths: termMonths,
          monthlyPayment: estimatedMonthlyPayment,
        }}
      />
    </div>
  );
};
