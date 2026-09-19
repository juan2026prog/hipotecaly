// ==============================================================================
// HIPOTECALY GEOCORE - AUTOCOMPLETADO DE DIRECCIÓN COMPLETA
// Búsqueda integrada IDE Uruguay con resolución de todos los campos geográficos
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { GeoService } from "../../lib/geo/geoService";
import { AddressCandidate } from "../../lib/geo/types";
import { Search, Loader2, MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  onSelectAddress: (candidate: AddressCandidate) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onSelectAddress,
  placeholder = "Buscar dirección (ej: Bulevar España 2450)...",
  disabled = false,
  className = "",
  id = "address-autocomplete-input",
}) => {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<AddressCandidate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

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

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 3) {
      setCandidates([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await GeoService.getInstance().searchAddressCandidates(val, 6);
        setCandidates(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.warn("Error searching address candidates:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = async (candidate: AddressCandidate) => {
    setQuery(candidate.fullAddress);
    setIsOpen(false);
    setCandidates([]);

    // Si el candidato no tiene coordenadas (ej. viene de autocompletado general), geocodificarlo con direcUnica o find
    let resolvedCandidate = candidate;
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
        console.warn("Error geocoding candidate coords:", err);
      } finally {
        setLoading(false);
      }
    }

    onSelectAddress(resolvedCandidate);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || candidates.length === 0) return;

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
            if (candidates.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 focus:bg-white transition-colors disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <MapPin className="w-4 h-4 text-[#102d49]" />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#102d49]" /> : <Search className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && candidates.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-auto rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200 text-xs divide-y divide-slate-50">
          {candidates.map((c, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={`${c.id}_${idx}`}
                onClick={() => handleSelect(c)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3 py-2.5 cursor-pointer rounded-xl flex items-center justify-between transition-colors ${
                  isHighlighted ? "bg-[#102d49] text-white" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? "text-[#f4b43b]" : "text-slate-400"}`} />
                  <span className="font-semibold truncate">{c.fullAddress}</span>
                </div>
                {c.locality && (
                  <span className={`text-[10px] uppercase font-bold shrink-0 ml-2 ${isHighlighted ? "text-slate-200" : "text-slate-400"}`}>
                    {c.locality}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
