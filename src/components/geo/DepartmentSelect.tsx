// ==============================================================================
// HIPOTECALY GEOCORE - SELECTOR CONTROLADO DE DEPARTAMENTOS
// ==============================================================================

import React from "react";
import { OFFICIAL_URUGUAY_DEPARTMENTS } from "../../lib/geo/normalization";

interface DepartmentSelectProps {
  value: string;
  onChange: (deptName: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  className = "",
  id = "department-select",
}) => {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
    >
      <option value="">Seleccionar departamento...</option>
      {OFFICIAL_URUGUAY_DEPARTMENTS.map((dept) => (
        <option key={dept.id} value={dept.name}>
          {dept.name}
        </option>
      ))}
    </select>
  );
};
