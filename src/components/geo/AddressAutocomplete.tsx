// ==============================================================================
// HIPOTECALY GEOCORE - AUTOCOMPLETADO DE DIRECCIÓN GENERAL
// Búsqueda en todo Uruguay vía IDE Uruguay sin requerir departamento previo
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { GeoService } from "../../lib/geo/geoService";
import { AddressCandidate } from "../../lib/geo/types";
import { Search, Loader2, MapPin, AlertCircle } from "lucide-react";

interface AddressAutocompleteProps {
  onSelectAddress: (candidate: AddressCandidate) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onSelectAddress,
  placeholder = "Ej: Bulevar España 2450",
  disabled = false,
  className = "",
  id = "address-autocomplete-input",
}) => {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProgrammaticUpdate = useRef<boolean>(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSearchError(null);

    if (isProgrammaticUpdate.current) {
      isProgrammaticUpdate.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 3) {
      setCandidates([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setHasSearched(true);
      try {
        const results = await GeoService.getInstance().searchAddressCandidates(val, 6);
        setCandidates(results);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[AddressAutocomplete] Error searching addresses:", err);
          setSearchError("No pudimos consultar direcciones automáticamente.");
          setIsOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = async (candidate: AddressCandidate) => {
    isProgrammaticUpdate.current = true;
    setQuery(candidate.fullAddress);
    setIsOpen(false);
    setCandidates([]);
    setHasSearched(false);

    let resolvedCandidate = candidate;
    // Si no tiene coordenadas todavía, resolver con geocode
    if (!resolvedCandidate.latitude || !resolvedCandidate.longitude) {
      setLoading(true);
      try {
        const geocoded = await GeoService.getInstance().geocodeAddress({
          streetName: candidate.streetName,
          streetNumber: candidate.portalNumber ? String(candidate.portalNumber) : undefined,
          locality: candidate.locality,
          department: candidate.department,
          streetId: candidate.raw?.idCalle,
        });
        if (geocoded && geocoded.latitude && geocoded.longitude) {
          resolvedCandidate = geocoded;
        }
      } catch (err) {
        console.warn("[AddressAutocomplete] Error resolving coords:", err);
      } finally {
        setLoading(false);
      }
    }

    onSelectAddress(resolvedCandidate);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : candidates.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < candidates.length) {
        handleSelect(candidates[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (candidates.length > 0 || (hasSearched && query.trim().length >= 3)) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 focus:bg-white transition-colors disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <MapPin className="w-4 h-4 text-[#102d49]" />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#102d49]" /> : <Search className="w-4 h-4" />}
        </div>
      </div>

      {/* DROPDOWN DE RESULTADOS */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-auto rounded-2xl bg-white p-1.5 shadow-2xl border border-slate-200 text-xs">
          {searchError ? (
            <div className="p-3 text-center text-amber-700 bg-amber-50 rounded-xl flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          ) : candidates.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {candidates.map((c, idx) => {
                const isHighlighted = idx === highlightedIndex;
                const line1 = c.portalNumber ? `${c.streetName} ${c.portalNumber}` : c.streetName || c.fullAddress;
                const line2 = [c.neighborhood, c.locality, c.department].filter(Boolean).join(" · ");

                return (
                  <li
                    key={`${c.id}_${idx}`}
                    onClick={() => handleSelect(c)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2.5 cursor-pointer rounded-xl transition-colors flex items-center justify-between ${
                      isHighlighted ? "bg-[#102d49] text-white" : "hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <MapPin className={`w-4 h-4 shrink-0 ${isHighlighted ? "text-[#f4b43b]" : "text-slate-400"}`} />
                      <div className="truncate text-left">
                        <div className="font-bold text-xs truncate">{line1}</div>
                        <div className={`text-[11px] truncate ${isHighlighted ? "text-slate-200" : "text-slate-500"}`}>
                          {line2}
                        </div>
                      </div>
                    </div>
                    {c.department && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ml-2 shrink-0 ${
                        isHighlighted ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {c.department}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : hasSearched && !loading ? (
            <div className="p-4 text-center text-slate-500">
              <p className="font-semibold text-slate-700">No encontramos direcciones para esta búsqueda.</p>
              <p className="text-[11px] text-slate-400 mt-1">Podés completar la ubicación manualmente en el formulario inferior.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
