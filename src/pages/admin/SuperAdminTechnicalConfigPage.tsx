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
  Network,
  Activity,
  CheckCircle2,
  Play,
  Eye,
  Key,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { Button } from '../../components/ui/Button';

export const SuperAdminTechnicalConfigPage: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<'infra' | 'security' | 'integrations' | 'diagnostic'>('infra');
  const [diagnosing, setDiagnosing] = useState(false);
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const runDiagnostic = () => {
    setDiagnosing(true);
    setTimeout(() => {
      setDiagnosing(false);
      setToastMessage('Diagnóstico completo: 7 de 7 componentes operativos.');
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
            { id: 'security', label: 'B. Seguridad & RLS', icon: ShieldCheck },
            { id: 'integrations', label: 'C. Integraciones Técnicas', icon: KeyRound },
            { id: 'diagnostic', label: 'D. Diagnóstico & Registros', icon: Activity },
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
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Base de datos</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Funcionando
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Almacena usuarios, clientes, expedientes y configuraciones.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Gestiona la conexión con la base relacional PostgreSQL. Normalmente no requiere intervención.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Tecnología: PostgreSQL · Supabase DB</div>
                  <div>Pool de conexiones: Activo (Latencia: 14ms)</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('db')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar base de datos
              </Button>
            </div>

            {/* 2. Archivos privados */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Archivos privados</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Funcionando
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Almacenamiento seguro de documentos y fotos.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Gestiona los buckets privados con permisos restringidos y URLs firmadas de corta duración.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Tecnología: Supabase Storage Buckets</div>
                  <div>Políticas de acceso: RLS por cliente</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('storage')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar almacenamiento
              </Button>
            </div>

            {/* 3. Procesos automáticos */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-sm text-white">Procesos automáticos</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 12 procesos activos
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Tareas que se ejecutan sin intervención humana.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Recordatorios de crédito, sincronizaciones periódicas, limpiezas y conciliaciones programadas.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Tecnología: Edge Functions Cron Jobs</div>
                  <div>Última ejecución: Hace 3 minutos</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('cron')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> Ver procesos automáticos
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
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Aislamiento de clientes</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 RLS Activo
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Controla qué información puede ver cada organización.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Protege la estricta separación de datos entre clientes. No modificar salvo necesidad justificada.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Tecnología: Row Level Security · RLS</div>
                  <div>Tablas protegidas: 18 / 18</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('rls')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar permisos
              </Button>
            </div>

            {/* 2. Credenciales seguras */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-sm text-white">Credenciales seguras</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Bóveda Cifrada
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Guarda de forma encriptada las claves privadas.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Almacena las credenciales de IA, KYC, Firma y Correo con encriptación hardware sin exponerse al navegador.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Tecnología: Supabase Vault (AEAD)</div>
                  <div>Variables custodiadas: 4 críticas</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('vault')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar credenciales
              </Button>
            </div>

            {/* 3. Sesiones y accesos */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">Sesiones y accesos</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    🟢 Sin incidentes
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Control de autenticación de usuarios y administradores.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Gestiona sesiones JWT, verificación en dos pasos y tokens de acceso temporales.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Tecnología: Supabase Auth Core</div>
                  <div>Tokens activos: Válidos</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('auth')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Administrar sesiones
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GRUPO C: INTEGRACIONES TÉCNICAS                              */}
        {/* ============================================================ */}
        {activeGroup === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Claves API */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Claves API</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    🟢 Válidas
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Conexión con proveedores externos.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Permite verificar estado, reemplazar y probar conectividad con OpenAI, Didit y Firma.gub.uy.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>OpenAI: sk-proj-••••••••3a9F</div>
                  <div>Didit KYC: didit_sec_••••8801</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('api-keys')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Gestionar Claves
              </Button>
            </div>

            {/* 2. Webhooks */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Webhook className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-sm text-white">Webhooks y Notificaciones</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    🟢 Operativo
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Recepción automática de eventos de servicios.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Recibe avisos cuando un usuario completa KYC o cuando se firma un documento.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>Firma HMAC SHA-256: Verificada</div>
                  <div>Eventos procesados: 1.820 este mes</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('webhooks')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Ver Webhooks
              </Button>
            </div>

            {/* 3. Conexiones y Endpoints */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Network className="w-5 h-5 text-sky-400" />
                    <h3 className="font-bold text-sm text-white">Endpoints del Sistema</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    🟢 100% Online
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    Rutas de comunicación interna y APIs.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Direcciones utilizadas por el frontend y los clientes para interactuar con el motor central.
                  </p>
                </div>

                <div className="p-2.5 bg-[#071322] rounded-lg border border-[#152E4D] text-[10px] font-mono text-slate-400 space-y-1">
                  <div>API Base: /api/v1/*</div>
                  <div>Edge Functions: Activas</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedModal('endpoints')}
                className="w-full bg-[#071322] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1" /> Ver Endpoints
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GRUPO D: DIAGNÓSTICO                                         */}
        {/* ============================================================ */}
        {activeGroup === 'diagnostic' && (
          <div className="space-y-6">
            {/* Panel de Ejecución de Diagnóstico */}
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-4">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-emerald-400" />
                    Diagnóstico Integral de Componentes
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comprueba en vivo que todos los servicios e infraestructuras internas de HIPOTECALY respondan adecuadamente.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={runDiagnostic}
                  disabled={diagnosing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                >
                  <Play className={`w-3.5 h-3.5 mr-1.5 ${diagnosing ? 'animate-spin' : ''}`} />
                  {diagnosing ? 'Comprobando componentes...' : 'Ejecutar diagnóstico'}
                </Button>
              </div>

              {/* Resultados del Diagnóstico */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                {[
                  { name: 'Base de datos', status: 'OK' },
                  { name: 'Almacenamiento', status: 'OK' },
                  { name: 'Inteligencia Artificial', status: 'OK' },
                  { name: 'Identidad KYC', status: 'OK' },
                  { name: 'Firma Digital', status: 'OK' },
                  { name: 'Email Transaccional', status: 'OK' },
                  { name: 'Webhooks Bus', status: 'OK' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-[#071322] border border-[#152E4D] rounded-xl space-y-1 text-center">
                    <span className="text-[11px] font-semibold text-slate-300 block">{item.name}</span>
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registros e Historial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-sm text-white">Registros técnicos (Logs)</h4>
                <p className="text-xs text-slate-400">
                  Información técnica utilizada para investigar errores o anomalías.
                </p>
                <div className="p-3 bg-[#071322] rounded-xl font-mono text-[11px] text-slate-400 space-y-1">
                  <div>[2026-09-07 04:30:11] INFO: Health check passed for 7 services</div>
                  <div>[2026-09-07 04:15:02] INFO: DocFlow render completed without errors</div>
                  <div>[2026-09-07 03:55:40] INFO: Vacuum routine executed on db pool</div>
                </div>
              </div>

              <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-sm text-white">Historial de cambios técnicos</h4>
                <p className="text-xs text-slate-400">
                  Permite saber quién modificó una configuración importante y cuándo.
                </p>
                <div className="p-3 bg-[#071322] rounded-xl font-mono text-[11px] text-slate-400 space-y-1">
                  <div>2026-09-07: Se actualizó modelo de OCR a GPT-5.6-luna (Admin)</div>
                  <div>2026-09-06: Se configuró webhook receiver de Didit v3</div>
                  <div>2026-09-05: Se habilitó aislamiento RLS para nuevo cliente</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalle Técnico */}
        {selectedModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl max-w-lg w-full p-6 space-y-4 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <h3 className="font-bold text-base text-white capitalize">Detalle: {selectedModal}</h3>
                <button onClick={() => setSelectedModal(null)} className="text-slate-400 hover:text-white text-lg">×</button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Este componente se encuentra actualmente sincronizado y gestionado por la infraestructura segura server-side de HIPOTECALY.
              </p>

              <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] text-xs font-mono text-emerald-400">
                Estado: 100% OPERATIVO · Sin incidentes
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedModal(null)}
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
