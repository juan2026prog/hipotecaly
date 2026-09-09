// ==============================================================================
// HIPOTECALY: Landing White-Label Unificada de Organizaciones
// Reutiliza la plantilla maestra de EstudioNovaPage conectada a TenantContext
// ==============================================================================

import React from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { TenantNotFoundPage } from '../TenantNotFoundPage';
import { EstudioNovaPage } from '../demo/nova/EstudioNovaPage';

export const GenericWhiteLabelLanding: React.FC = () => {
  const { tenant, loading } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-[#173a5e] rounded-full animate-spin" />
      </div>
    );
  }

  if (tenant.status === 'not_found') {
    return <TenantNotFoundPage />;
  }

  return <EstudioNovaPage />;
};
