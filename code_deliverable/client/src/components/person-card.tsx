import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AddressAutocomplete, type GeocodeSuggestion } from "@/components/address-autocomplete";
import { CheckCircle2 } from "lucide-react";

export interface PersonFormState {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lon: number | null;
  delayFactor: number;
}

const DELAY_OPTIONS = [
  { value: "1", label: "Normal (1x)" },
  { value: "1.2", label: "Slight delay (1.2x)" },
  { value: "1.5", label: "Major delay (1.5x)" },
];

interface PersonCardProps {
  index: number;
  person: PersonFormState;
  onChange: (person: PersonFormState) => void;
}

export function PersonCard({ index, person, onChange }: PersonCardProps) {
  const hasLocation = person.lat !== null && person.lon !== null;

  function handleSelect(s: GeocodeSuggestion) {
    onChange({ ...person, address: s.fullAddress, lat: s.lat, lon: s.lon });
  }

  function handleAddressChange(text: string) {
    onChange({ ...person, address: text, lat: null, lon: null });
  }

  return (
    <Card className="p-4 flex flex-col gap-3" data-testid={`card-person-${index}`}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`name-${index}`} className="text-xs text-muted-foreground uppercase tracking-wide">
          Person {index + 1}
        </Label>
        {hasLocation && (
          <span className="inline-flex items-center gap-1 text-xs text-primary" data-testid={`status-located-${index}`}>
            <CheckCircle2 className="h-3 w-3" />
            Located
          </span>
        )}
      </div>
      <Input
        id={`name-${index}`}
        data-testid={`input-name-${index}`}
        value={person.name}
        onChange={(e) => onChange({ ...person, name: e.target.value })}
        placeholder="Name"
      />
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Address</Label>
        <AddressAutocomplete
          value={person.address}
          onChange={handleAddressChange}
          onSelect={handleSelect}
          placeholder="Start typing an NYC address…"
          testId={`input-address-${index}`}
          hasLocation={hasLocation}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Delay factor</Label>
        <Select
          value={String(person.delayFactor)}
          onValueChange={(v) => onChange({ ...person, delayFactor: parseFloat(v) })}
        >
          <SelectTrigger data-testid={`select-delay-${index}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DELAY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
