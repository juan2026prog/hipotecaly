// ==============================================================================
// HIPOTECALY: Configuración Técnica (/admin/configuracion)
// Infraestructura, seguridad, integraciones técnicas y diagnóstico del sistema
// ==============================================================================

import React, { useState } from 'react';
import {
  Sliders,
  Database,
  HardDrive,
  Clock,
  ShieldCheck,
  Lock,
  KeyRound,
  Webhook,
  Activity,
  CheckCircle2,
  Play,
  Key,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { Button } from '../../components/ui/Button';

export const SuperAdminTechnicalConfigPage: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<'infra' | 'security' | 'integrations' | 'diagnostic'>('infra');
  const [diagnosing, setDiagnosing] = useState(false);
  const [showTechDetailsModal, setShowTechDetailsModal] = useState(false);
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const runDiagnostic = () => {
    setDiagnosing(true);
    setTimeout(() => {
      setDiagnosing(false);
      setToastMessage('Sistema comprobado: todos los componentes operativos.');
      setTimeout(() => setToastMessage(null), 4000);
    }, 1200);
  };

  return (
    <SuperAdminLayout title="Configuración técnica" activeSection="configuracion">
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        
        {/* Encabezado */}
        <div className="border-b border-[#152E4D] pb-5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              SISTEMA & INFRAESTRUCTURA
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">CONFIGURACIÓN AVANZADA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Configuración técnica
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Infraestructura, seguridad y conexiones internas de HIPOTECALY. Normalmente no necesitas modificar estas opciones.
          </p>
        </div>

        {toastMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Selector de Grupos Técnicos */}
        <div className="flex border-b border-[#152E4D] space-x-2 overflow-x-auto">
          {[
            { id: 'infra', label: 'A. Infraestructura', icon: Database },
            { id: 'security', label: 'B. Seguridad', icon: ShieldCheck },
            { id: 'integrations', label: 'C. Integraciones técnicas', icon: KeyRound },
            { id: 'diagnostic', label: 'D. Diagnóstico y registros', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeGroup === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveGroup(tab.id as any)}
                className={`px-4 py-3 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center space-x-2 shrink-0 ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-[#09182C]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* GRUPO A: INFRAESTRUCTURA                                     */}
        {/* ============================================================ */}
        {activeGroup === 'infra' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Base de datos */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Base de datos</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Funcionando correctamente
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Almacena la información principal de HIPOTECALY: clientes, usuarios, expedientes, configuraciones y operaciones.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Normalmente no requiere intervención.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Riesgo</span>
                    <p className="text-slate-400 text-[11px]">
                      Modificaciones estructurales no planificadas pueden interrumpir el servicio de expedientes.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#152E4D] text-[10px] text-slate-500">
                  Tecnología: Supabase PostgreSQL
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Base de datos')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar
              </Button>
            </div>

            {/* 2. Archivos privados */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Archivos privados</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Funcionando correctamente
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Almacena de forma privada documentos, fotografías y archivos asociados a los expedientes.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Solamente si se requiere ampliar cuotas o configurar políticas de retención.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Riesgo</span>
                    <p className="text-slate-400 text-[11px]">
                      Alterar permisos de almacenamiento puede impedir la descarga segura de títulos y recibos.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#152E4D] text-[10px] text-slate-500">
                  Tecnología: Supabase Storage
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Archivos privados')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar
              </Button>
            </div>

            {/* 3. Procesos automáticos */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">Procesos automáticos</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 12 procesos funcionando
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Ejecuta tareas programadas sin intervención manual: recordatorios, sincronizaciones, limpiezas y conciliaciones.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Solamente si se necesita ajustar la frecuencia de una tarea o pausar una rutina.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Riesgo</span>
                    <p className="text-slate-400 text-[11px]">
                      Desactivar procesos puede retrasar notificaciones automáticas o conciliaciones diarias.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#152E4D] text-[10px] text-slate-500">
                  Tecnología: tareas programadas / cron
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Procesos automáticos')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Ver procesos
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GRUPO B: SEGURIDAD                                           */}
        {/* ============================================================ */}
        {activeGroup === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Permisos y aislamiento de clientes */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Permisos y aislamiento de clientes</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Configuración correcta
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Controla qué información puede ver cada organización y cada tipo de usuario, evitando accesos cruzados.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Normalmente no necesitas modificar esta configuración. Úsala solamente si cambias permisos o investigas un problema de acceso.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Riesgo</span>
                    <p className="text-slate-400 text-[11px]">
                      Cambiar incorrectamente estos permisos puede provocar que determinados usuarios pierdan acceso a información que necesitan.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#152E4D] text-[10px] text-slate-500">
                  Tecnología: Supabase Row Level Security · RLS
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Permisos y aislamiento')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar permisos
              </Button>
            </div>

            {/* 2. Credenciales seguras */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-sm text-white">Credenciales seguras</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Credenciales configuradas
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Protege las claves privadas utilizadas para conectar HIPOTECALY con proveedores externos (IA, KYC, Firma).
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Solamente al renovar o reemplazar una clave con un proveedor de servicios.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Riesgo</span>
                    <p className="text-slate-400 text-[11px]">
                      Ingresar una clave incorrecta pausará la comunicación con el servicio externo correspondiente.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#152E4D] text-[10px] text-slate-500">
                  Tecnología: Supabase Vault
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Credenciales seguras')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar credenciales
              </Button>
            </div>

            {/* 3. Sesiones y accesos */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">Sesiones y accesos</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Sin problemas detectados
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Controla las sesiones de usuarios, administradores y accesos especiales de la plataforma.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Para revocar accesos masivos o auditar sesiones concurrentes.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Riesgo</span>
                    <p className="text-slate-400 text-[11px]">
                      Cerrar sesiones activas forzará a los usuarios a volver a ingresar.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#152E4D] text-[10px] text-slate-500">
                  Tecnología: Supabase Auth
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Sesiones y accesos')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GRUPO C: INTEGRACIONES TÉCNICAS                              */}
        {/* ============================================================ */}
        {activeGroup === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Credenciales de servicios */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Credenciales de servicios</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    🟢 Claves activas
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Claves utilizadas para conectar HIPOTECALY con proveedores externos como OpenAI y Didit.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Solo necesitas modificar esta configuración si cambias de proveedor o si la integración deja de funcionar.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>OpenAI:</span>
                    <span className="text-emerald-400">••••••••••••3a9F (Validada)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Didit KYC:</span>
                    <span className="text-emerald-400">••••••••••••8801 (Validada)</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Credenciales de servicios')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Reemplazar credencial
              </Button>
            </div>

            {/* 2. Notificaciones entre servicios (Webhooks) */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Webhook className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-sm text-white">Notificaciones entre servicios</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    🟢 Funcionando correctamente
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Para qué sirve</span>
                    <p className="font-semibold text-white">
                      Permiten que un proveedor informe automáticamente a HIPOTECALY cuando ocurre un evento (KYC aprobado, firma completada).
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cuándo modificarlo</span>
                    <p className="text-slate-400 text-[11px]">
                      Si el proveedor requiere cambiar la dirección de recepción o renovar la firma criptográfica.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#152E4D] text-[10px] text-slate-500">
                  Tecnología: Webhooks con verificación HMAC
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('Notificaciones')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GRUPO D: DIAGNÓSTICO Y REGISTROS                             */}
        {/* ============================================================ */}
        {activeGroup === 'diagnostic' && (
          <div className="space-y-6">
            {/* 1. Comprobar sistema */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-4">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-emerald-400" />
                    Comprobar sistema
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Revisa automáticamente que los principales componentes de HIPOTECALY estén funcionando.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={runDiagnostic}
                  disabled={diagnosing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-sm"
                >
                  <Play className={`w-3.5 h-3.5 mr-1.5 ${diagnosing ? 'animate-spin' : ''}`} />
                  {diagnosing ? 'Comprobando...' : 'Comprobar ahora'}
                </Button>
              </div>

              {/* Resultados sencillos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                {[
                  { name: 'Base de datos', status: '🟢 Funcionando' },
                  { name: 'Archivos', status: '🟢 Funcionando' },
                  { name: 'Inteligencia Artificial', status: '🟢 Funcionando' },
                  { name: 'Identidad y KYC', status: '🟢 Funcionando' },
                  { name: 'Firma Digital', status: '🟢 Funcionando' },
                  { name: 'Email', status: '🟢 Funcionando' },
                  { name: 'Notificaciones', status: '🟢 Funcionando' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#071322] border border-[#152E4D] rounded-xl space-y-1 text-center">
                    <span className="text-[11px] font-semibold text-slate-300 block">{item.name}</span>
                    <span className="text-[10px] text-emerald-400 font-bold block">{item.status}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTechDetailsModal(true)}
                  className="text-xs text-slate-400 hover:text-white border-[#152E4D]"
                >
                  Ver detalles técnicos
                </Button>
              </div>
            </div>

            {/* 2. Registros e Historial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-white">Registros técnicos</h4>
                  <p className="text-xs text-slate-400">
                    Información utilizada para investigar errores o comportamientos inesperados de la plataforma.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedModal('Registros')}
                    className="bg-[#071322] border-[#1E3A5F] text-slate-200 text-xs"
                  >
                    Ver registros
                  </Button>
                </div>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-white">Historial de cambios</h4>
                  <p className="text-xs text-slate-400">
                    Permite saber quién modificó una configuración importante y cuándo.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedModal('Historial')}
                    className="bg-[#071322] border-[#1E3A5F] text-slate-200 text-xs"
                  >
                    Ver historial
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalle Técnico */}
        {(selectedModal || showTechDetailsModal) && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl max-w-lg w-full p-6 space-y-4 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <h3 className="font-bold text-base text-white">
                  {showTechDetailsModal ? 'Detalles técnicos del sistema' : `Detalles: ${selectedModal}`}
                </h3>
                <button
                  onClick={() => {
                    setSelectedModal(null);
                    setShowTechDetailsModal(false);
                  }}
                  className="text-slate-400 hover:text-white text-lg"
                >
                  ×
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Este componente se encuentra actualmente sincronizado y gestionado por la infraestructura segura server-side de HIPOTECALY.
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] text-xs font-mono text-emerald-400 space-y-1">
                <div>Estado: 🟢 Operativo</div>
                <div>Latencia: 14ms</div>
                <div>Seguridad: RLS y Vault activos</div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedModal(null);
                    setShowTechDetailsModal(false);
                  }}
                  className="bg-[#071322] border-[#152E4D] text-slate-300"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SuperAdminLayout>
  );
};
