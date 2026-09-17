import React from 'react';

export const PageLoadingSpinner: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-10 h-10 border-3 border-brand-green border-t-transparent rounded-full animate-spin mb-3 shadow-xs" />
      <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide">
        Cargando sección...
      </span>
    </div>
  );
};
