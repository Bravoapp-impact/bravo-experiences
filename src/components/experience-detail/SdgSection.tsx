import { Separator } from "@/components/ui/separator";
import { SDG_DATA } from "@/lib/sdg-data";

interface SdgSectionProps {
  sdgs: string[];
}

export function SdgSection({ sdgs }: SdgSectionProps) {
  const validSdgs = sdgs.map((code) => SDG_DATA[code]).filter(Boolean);
  if (!validSdgs.length) return null;

  return (
    <section>
      <Separator className="mb-8" />
      <h2 className="text-xl font-semibold text-foreground mb-4">Obiettivi di impatto</h2>
      <div className="flex flex-wrap gap-2">
        {validSdgs.map((sdg) => (
          <div
            key={sdg.code}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${sdg.color}15`,
              color: sdg.color,
            }}
          >
            <span>{sdg.icon}</span>
            <span>{sdg.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
