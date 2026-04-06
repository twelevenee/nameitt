import { useState } from "react";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllCountries, getCountry, setCountry } from "@/lib/i18n/crisis-resources";
import { strings } from "@/lib/i18n/strings";

interface CountrySelectorProps {
  className?: string;
  onChange?: (code: string) => void;
}

const CountrySelector = ({ className, onChange }: CountrySelectorProps) => {
  const [value, setValue] = useState(getCountry);
  const countries = getAllCountries();

  const handleChange = (code: string) => {
    setValue(code);
    setCountry(code);
    onChange?.(code);
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Globe className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger
          className="h-7 text-[11px] text-muted-foreground border-none bg-transparent shadow-none px-1 gap-1 w-auto min-w-[120px] focus:ring-0"
          aria-label={strings.landing.locationLabel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs">
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CountrySelector;
