import { ExternalLink } from "lucide-react";
import { getResourcesForCountry, getCountry, type CrisisResource } from "@/lib/i18n/crisis-resources";

interface CrisisResourceListProps {
  countryCode?: string;
  showPhone?: boolean;
  compact?: boolean;
}

const CrisisResourceList = ({ countryCode, showPhone = true, compact = false }: CrisisResourceListProps) => {
  const code = countryCode ?? getCountry();
  const resources = getResourcesForCountry(code);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {resources.map((r) => (
        <div key={r.url} className="flex items-start gap-2">
          <ExternalLink className={`${compact ? "w-3 h-3 mt-0.5" : "w-3.5 h-3.5 mt-0.5"} shrink-0 text-muted-foreground`} aria-hidden="true" />
          <div>
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              className={`font-medium text-foreground/80 hover:text-foreground transition-colors ${compact ? "text-xs" : "text-sm"}`}>
              {r.name}
            </a>
            {showPhone && r.phone && (
              <span className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
                {" "}— <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="underline">{r.phone}</a>
              </span>
            )}
            {showPhone && r.textLine && (
              <span className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}> — {r.textLine}</span>
            )}
            <p className={`text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}>{r.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CrisisResourceList;
export { type CrisisResource };
