// ==============================================================================
// HIPOTECALY GEOCORE - AUTOCOMPLETADO DE CALLE / AVENIDA
// Con debounce (300ms) y navegación por teclado (ArrowUp, ArrowDown, Enter, Esc)
// ==============================================================================

import React, { useState, useEffect, useRef } from "react";
import { GeoService } from "../../lib/geo/geoService";
import { StreetSuggestion } from "../../lib/geo/types";
import { Search, Loader2 } from "lucide-react";

interface StreetAutocompleteProps {
  department: string;
  locality?: string;
  value: string;
  onChange: (streetName: string, streetId?: number) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const StreetAutocomplete: React.FC<StreetAutocompleteProps> = ({
  department,
  locality,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "Ej: Bulevar España",
  className = "",
  id = "street-input",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<StreetSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

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
    const text = e.target.value;
    setInputValue(text);
    onChange(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await GeoService.getInstance().searchStreet(
          text,
          department || "Montevideo",
          locality
        );
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.warn("Error searching street:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (s: StreetSuggestion) => {
    setInputValue(s.calle);
    onChange(s.calle, s.idCalle);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
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
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-9 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102d49]/20 disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#102d49]" /> : <Search className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-auto rounded-xl bg-white p-1 shadow-lg border border-slate-200 text-xs divide-y divide-slate-50">
          {suggestions.map((s, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={`${s.idCalle}_${idx}`}
                onClick={() => handleSelect(s)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3 py-2 cursor-pointer rounded-lg flex items-center justify-between transition-colors ${
                  isHighlighted ? "bg-[#102d49] text-white font-bold" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span>{s.calle}</span>
                <span className={`text-[10px] uppercase tracking-wider ${isHighlighted ? "text-slate-200" : "text-slate-400"}`}>
                  {s.localidad || s.departamento}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
