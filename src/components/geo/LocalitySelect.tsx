// ==============================================================================
// HIPOTECALY GEOCORE - SELECTOR CONTROLADO DE LOCALIDADES
// ==============================================================================

import React, { useState, useEffect } from "react";
import { GeoService } from "../../lib/geo/geoService";
import { Locality } from "../../lib/geo/types";

interface LocalitySelectProps {
  department: string;
  value: string;
  onChange: (localityName: string, locality?: Locality) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const LocalitySelect: React.FC<LocalitySelectProps> = ({
  department,
  value,
  onChange,
  disabled = false,
  required = false,
  className = "",
  id = "locality-select",
}) => {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!department) {
      setLocalities([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    GeoService.getInstance()
      .getLocalities(department)
      .then((data) => {
        if (isMounted) {
          setLocalities(data);
          setLoading(false);
          // Auto seleccionar si solo hay una o si coincide
          if (data.length === 1 && !value) {
            onChange(data[0].name, data[0]);
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [department]);

  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const loc = localities.find((l) => l.name === e.target.value);
          onChange(e.target.value, loc);
        }}
        disabled={disabled || loading || !department}
        required={required}
        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
      >
        <option value="">
          {loading ? "Cargando localidades..." : "Seleccionar localidad..."}
        </option>
        {localities.map((loc) => (
          <option key={loc.id} value={loc.name}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
};
