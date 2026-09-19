// ==============================================================================
// HIPOTECALY GEOCORE - SELECTOR Y RESOLUCIÓN DE BARRIOS / ZONAS
// ==============================================================================

import React from "react";
import { MONTEVIDEO_NEIGHBORHOODS } from "../../lib/tasador/normalization/UruguayLocationDictionary";

interface NeighborhoodSelectProps {
  department: string;
  value: string;
  onChange: (neighborhood: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const NeighborhoodSelect: React.FC<NeighborhoodSelectProps> = ({
  department,
  value,
  onChange,
  disabled = false,
  required = false,
  className = "",
  id = "neighborhood-select",
}) => {
  const isMontevideo = department.toLowerCase().trim() === "montevideo";

  // Lista única de barrios de Montevideo desde el diccionario oficial
  const mvdNeighborhoods = Array.from(
    new Set(Object.values(MONTEVIDEO_NEIGHBORHOODS))
  ).sort();

  if (isMontevideo) {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
      >
        <option value="">Seleccionar barrio...</option>
        {mvdNeighborhoods.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={id}
      type="text"
      placeholder="Ej: La Barra, Punta del Este, Ciudad de la Costa..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
    />
  );
};
