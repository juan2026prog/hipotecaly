import React from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Compass,
  FileCheck,
  TrendingUp,
  Settings,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardMockup: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="bg-white rounded-card shadow-2xl border border-slate-200 overflow-hidden text-left text-xs text-slate-text select-none">
      {/* Window title bar mockup */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-slate-500 pl-2">hipotecaly.uy/app</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
          <span>En vivo</span>
        </div>
      </div>

      <div className="flex min-h-[380px] md:min-h-[460px]">
        {/* Navy Sidebar */}
        <aside className={`${compact ? 'w-14' : 'w-48 md:w-52'} bg-navy text-white flex flex-col justify-between py-4 px-3 shrink-0`}>
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-2 px-2 pb-4 mb-3 border-b border-navy-border/60">
              <div className="w-6 h-6 rounded-md bg-brand-green flex items-center justify-center font-bold text-white text-xs">
                H
              </div>
              {!compact && (
                <div>
                  <span className="font-bold text-sm tracking-wide text-white block leading-none">HIPOTECALY</span>
                  <span className="text-[9px] text-slate-300 tracking-wider uppercase block mt-0.5">Backoffice</span>
                </div>
              )}
            </div>

            {/* Nav Items */}
            <nav className="space-y-1">
              <div className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg bg-white/10 text-white font-medium">
                <LayoutDashboard className="w-4 h-4 text-brand-green shrink-0" />
                {!compact && <span>Dashboard</span>}
              </div>
              <div className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <FileText className="w-4 h-4 shrink-0" />
                {!compact && <span>Solicitudes</span>}
              </div>
              <div className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <FolderKanban className="w-4 h-4 shrink-0" />
                {!compact && <span>Expedientes</span>}
              </div>
              <div className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <Users className="w-4 h-4 shrink-0" />
                {!compact && <span>Clientes</span>}
              </div>
              <div className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <Compass className="w-4 h-4 shrink-0" />
                {!compact && <span>Tasaciones</span>}
              </div>
              <div className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <FileCheck className="w-4 h-4 shrink-0" />
                {!compact && <span>Documentos</span>}
              </div>
            </nav>
          </div>

          {/* User pill */}
          {!compact && (
            <div className="pt-3 border-t border-navy-border/60 px-2 flex items-center justify-between text-[11px] text-slate-300">
              <div>
                <p className="font-semibold text-white leading-tight">Estudio Demo</p>
                <p className="text-[10px] text-slate-400">Administrador</p>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 bg-slate-bg p-4 md:p-5 overflow-hidden">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3 mb-4">
            <div className="bg-white p-3 rounded-xl border border-slate-border shadow-sm">
              <p className="text-slate-muted text-[11px] font-medium">Solicitudes</p>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-lg md:text-xl font-bold text-navy">128</span>
                <span className="text-[10px] text-brand-green font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" />+12%
                </span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-border shadow-sm">
              <p className="text-slate-muted text-[11px] font-medium">En análisis</p>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-lg md:text-xl font-bold text-navy">45</span>
                <span className="text-[10px] text-brand-green font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" />+8%
                </span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-border shadow-sm">
              <p className="text-slate-muted text-[11px] font-medium">Aprobadas</p>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-lg md:text-xl font-bold text-navy">32</span>
                <span className="text-[10px] text-brand-green font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" />+15%
                </span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-border shadow-sm">
              <p className="text-slate-muted text-[11px] font-medium">Desembolsadas</p>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-lg md:text-xl font-bold text-navy">18</span>
                <span className="text-[10px] text-brand-green font-semibold flex items-center">
                  <ArrowUpRight className="w-3 h-3" />+20%
                </span>
              </div>
            </div>
          </div>

          {/* Center 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Recent Requests Table */}
            <div className="lg:col-span-7 bg-white p-3.5 rounded-xl border border-slate-border shadow-sm">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                <span className="font-bold text-navy text-xs">Solicitudes recientes</span>
                <span className="text-brand-green text-[11px] font-medium hover:underline flex items-center cursor-pointer">
                  Ver todas <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'María López', status: 'En análisis', amount: 'USD 80.000', badgeColor: 'bg-amber-50 text-amber-700' },
                  { name: 'Pedro González', status: 'Aprobada', amount: 'USD 120.000', badgeColor: 'bg-emerald-50 text-brand-green-dark' },
                  { name: 'Ana Rodríguez', status: 'En análisis', amount: 'USD 70.000', badgeColor: 'bg-amber-50 text-amber-700' },
                  { name: 'Juan Martínez', status: 'Aprobada', amount: 'USD 95.000', badgeColor: 'bg-emerald-50 text-brand-green-dark' },
                  { name: 'Lucía Fernández', status: 'En análisis', amount: 'USD 60.000', badgeColor: 'bg-amber-50 text-amber-700' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 last:border-0">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${item.badgeColor}`}>
                      {item.status}
                    </span>
                    <span className="font-bold text-navy">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart & Total Volume */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-navy text-xs">Solicitudes por mes</span>
                  <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
                </div>
                {/* SVG Curve Chart */}
                <div className="h-20 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 200 70" preserveAspectRatio="none">
                    <path
                      d="M 10 55 Q 40 40 70 48 T 130 25 T 190 12"
                      fill="none"
                      stroke="#2DA674"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Points */}
                    <circle cx="10" cy="55" r="3" fill="#2DA674" />
                    <circle cx="70" cy="48" r="3" fill="#2DA674" />
                    <circle cx="130" cy="25" r="3" fill="#2DA674" />
                    <circle cx="190" cy="12" r="3" fill="#2DA674" />
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>Ene</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jul</span>
                  <span>Ago</span>
                </div>
              </div>

              {/* Total volume card */}
              <div className="bg-navy p-3.5 rounded-xl text-white shadow-sm border border-navy-border">
                <p className="text-slate-300 text-[10px] font-medium">Monto total financiado</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-base font-bold tracking-tight text-white">USD 12.540.000</span>
                  <span className="text-[10px] text-brand-green font-semibold">+18%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-brand-green h-full rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
