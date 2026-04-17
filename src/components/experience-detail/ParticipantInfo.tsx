import { Info } from "lucide-react";

interface ParticipantInfoProps {
  info: string;
}

export function ParticipantInfo({ info }: ParticipantInfoProps) {
  const lines = info
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Informazioni utili</h2>
      <ul className="space-y-3">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/70" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
