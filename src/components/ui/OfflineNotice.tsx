import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineNotice: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-navy text-white px-4 py-3 rounded-btn shadow-floating border border-amber-400/50 flex items-center space-x-3 z-50 animate-bounce"
    >
      <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
      <div className="text-xs md:text-sm">
        <p className="font-semibold text-amber-300">Modo sin conexión</p>
        <p className="text-slate-300 text-xs">
          Sin conexión. Algunos datos pueden no estar actualizados.
        </p>
      </div>
    </div>
  );
};
