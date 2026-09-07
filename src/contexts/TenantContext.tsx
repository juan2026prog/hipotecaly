import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Tenant,
  DEFAULT_TENANT,
  NOVA_TENANT,
  NOT_FOUND_TENANT,
  getAllRegisteredTenants,
  resolveTenant,
  applyTenantTheme,
} from '../lib/tenantService';

interface TenantContextType {
  tenant: Tenant;
  loading: boolean;
  setTenant: (tenant: Tenant) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: DEFAULT_TENANT,
  loading: false,
  setTenant: () => {},
});

export function getInitialTenant(): Tenant {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const search = window.location.search;
    if (pathname.startsWith('/demo/estudio-nova') || pathname.startsWith('/demo/nova') || pathname === '/demo') {
      return NOVA_TENANT;
    }
    if (search) {
      const params = new URLSearchParams(search);
      const s = params.get('source') || params.get('tenant') || params.get('org');
      if (s && (s.toLowerCase().includes('nova') || s.toLowerCase() === 'estudio_nova')) {
        return NOVA_TENANT;
      }
    }
    const orgMatch = pathname.match(/^\/org\/([^/]+)/);
    if (orgMatch && orgMatch[1]) {
      const slug = orgMatch[1].toLowerCase();
      const all = getAllRegisteredTenants();
      const found = all.find((t) => t.slug === slug);
      if (found) return found;
      return NOT_FOUND_TENANT;
    }
  }
  return DEFAULT_TENANT;
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant>(getInitialTenant);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const pathname = location.pathname;
    const search = location.search;

    setLoading(true);
    resolveTenant(hostname, pathname, search).then((resolved) => {
      if (isMounted) {
        setTenant(resolved);
        applyTenantTheme(resolved.branding);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, location.search]);

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
