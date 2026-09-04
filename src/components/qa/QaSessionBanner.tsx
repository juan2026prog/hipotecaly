// ==============================================================================
// HIPOTECALY: QA Session Banner
// Banner discreto y visible que acompaña la navegación en Modo QA / Inspección
// ==============================================================================

import React, { useState } from 'react';
import { ShieldCheck, LogOut, RefreshCw, ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { adminQaService } from '../../lib/adminQaService';

export const QaSessionBanner: React.FC = () => {
  const { isQaSession, qaSessionData, exitQaSession, userRole } = useAuth();
  const { tenant } = useTenant();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Solo mostrar si es sesión QA activa
  if (!isQaSession && !adminQaService.isQaActive()) {
    return null;
  }

  const currentRef = qaSessionData || adminQaService.getCurrentQaSessionRef();
  const activeRole = currentRef?.role || userRole || 'solicitante';
  const activeTenantName = currentRef?.tenantName || tenant.name || 'HIPOTECALY';

  const roleDisplayMap: Record<string, string> = {
    borrower: 'Solicitante',
    applicant: 'Solicitante',
    analyst: 'Operador / Backoffice',
    operator: 'Operador / Backoffice',
    tenant_admin: 'Admin de Tenant',
    lender: 'Prestamista',
    super_admin: 'Super Admin',
  };

  const handleQuickSwitch = async (targetRole: string, targetPath: string) => {
    setSwitching(true);
    setShowRoleMenu(false);
    try {
      await adminQaService.createSession({
        role: targetRole,
        tenantId: tenant.id,
        durationHours: 8,
      });
      window.location.assign(targetPath);
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar de rol QA');
      setSwitching(false);
    }
  };

  return (
    <div
      data-testid="qa-session-banner"
      className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-3 py-1.5 shadow-md text-xs border-b border-amber-500/40"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Identificador de Modo QA */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/30 font-mono font-black text-[10px] tracking-wider uppercase border border-white/20 text-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-300" />
            SESIÓN QA
          </span>
          <span className="font-semibold text-white/95">
            Rol: <span className="font-bold underline decoration-amber-300">{roleDisplayMap[activeRole] || activeRole}</span>
          </span>
          <span className="text-white/60">·</span>
          <span className="text-white/90 hidden sm:inline">
            Tenant: <span className="font-bold">{activeTenantName}</span>
          </span>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center space-x-2 ml-auto">
          
          {/* Selector desplegable de cambio de rol */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              disabled={switching}
              className="inline-flex items-center px-2.5 py-1 rounded bg-black/20 hover:bg-black/40 text-[11px] font-bold transition-all border border-white/10"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${switching ? 'animate-spin' : ''}`} />
              <span>Cambiar Rol</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white text-navy rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cambiar portal activo
                </div>
                <button
                  onClick={() => handleQuickSwitch('borrower', '/mi-cuenta')}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-xs font-semibold flex items-center justify-between"
                >
                  <span>Solicitante</span>
                  <span className="text-[10px] text-slate-400 font-mono">/mi-cuenta</span>
                </button>
                <button
                  onClick={() => handleQuickSwitch('analyst', '/app')}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-xs font-semibold flex items-center justify-between"
                >
                  <span>Operador Backoffice</span>
                  <span className="text-[10px] text-slate-400 font-mono">/app</span>
                </button>
                <button
                  onClick={() => handleQuickSwitch('lender', '/lender')}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-xs font-semibold flex items-center justify-between"
                >
                  <span>Prestamista</span>
                  <span className="text-[10px] text-slate-400 font-mono">/lender</span>
                </button>
                <button
                  onClick={() => handleQuickSwitch('tenant_admin', '/app')}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-xs font-semibold flex items-center justify-between"
                >
                  <span>Admin de Tenant</span>
                  <span className="text-[10px] text-slate-400 font-mono">/app</span>
                </button>
              </div>
            )}
          </div>

          {/* Botón Volver a Super Admin */}
          <button
            type="button"
            onClick={exitQaSession}
            className="inline-flex items-center px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-[11px] font-bold transition-all border border-white/20"
            title="Finalizar sesión QA y regresar a Super Admin"
          >
            <ArrowLeft className="w-3 h-3 mr-1.5" />
            <span>Super Admin</span>
          </button>

          {/* Botón Revocar / Salir */}
          <button
            type="button"
            onClick={async () => {
              if (currentRef?.sessionId) {
                await adminQaService.revokeSession(currentRef.sessionId).catch(() => {});
              }
              exitQaSession();
            }}
            className="inline-flex items-center px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-100 text-[11px] font-bold transition-all border border-rose-400/30"
            title="Revocar sesión QA"
          >
            <LogOut className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Revocar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
