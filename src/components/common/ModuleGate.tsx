import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { hasTenantEntitlement, getModuleById } from '../../lib/moduleCatalogService';
import { Button } from '../ui/Button';

interface ModuleGateProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Hook para consultar si el tenant actual tiene entitlement sobre un módulo
 */
export function useModuleEntitlement(moduleId: string): {
  hasAccess: boolean;
  loading: boolean;
} {
  const { tenant } = useTenant();
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    hasTenantEntitlement(tenant.id, moduleId).then((entitled) => {
      if (isMounted) {
        setHasAccess(entitled);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [tenant.id, moduleId]);

  return { hasAccess, loading };
}

/**
 * Componente que envuelve secciones protegidas por entitlement de módulos SaaS
 */
export const ModuleGate: React.FC<ModuleGateProps> = ({ moduleId, children, fallback }) => {
  const { hasAccess, loading } = useModuleEntitlement(moduleId);
  const mod = getModuleById(moduleId);

  if (loading) {
    return <div className="p-4 text-xs text-slate-400 animate-pulse">Verificando suscripción modular...</div>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Fallback por defecto con aviso de Upgrade / Add-On
  return (
    <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 text-left space-y-4 shadow-xl">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
            MÓDULO ADICIONAL (ADD-ON)
          </span>
          <h4 className="text-base font-bold text-white">{mod?.name || 'Módulo Protegido'}</h4>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
        {mod?.description ||
          'Este módulo no está habilitado actualmente en el plan de tu organización. Podés solicitar su activación en caliente.'}
      </p>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Link to={`/contacto?demo=true&modulo=${moduleId}`}>
          <Button variant="primary" size="sm" className="font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Solicitar Activación del Módulo
          </Button>
        </Link>
        <Link to="/saas/modulos">
          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
            Ver Catálogo Completo <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
