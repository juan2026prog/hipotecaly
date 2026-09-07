// ==============================================================================
// HIPOTECALY: Modal de Detalle y Administración de Cliente
// Configuración de branding, módulos, reglas financieras y permisos
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Tenant } from '../../lib/tenantService';
import { getTenantModules, setTenantModuleEnabled, TenantModuleKey, DEFAULT_MODULES_MAP } from '../../lib/tenantModulesService';
import { getTenantLendingRules, updateTenantLendingRules, TenantLendingRules, DEFAULT_NOVA_LENDING_RULES } from '../../lib/tenantRulesService';

interface SuperAdminTenantDetailModalProps {
  tenant: Tenant | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const SuperAdminTenantDetailModal: React.FC<SuperAdminTenantDetailModalProps> = ({
  tenant,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'branding' | 'modulos' | 'reglas' | 'usuarios' | 'integraciones' | 'uso' | 'auditoria'>('resumen');
  const [modules, setModules] = useState<Record<TenantModuleKey, boolean>>(DEFAULT_MODULES_MAP);
  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (tenant?.id) {
      getTenantModules(tenant.id).then(setModules);
      getTenantLendingRules(tenant.id).then(setRules);
    }
  }, [tenant?.id]);

  if (!tenant) return null;

  const handleToggleModule = async (key: TenantModuleKey) => {
    const nextVal = !modules[key];
    setModules({ ...modules, [key]: nextVal });
    await setTenantModuleEnabled(tenant.id, key, nextVal);
    if (onUpdated) onUpdated();
  };

