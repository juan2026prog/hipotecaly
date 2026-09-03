import React, { useState } from 'react';
import {
  Calculator,
  Info,
} from 'lucide-react';

interface CostBreakdownSimulatorProps {
  className?: string;
}

export const CostBreakdownSimulator: React.FC<CostBreakdownSimulatorProps> = ({ className = '' }) => {
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const rate = 12; // % anual estimado
  const termMonths = 36; // meses plazo estándar

  // Cálculos estimativos
  const notarialFee = Math.round(loanAmount * 0.025); // Arancel escribano est. 2.5%
  const appraisalFee = 450; // Tasación técnica
  const certificatesAndRegistry = 380; // Certificados registrales y timbres
  const adminCosts = Math.round(loanAmount * 0.01); // Gastos administrativos / gestión 1%
  const totalFormalization = notarialFee + appraisalFee + certificatesAndRegistry + adminCosts;
  const estimatedNetReceived = loanAmount - totalFormalization;
  const monthlyInterest = Math.round((loanAmount * (rate / 100)) / 12);

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden text-left text-xs text-slate-text select-none ${className}`}>
      {/* Header bar */}
      <div className="bg-navy p-5 text-white border-b border-navy-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-white">Transparencia Total de Costos Operativos</span>
            <p className="text-[11px] text-slate-300">
              Configurá cada arancel para que tus clientes conozcan de antemano el neto a recibir
            </p>
          </div>
        </div>

        <div className="px-3 py-1 bg-white/10 rounded-lg text-right border border-white/10">
          <span className="text-[9px] uppercase tracking-wider text-slate-300 block">Total Formalización</span>
          <span className="text-base font-extrabold text-brand-green">
            USD {totalFormalization.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Parámetros del Préstamo */}
        <div className="lg:col-span-6 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Simulador de Condiciones
          </span>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Monto solicitado</span>
              <span className="text-navy font-bold text-sm">USD {loanAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={30000}
              max={300000}
              step={5000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>USD 30.000</span>
              <span>USD 150.000</span>
              <span>USD 300.000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Tasa anual pactada</span>
              <span className="text-base font-bold text-navy mt-0.5 block">{rate}% anual</span>
              <span className="text-[10px] text-slate-400">USD {monthlyInterest.toLocaleString()} / mes interés</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Plazo de amortización</span>
              <span className="text-base font-bold text-navy mt-0.5 block">{termMonths} meses</span>
              <span className="text-[10px] text-slate-400">Cancelación anticipada libre</span>
            </div>
          </div>

          {/* Tarjeta de Resumen Neto a Recibir */}
          <div className="p-4 rounded-xl bg-brand-green-light/40 border border-brand-green/30 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block">
              Neto estimado a desembolsar al cliente
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-navy">
                USD {estimatedNetReceived.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                ({((estimatedNetReceived / loanAmount) * 100).toFixed(1)}% del capital)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              El cliente recibe el monto libre de deducciones iniciales o financia los gastos según la modalidad configurada.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Desglose de Gastos y Aranceles Notariales */}
        <div className="lg:col-span-6 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Desglose de Formalización Notarial y Registral
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Honorarios de Escribano Público</span>
                <span className="text-[10px] text-slate-500">Estudio de títulos, hipoteca y protocolización (est. 2.5%)</span>
              </div>
              <span className="font-bold text-navy text-xs">USD {notarialFee.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Tasación Técnica Profesional</span>
                <span className="text-[10px] text-slate-500">Inspección ocular del inmueble y valuación de garantía</span>
              </div>
              <span className="font-bold text-navy text-xs">USD {appraisalFee.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Certificados y Timbres Registrales</span>
                <span className="text-[10px] text-slate-500">Registro de la Propiedad Sección Inmobiliaria e Hipotecas</span>
              </div>
              <span className="font-bold text-navy text-xs">USD {certificatesAndRegistry.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Gastos Administrativos y Gestión</span>
                <span className="text-[10px] text-slate-500">Apertura de expediente y legajo digital</span>
              </div>
              <span className="font-bold text-navy text-xs">USD {adminCosts.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between px-1">
            <span className="font-bold text-navy text-xs">Costo Estimado de Formalización:</span>
            <span className="font-extrabold text-navy text-sm">USD {totalFormalization.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-slate-50 p-3.5 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>Aviso legal:</strong> Valores estimados. Los importes definitivos dependen de las condiciones de cada operación, el arancel notarial aplicable y la localidad del inmueble.
        </span>
      </div>
    </div>
  );
};
