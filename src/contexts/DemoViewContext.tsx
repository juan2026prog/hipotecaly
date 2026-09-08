// ==============================================================================
// HIPOTECALY: Demo View Context (DemoViewContext.tsx)
// Selector de vistas para recorrer todos los portales demo sin alterar roles en BD
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { platformModeService, PlatformMode } from '../lib/platformModeService';

export type DemoViewType = 'cliente' | 'inversor' | 'escribano' | 'backoffice' | 'tenant_admin';

export interface DemoViewOption {
  id: DemoViewType;
  label: string;
  description: string;
  route: string;
  simulatedRole: string;
}

export const DEMO_VIEW_OPTIONS: DemoViewOption[] = [
  {
    id: 'cliente',
    label: 'Cliente',
    description: 'Portal de solicitante, hipotecas, simulaciones y documentos',
    route: '/demo/estudio-nova/cliente',
    simulatedRole: 'borrower',
  },
  {
    id: 'inversor',
    label: 'Inversor',
    description: 'Portal de prestamista privado, oportunidades y ofertas',
    route: '/demo/estudio-nova/inversor',
    simulatedRole: 'lender',
  },
  {
    id: 'escribano',
    label: 'Escribano',
    description: 'Portal notarial, expedientes, escrituras y agenda de firmas',
    route: '/demo/estudio-nova/notary',
    simulatedRole: 'notary',
  },
  {
    id: 'backoffice',
    label: 'Backoffice',
    description: 'Gestión operativa de solicitudes, scoring IA y legajos',
    route: '/demo/estudio-nova/admin',
    simulatedRole: 'analyst',
  },
  {
    id: 'tenant_admin',
    label: 'Tenant Admin',
    description: 'Configuración comercial, whitelabel y branding Estudio Nova',
    route: '/demo/estudio-nova/admin/configuracion',
    simulatedRole: 'tenant_admin',
  },
];

interface DemoViewContextType {
  activeView: DemoViewType;
  currentOption: DemoViewOption;
  platformMode: PlatformMode;
  isTestMode: boolean;
  isUniversalTestSession: boolean;
  switchView: (viewId: DemoViewType) => void;
}

const DemoViewContext = createContext<DemoViewContextType | undefined>(undefined);

export const DemoViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSuperAdmin, isQaSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [platformMode, setPlatformMode] = useState<PlatformMode>(platformModeService.getCachedMode());
  const [activeView, setActiveView] = useState<DemoViewType>('cliente');

  // Suscribirse a cambios en platform_mode
  useEffect(() => {
    const unsubscribe = platformModeService.subscribe((settings) => {
      setPlatformMode(settings.platform_mode);
    });
    return () => unsubscribe();
  }, []);

  // Detectar si el usuario actual es la cuenta universal de pruebas
  const userEmail = user?.email?.toLowerCase() || '';
  const isUniversalUser =
    platformModeService.isUniversalTestUser(userEmail) ||
    Boolean(user?.app_metadata?.is_test_universal) ||
    Boolean(user?.user_metadata?.is_test_universal) ||
    (isQaSession && !isSuperAdmin);

  const isUniversalTestSession = isUniversalUser && platformMode === 'test';

  // Sincronizar activeView según la ruta actual
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/inversor') || path.includes('/lender')) {
      setActiveView('inversor');
    } else if (path.includes('/notary') || path.includes('/escriban') || path.includes('/notaria')) {
      setActiveView('escribano');
    } else if (path.includes('/admin/configuracion') || path.includes('/admin/whitelabel') || path.includes('/admin/organizacion')) {
      setActiveView('tenant_admin');
    } else if (path.includes('/admin') || path.includes('/app')) {
      setActiveView('backoffice');
    } else if (path.includes('/cliente') || path.includes('/mi-cuenta') || path.includes('/solicitar')) {
      setActiveView('cliente');
    }
  }, [location.pathname]);

  const switchView = (viewId: DemoViewType) => {
    const target = DEMO_VIEW_OPTIONS.find((v) => v.id === viewId);
    if (!target) return;
    setActiveView(viewId);
    navigate(target.route);
  };

  const currentOption = DEMO_VIEW_OPTIONS.find((v) => v.id === activeView) || DEMO_VIEW_OPTIONS[0];

  return (
    <DemoViewContext.Provider
      value={{
        activeView,
        currentOption,
        platformMode,
        isTestMode: platformMode === 'test',
        isUniversalTestSession,
        switchView,
      }}
    >
      {children}
    </DemoViewContext.Provider>
  );
};

export const useDemoView = (): DemoViewContextType => {
  const context = useContext(DemoViewContext);
  if (!context) {
    throw new Error('useDemoView debe ser usado dentro de un DemoViewProvider');
  }
  return context;
};
