import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GeocodeSuggestion {
  name: string;
  fullAddress: string;
  lat: number;
  lon: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (text: string) => void;
  onSelect: (suggestion: GeocodeSuggestion) => void;
  placeholder?: string;
  testId?: string;
  hasLocation: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  testId,
  hasLocation,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(text: string) {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiRequest("GET", `/api/mapbox/autocomplete?q=${encodeURIComponent(text)}`);
        const data: GeocodeSuggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <MapPin
          className={cn(
            "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
            hasLocation ? "text-primary" : "text-muted-foreground",
          )}
        />
        <Input
          data-testid={testId}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-8 pr-8"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-[1000] mt-1 w-full rounded-md border border-card-border bg-popover shadow-md overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              data-testid={`option-address-${i}`}
              className="w-full text-left px-3 py-2 hover-elevate active-elevate-2 flex flex-col gap-0.5 border-b border-card-border last:border-b-0"
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
            >
              <span className="text-sm font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground truncate">{s.fullAddress}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
