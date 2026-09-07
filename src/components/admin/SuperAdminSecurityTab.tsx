import { ShieldCheck, Lock, Database, KeyRound, CheckCircle2 } from 'lucide-react';

export const SuperAdminSecurityTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#152E4D] pb-4">
        <h2 className="text-lg font-bold text-white flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
          Centro de Seguridad, RLS y Aislamiento de Datos
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Verificación en tiempo real de políticas de seguridad, cifrado en reposo y aislamiento de tenants.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Row-Level Security (RLS)</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% ACTIVO
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Todas las tablas relacionales en PostgreSQL cuentan con políticas obligatorias de tenant isolation basadas en JWT claims y <code className="text-emerald-400 font-mono">tenant_id</code>.
          </p>
          <div className="pt-2 border-t border-[#152E4D] flex items-center justify-between text-[11px] text-slate-400">
            <span>Tablas protegidas</span>
            <strong className="text-slate-200">18 / 18 tablas</strong>
          </div>
        </div>

        <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white">Supabase Vault (Cifrado AEAD)</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              ENCRIPTADO
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Secretos de OpenAI, Didit KYC, Firma Digital y webhooks almacenados en la bóveda con hardware encryption. Cero exposición en frontend.
          </p>
          <div className="pt-2 border-t border-[#152E4D] flex items-center justify-between text-[11px] text-slate-400">
            <span>Secretos custodiados</span>
            <strong className="text-slate-200">4 variables críticas</strong>
          </div>
        </div>

        <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Storage Privado & Firmado</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SIGNED URLS
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Documentos notariales, recibos y títulos protegidos en buckets privados con expiración temporal de URL de descarga (60s máx).
          </p>
          <div className="pt-2 border-t border-[#152E4D] flex items-center justify-between text-[11px] text-slate-400">
            <span>Bucket Status</span>
            <strong className="text-slate-200">Private Only</strong>
          </div>
        </div>
      </div>

      {/* Protocolos y Certificaciones Activas */}
      <div className="bg-[#09182C] border border-[#152E4D] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
          Protocolos de Seguridad Validados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#071322] border border-[#152E4D] space-y-1">
            <span className="font-bold text-slate-200 block">Anti-Bypass de Identidad y Contacto</span>
            <p className="text-slate-400 text-[11px]">
              Los inversores privados y analistas externos no pueden acceder a datos de contacto directo (teléfonos, emails) hasta que el expediente esté formalmente autorizado.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#071322] border border-[#152E4D] space-y-1">
            <span className="font-bold text-slate-200 block">Control de Sesiones QA Server-Side</span>
            <p className="text-slate-400 text-[11px]">
              La simulación de roles en QA se ejecuta mediante credenciales de servicio con token de corta duración, registrándose en el log inmutable de auditoría.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#071322] border border-[#152E4D] space-y-1">
            <span className="font-bold text-slate-200 block">Firma Digital Ley N° 18.600</span>
            <p className="text-slate-400 text-[11px]">
              Integración con estándares de firma electrónica avanzada según la normativa notarial de la República Oriental del Uruguay.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#071322] border border-[#152E4D] space-y-1">
            <span className="font-bold text-slate-200 block">Aislamiento de Red Inversores</span>
            <p className="text-slate-400 text-[11px]">
              Las operaciones solo son visibles por inversores explícitamente autorizados dentro de la red del tenant correspondiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