  const handleSaveRules = async () => {
    setIsSaving(true);
    try {
      await updateTenantLendingRules(tenant.id, rules);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onUpdated) onUpdated();
    } finally {
      setIsSaving(false);
    }
  };

  const moduleList: { key: TenantModuleKey; name: string; desc: string }[] = [
    { key: 'application_module_enabled', name: 'Solicitudes Digitales', desc: 'Recepción y validación online de solicitudes' },
    { key: 'simulator_enabled', name: 'Simulador Crediticio', desc: 'Calculadora de financiación para clientes' },
    { key: 'client_portal_enabled', name: 'Portal del Solicitante', desc: 'Autogestión de expedientes y legajo' },
    { key: 'staff_portal_enabled', name: 'Backoffice Operativo', desc: 'Bandeja de gestión para analistas y escribanos' },
    { key: 'documents_enabled', name: 'Documentos y Formularios', desc: 'Generación, autollenado, versionado y gestión de documentos' },
    { key: 'ai_enabled', name: 'Inteligencia Artificial', desc: 'Análisis asistido de tasaciones y documentación' },
    { key: 'valuations_enabled', name: 'Módulo de Tasaciones', desc: 'Peritajes técnicos y cálculo de rangos' },
    { key: 'signatures_enabled', name: 'Firma Digital Notarial', desc: 'Firma electrónica e integración notarial' },
    { key: 'investor_portal_enabled', name: 'Red Privada de Inversores', desc: 'Portal exclusivo para inversores del cliente' },
    { key: 'protected_contact_enabled', name: 'Protección de Contactos', desc: 'Privacidad y protección anti-bypass' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#071322]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header Modal */}
        <div className="p-5 border-b border-[#152E4D] flex items-center justify-between bg-[#071322]/80">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm"
              style={{ backgroundColor: tenant.branding?.primary_color || '#102d49' }}
            >
              {tenant.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white">{tenant.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {tenant.status === 'active' ? 'ACTIVO' : 'SUSPENDIDO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">/demo/{tenant.slug} • {tenant.custom_domain || 'Subdominio estándar'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`/demo/${tenant.slug}/admin`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#152E4D] text-emerald-400 hover:bg-[#1E3A5F] flex items-center"
            >
              Abrir Backoffice <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[#152E4D] px-4 overflow-x-auto text-xs font-bold bg-[#071322]">
          {[
            { id: 'resumen', label: 'Resumen' },
            { id: 'branding', label: 'Marca & Dominio' },
            { id: 'modulos', label: 'Servicios Activos' },
            { id: 'reglas', label: 'Reglas de Crédito' },
            { id: 'usuarios', label: 'Usuarios' },
            { id: 'integraciones', label: 'Integraciones' },
            { id: 'uso', label: 'Uso & Consumo' },
            { id: 'auditoria', label: 'Actividad' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-left">
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Configuración guardada exitosamente en tiempo real.</span>
            </div>
          )}

          {/* TAB: RESUMEN */}
          {activeTab === 'resumen' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#071322] border border-[#152E4D] space-y-2">
                  <span className="text-slate-400 font-semibold block">Información General</span>
                  <div><strong>Cliente:</strong> {tenant.name}</div>
                  <div><strong>Ruta de acceso:</strong> <span className="text-emerald-400">/demo/{tenant.slug}</span></div>
                  <div><strong>Plan contratado:</strong> {tenant.is_white_label ? 'Marca Blanca (White Label)' : 'Plan Estándar'}</div>
                  <div><strong>Estado:</strong> {tenant.status === 'active' ? '🟢 Operativo' : '🔴 Inactivo'}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#071322] border border-[#152E4D] space-y-2">
                  <span className="text-slate-400 font-semibold block">Seguridad y Aislamiento</span>
                  <div><strong>Aislamiento de datos:</strong> <span className="text-emerald-400 font-bold">🟢 Protegido</span></div>
                  <div><strong>Red de Inversores:</strong> {modules.investor_portal_enabled ? 'Habilitada' : 'Inactiva'}</div>
                  <div><strong>Credenciales seguras:</strong> Encriptadas en bóveda</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Nombre Público de Marca</label>
                  <input
                    type="text"
                    defaultValue={tenant.branding?.public_name || tenant.name}
                    className="w-full p-2.5 rounded-lg bg-[#071322] border border-[#152E4D] text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Color Primario</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border border-slate-600"
                      style={{ backgroundColor: tenant.branding?.primary_color || '#102d49' }}
                    />
                    <input
                      type="text"
                      defaultValue={tenant.branding?.primary_color || '#102d49'}
                      className="w-full p-2.5 rounded-lg bg-[#071322] border border-[#152E4D] text-slate-100 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Dominio Personalizado</label>
                  <input
                    type="text"
                    defaultValue={tenant.custom_domain || ''}
                    placeholder="credito.estudionova.uy"
                    className="w-full p-2.5 rounded-lg bg-[#071322] border border-[#152E4D] text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Insignia de Plataforma</label>
                  <select className="w-full p-2.5 rounded-lg bg-[#071322] border border-[#152E4D] text-slate-100">
                    <option value="minimal">Minimalista (Recomendado)</option>
                    <option value="hidden">Oculto (Plan Enterprise)</option>
                    <option value="standard">Estándar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MODULOS */}
          {activeTab === 'modulos' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {moduleList.map((m) => {
                  const isEnabled = modules[m.key] ?? false;
                  return (
                    <div
                      key={m.key}
                      className="p-3.5 rounded-xl bg-[#071322] border border-[#152E4D] flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-slate-200 block">{m.name}</strong>
                        <span className="text-[11px] text-slate-400">{m.desc}</span>
                      </div>
                      <button
                        onClick={() => handleToggleModule(m.key)}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition ${
                          isEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        <span>{isEnabled ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: REGLAS */}
          {activeTab === 'reglas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Porcentaje de Financiación Máx (%)</label>
                  <input
                    type="number"
                    value={rules.maxFinancedPercentage}
                    onChange={(e) => setRules({ ...rules, maxFinancedPercentage: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-[#071322] border border-[#152E4D] text-slate-100 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Porcentaje máximo sobre el valor del inmueble</span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Monto Máximo (USD)</label>
                  <input
                    type="number"
                    value={rules.maxLoanAmount}
                    onChange={(e) => setRules({ ...rules, maxLoanAmount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-[#071322] border border-[#152E4D] text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Plazo Máximo (meses)</label>
                  <input
                    type="number"
                    value={rules.maxTermMonths}
                    onChange={(e) => setRules({ ...rules, maxTermMonths: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-[#071322] border border-[#152E4D] text-slate-100 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#152E4D] flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveRules}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Reglas de Crédito'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB: USUARIOS */}
          {activeTab === 'usuarios' && (
            <div className="space-y-3">
              <div className="divide-y divide-[#152E4D] border border-[#152E4D] rounded-xl bg-[#071322]">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200 block">Dr. Alejandro Méndez</strong>
                    <span className="text-slate-400 text-[11px]">operaciones@estudionova.uy</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Administrador del cliente
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200 block">Esc. Mariana Torres</strong>
                    <span className="text-slate-400 text-[11px]">notaria@estudionova.uy</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    Escribano
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INTEGRACIONES */}
          {activeTab === 'integraciones' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#071322] border border-[#152E4D] space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200">Firma Digital</strong>
                    <span className="text-emerald-400 font-bold">🟢 Operativo</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Firma electrónica con validez Ley N° 18.600</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#071322] border border-[#152E4D] space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200">Identidad y KYC</strong>
                    <span className="text-emerald-400 font-bold">🟢 Configurado</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Validación de identidad y Cédula de Identidad</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USO */}
          {activeTab === 'uso' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#071322] border border-[#152E4D]">
                <span className="text-slate-400 block text-[11px]">Solicitudes Totales</span>
                <span className="text-xl font-extrabold text-white mt-1 block">12</span>
              </div>
              <div className="p-4 rounded-xl bg-[#071322] border border-[#152E4D]">
                <span className="text-slate-400 block text-[11px]">Documentos y Formularios</span>
                <span className="text-xl font-extrabold text-white mt-1 block">38</span>
              </div>
              <div className="p-4 rounded-xl bg-[#071322] border border-[#152E4D]">
                <span className="text-slate-400 block text-[11px]">Firmas Realizadas</span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1 block">8</span>
              </div>
              <div className="p-4 rounded-xl bg-[#071322] border border-[#152E4D]">
                <span className="text-slate-400 block text-[11px]">Casos de IA Utilizados</span>
                <span className="text-xl font-extrabold text-teal-400 mt-1 block">8 / 100</span>
              </div>
            </div>
          )}

          {/* TAB: AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-[#071322] border border-[#152E4D] flex justify-between items-center">
                <span>Se actualizaron las reglas de crédito (Porcentaje de financiación 35%)</span>
                <span className="text-slate-400">Hace 2 horas</span>
              </div>
              <div className="p-3 rounded-lg bg-[#071322] border border-[#152E4D] flex justify-between items-center">
                <span>Se generó formulario para la solicitud HPT-00124</span>
                <span className="text-slate-400">Ayer</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#152E4D] bg-[#071322]/90 flex justify-end space-x-3">
          <Button variant="outline" size="sm" onClick={onClose} className="border-[#1E3A5F] text-slate-300">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
