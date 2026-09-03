import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tenant, DEFAULT_TENANT, resolveTenant, applyTenantTheme } from '../lib/tenantService';

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

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant>(DEFAULT_TENANT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const pathname = location.pathname;

    resolveTenant(hostname, pathname).then((resolved) => {
      if (isMounted) {
        setTenant(resolved);
        applyTenantTheme(resolved.branding);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
