"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { type Country } from "@/lib/countries";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  country: Country;
  placeholder?: string;
}

const COUNTRY_CODES: Record<Country, string> = {
  FR: "fr",
  BE: "be",
};

export function AddressAutocomplete({
  value,
  onChange,
  country,
  placeholder,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer le dropdown si on clique ailleurs + clean debounce
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Rate-limit : 1 requête par seconde max (politique Nominatim)
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) return;
    lastFetchRef.current = now;

    setLoading(true);
    try {
      const countryCodes = COUNTRY_CODES[country] || "fr,be";
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&countrycodes=${countryCodes}&format=json&limit=5&addressdetails=1&accept-language=fr`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "MonDevis/1.0 (devis application)",
        },
      });

      if (!res.ok) throw new Error("Nominatim error");

      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, [country]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 350);
  }

  function handleSelect(suggestion: Suggestion) {
    onChange(suggestion.display_name);
    setShowDropdown(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            placeholder={placeholder || "Adresse du chantier"}
            autoComplete="off"
            className="w-full px-3 py-2.5 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Loader2 className={`absolute right-2.5 top-3 w-4 h-4 text-gray-400 transition-opacity ${loading ? "opacity-100 animate-spin" : "opacity-0 pointer-events-none"}`} />
        </div>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={s.display_name + s.lat}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex items-start gap-2 px-3 py-2.5 text-sm cursor-pointer border-b border-gray-50 last:border-0 transition ${
                i === selectedIndex ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
              <span className="line-clamp-2">{s.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
