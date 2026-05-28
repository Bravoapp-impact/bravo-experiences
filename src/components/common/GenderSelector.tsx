import { Label } from "@/components/ui/label";

export type GenderValue = "" | "m" | "f" | "x";

export const GENDER_LABELS: Record<"m" | "f" | "x", string> = {
  m: "Bravo!",
  f: "Brava!",
  x: "Bravə!",
};

export function genderDisplay(value: string | null | undefined): string {
  if (value === "m" || value === "f" || value === "x") return GENDER_LABELS[value];
  return "";
}

interface GenderSelectorProps {
  value: GenderValue;
  onChange: (v: "m" | "f" | "x") => void;
  label?: string;
  hideLabel?: boolean;
}

export default function GenderSelector({
  value,
  onChange,
  label = "Come vuoi che ti accogliamo nell'app?",
  hideLabel = false,
}: GenderSelectorProps) {
  const options = [
    { value: "m" as const, label: "Bravo!" },
    { value: "f" as const, label: "Brava!" },
    { value: "x" as const, label: "Bravə!" },
  ];

  return (
    <div className="space-y-2">
      {!hideLabel && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
              className={`flex items-center justify-center rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input bg-background text-foreground hover:bg-muted/50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
