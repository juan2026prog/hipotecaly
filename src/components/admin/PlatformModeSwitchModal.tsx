// ==============================================================================
// HIPOTECALY: Modal de Cambio de Modo de Plataforma (PlatformModeSwitchModal.tsx)
// Confirmación con AAL2 / Super Admin para pasar de PRODUCCIÓN ↔ PRUEBA
// ==============================================================================

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  FlaskConical,
  Lock,
  X,
  RefreshCw,
} from 'lucide-react';
import { platformModeService, PlatformMode } from '../../lib/platformModeService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface PlatformModeSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: PlatformMode;
  onSuccess?: (newMode: PlatformMode) => void;
}

export const PlatformModeSwitchModal: React.FC<PlatformModeSwitchModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetMode: PlatformMode = currentMode === 'test' ? 'production' : 'test';

  const handleConfirmSwitch = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await platformModeService.setPlatformMode(targetMode, user?.id);
      if (!result.success) {
        setErrorMsg(result.error || 'Error al actualizar el modo de plataforma.');
        setLoading(false);
        return;
      }

      setLoading(false);
      if (onSuccess) {
        onSuccess(targetMode);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al cambiar de modo.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#09182C] border border-[#1E3E66] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-left">
        
        {/* Header */}
        <div className="p-5 border-b border-[#152E4D] flex items-center justify-between bg-[#0B1E36]">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                targetMode === 'production'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {targetMode === 'production' ? (
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
              ) : (
                <FlaskConical className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {targetMode === 'production' ? 'Activar Producción' : 'Activar Modo Prueba'}
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Cambio de Entorno Global de HIPOTECALY
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {targetMode === 'production' ? (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl space-y-2">
                <p className="font-semibold text-emerald-200">
                  Al confirmar el cambio a Modo Producción:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  <li>
                    El acceso universal <strong className="text-white">admin@estudionova.uy</strong> será <span className="text-red-400 font-bold">deshabilitado inmediatamente</span> con respuesta 401.
                  </li>
                  <li>
                    Los usuarios deberán ingresar exclusivamente mediante sus <strong className="text-white">cuentas reales</strong> registradas.
                  </li>
                  <li>
                    Los permisos reales de cada tenant y usuario serán utilizados de forma autoritativa.
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Esta acción es auditada permanentemente bajo el evento <code className="font-mono text-emerald-300">PLATFORM_MODE_CHANGED</code>.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 bg-amber-950/40 border border-amber-800/40 rounded-xl space-y-2">
                <p className="font-semibold text-amber-200">
                  Al confirmar el cambio a Modo Prueba:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                  <li>
                    Se habilitará el usuario universal de pruebas: <strong className="text-white">admin@estudionova.uy</strong> (contraseña: <code className="font-mono text-amber-300">admin123</code>).
                  </li>
                  <li>
                    Se activará el selector de vistas para recorrer los portales demo (Cliente, Inversor, Escribano, Backoffice, Tenant Admin).
                  </li>
                  <li>
                    El usuario de prueba tiene bloqueado terminantemente el acceso a Super Admin (/admin).
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Esta acción es auditada permanentemente bajo el evento <code className="font-mono text-amber-300">PLATFORM_MODE_CHANGED</code>.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#152E4D] bg-[#0B1E36] flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="border-[#1E3E66] text-slate-300 hover:bg-white/5 text-xs font-semibold"
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmSwitch}
            disabled={loading}
            className={`text-white font-bold text-xs ${
              targetMode === 'production'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-900/40'
                : 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-900/40'
            }`}
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {targetMode === 'production' ? 'Confirmar Producción' : 'Activar Modo Prueba'}
          </Button>
        </div>

      </div>
    </div>
  );
};
