// ==============================================================================
// HIPOTECALY GEOCORE - BADGE DE PRECISIÓN GEOGRÁFICA
// ==============================================================================

import React from "react";
import { LocationPrecision } from "../../lib/geo/types";
import { getPrecisionDescriptor } from "../../lib/geo/precision";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface GeoPrecisionBadgeProps {
  precision?: LocationPrecision | null;
  showDescription?: boolean;
  className?: string;
}

export const GeoPrecisionBadge: React.FC<GeoPrecisionBadgeProps> = ({
  precision,
  showDescription = false,
  className = "",
}) => {
  const desc = getPrecisionDescriptor(precision);

  const renderIcon = () => {
    switch (desc.level) {
      case "EXACT_ADDRESS":
      case "STREET_NUMBER":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case "STREET":
      case "NEIGHBORHOOD":
      case "LOCALITY":
        return <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className={`inline-flex flex-col space-y-0.5 ${className}`}>
      <div
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${desc.colorClass}`}
      >
        {renderIcon()}
        <span>{desc.label}</span>
      </div>
      {showDescription && (
        <p className="text-[11px] text-slate-500 pl-1">{desc.description}</p>
      )}
    </div>
  );
};
