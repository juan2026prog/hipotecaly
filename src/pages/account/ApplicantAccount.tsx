// ==============================================================================
// HIPOTECALY: Panel Cliente Reorganizado (3 Secciones Principales)
// 1. Datos personales · 2. Mis simulaciones · 3. Mis solicitudes
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  ClientPortalShell,
  ClientPortalTab,
} from '../../components/client/ClientPortalShell';
import { PersonalDataSection } from './PersonalDataSection';
import { MySimulationsSection } from './MySimulationsSection';
import { MyApplicationsSection } from './MyApplicationsSection';
import {
  clientPortalService,
  ClientPersonalData,
  ClientApplicationDetail,
} from '../../lib/clientPortalService';
import {
  clientSimulationService,
  SavedSimulation,
} from '../../lib/clientSimulationService';
import { KycStartModal } from '../../components/identity/KycStartModal';
import { KycReminderBanner } from '../../components/identity/KycVerificationCard';

export const ApplicantAccount: React.FC = () => {
  const { user, borrower } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  // Pestaña activa: 'datos' | 'simulaciones' | 'solicitudes' (por defecto: 'solicitudes')
  const [activeTab, setActiveTab] = useState<ClientPortalTab>('solicitudes');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Estados de Datos
  const [personalData, setPersonalData] = useState<ClientPersonalData | null>(null);
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [applications, setApplications] = useState<ClientApplicationDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del modal KYC
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isInitialPrompt, setIsInitialPrompt] = useState(false);

  // Carga unificada y consolidación de datos
  const loadData = useCallback(async () => {
    // 1. Consolidar cualquier simulación pendiente que venga del flujo pre-autenticación
    if (user?.id) {
      await clientSimulationService.consolidatePendingSimulation(user.id, tenant.id);
    }

    // 2. Cargar simulaciones guardadas reales
    const loadedSims = await clientSimulationService.getSavedSimulations(user?.id, tenant.id);
    setSimulations(loadedSims);

    // 3. Cargar datos personales reales
    const pData = await clientPortalService.getPersonalData(user, borrower);
    setPersonalData(pData);

    // 4. Cargar solicitudes reales
    const apps = await clientPortalService.getApplications(tenant.id, user?.id);
    setApplications(apps);

    setLoading(false);
  }, [user, borrower, tenant.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejo de URL Query Params y Location State
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as ClientPortalTab | null;
    const idParam = searchParams.get('id');

    if (tabParam && ['datos', 'simulaciones', 'solicitudes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    if (idParam) {
      setSelectedAppId(idParam);
      setActiveTab('solicitudes');
    }

    // Si viene de enviar una solicitud en el wizard
    const state = location.state as { publicId?: string; justSubmitted?: boolean } | null;
    if (state?.publicId) {
      setSelectedAppId(state.publicId);
      setActiveTab('solicitudes');
    }
  }, [location.search, location.state]);

  const handleTabChange = (tab: ClientPortalTab) => {
    setActiveTab(tab);
    if (tab !== 'solicitudes') {
      setSelectedAppId(null);
    }
  };

  // Evaluar despliegue automático del modal inicial de KYC
  useEffect(() => {
    if (!loading && personalData && user?.id) {
      const isNotStarted =
        personalData.kycStatus === 'not_started' ||
        (personalData as any).kycStatus === 'NOT_STARTED' ||
        !personalData.kycStatus;

      const sessionDismissedKey = `hipotecaly_kyc_prompt_session_${user.id}`;
      const hasDismissedInSession = sessionStorage.getItem(sessionDismissedKey) === 'true';

      if (isNotStarted && !hasDismissedInSession) {
        setIsInitialPrompt(true);
        setIsKycModalOpen(true);
      }
    }
  }, [loading, personalData, user?.id]);

  const handlePostponeKyc = () => {
    if (user?.id) {
      const nowIso = new Date().toISOString();
      sessionStorage.setItem(`hipotecaly_kyc_prompt_session_${user.id}`, 'true');
      localStorage.setItem(`hipotecaly_kyc_prompt_dismissed_at_${user.id}`, nowIso);
    }
    setIsKycModalOpen(false);
  };

  const handleStartManualKyc = () => {
    setIsInitialPrompt(false);
    setIsKycModalOpen(true);
  };

  if (loading || !personalData) {
    return (
      <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#102d49] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 font-mono">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ClientPortalShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        simulationsCount={simulations.length}
        applicationsCount={applications.length}
      >
        {/* Banner Persistente de Recordatorio de Identidad (no invasivo) */}
        <div className="mb-6">
          <KycReminderBanner
            kycStatus={personalData.kycStatus}
            onStartKyc={handleStartManualKyc}
            applicantName={`${personalData.firstName} ${personalData.lastName}`}
          />
        </div>

        {/* 1. SECCIÓN DATOS PERSONALES */}
        {activeTab === 'datos' && (
          <PersonalDataSection
            data={personalData}
            onRefresh={loadData}
          />
        )}

        {/* 2. SECCIÓN MIS SIMULACIONES */}
        {activeTab === 'simulaciones' && (
          <MySimulationsSection
            simulations={simulations}
            onRefresh={loadData}
            onOpenApplication={(pubId) => {
              setSelectedAppId(pubId);
              setActiveTab('solicitudes');
            }}
          />
        )}

        {/* 3. SECCIÓN MIS SOLICITUDES */}
        {activeTab === 'solicitudes' && (
          <MyApplicationsSection
            applications={applications}
            selectedAppId={selectedAppId}
            onSelectApp={setSelectedAppId}
            onRefresh={loadData}
          />
        )}
      </ClientPortalShell>

      {/* Modal KYC (Automático al entrar o Manual desde CTA) */}
      <KycStartModal
        isOpen={isKycModalOpen}
        isInitialPrompt={isInitialPrompt}
        caseId="user-portal-kyc"
        userId={user?.id}
        applicantName={`${personalData.firstName} ${personalData.lastName}`}
        onClose={() => setIsKycModalOpen(false)}
        onPostpone={handlePostponeKyc}
        onSessionCreated={() => {
          setIsKycModalOpen(false);
          loadData();
        }}
      />
    </>
  );
};
