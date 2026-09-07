// ==============================================================================
// HIPOTECALY: Tenant Wizard Page (/demo/:tenantSlug/solicitar)
// Wizard de solicitud montado directamente en el contexto del Tenant
// ==============================================================================

import React, { useEffect } from 'react';
import { ApplicationWizard } from '../wizard/ApplicationWizard';
import { useTenant } from '../../contexts/TenantContext';

export const TenantWizardPage: React.FC = () => {
  const { tenant } = useTenant();

  useEffect(() => {
    const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
    document.title = `${brandName} | Solicitud de Financiación`;
  }, [tenant]);

  return <ApplicationWizard />;
};
