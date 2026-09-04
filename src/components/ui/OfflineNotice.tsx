import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const OfflineNotice: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [checking, setChecking] = useState(false);
  const [reconnectedMessage, setReconnectedMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setReconnectedMessage(true);
      setTimeout(() => setReconnectedMessage(false), 3000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setReconnectedMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      // Intento de ping liviano
      await fetch('/manifest.webmanifest', { method: 'HEAD', cache: 'no-store' });
      setIsOffline(false);
      setReconnectedMessage(true);
      setTimeout(() => setReconnectedMessage(false), 3000);
    } catch {
      setIsOffline(!navigator.onLine);
    } finally {
      setChecking(false);
    }
  };

  if (reconnectedMessage) {
    return (
      <div
        role="status"
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-floating border border-emerald-400 flex items-center space-x-3 z-50 animate-in fade-in slide-in-from-bottom-3"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-emerald-200">¡Conexión restablecida!</p>
          <p className="text-emerald-100 text-[11px]">Sincronizando con el servidor en tiempo real.</p>
        </div>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-navy text-white p-3.5 rounded-xl shadow-floating border border-amber-400/60 flex items-center justify-between space-x-3 z-50 animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <WifiOff className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-xs text-left truncate">
          <p className="font-bold text-amber-300">Modo sin conexión</p>
          <p className="text-slate-300 text-[11px] truncate">
            Los datos se guardan localmente.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleManualCheck}
        disabled={checking}
        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg border border-white/20 flex items-center space-x-1 shrink-0 transition-colors"
      >
        <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
        <span>{checking ? 'Probando...' : 'Reintentar'}</span>
      </button>
    </div>
  );
};
