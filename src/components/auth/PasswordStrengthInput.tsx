import { useMemo, useState } from "react";
import { Eye, EyeOff, Check, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { evaluatePassword } from "@/lib/password-policy";

interface PasswordStrengthInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  showRequirements?: boolean;
  showStrengthBar?: boolean;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}

const SCORE_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-emerald-500",
];

const SCORE_TEXT_COLORS = [
  "text-destructive",
  "text-destructive",
  "text-orange-500",
  "text-yellow-600",
  "text-emerald-600",
];

export function PasswordStrengthInput({
  id,
  value,
  onChange,
  label = "Password",
  placeholder = "••••••••",
  showRequirements = true,
  showStrengthBar = true,
  autoComplete = "new-password",
  required,
  disabled,
}: PasswordStrengthInputProps) {
  const [visible, setVisible] = useState(false);
  const evaluation = useMemo(() => evaluatePassword(value), [value]);
  const showFeedback = value.length > 0;

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
          aria-label={visible ? "Nascondi password" : "Mostra password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {showStrengthBar && showFeedback && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < evaluation.score
                    ? SCORE_COLORS[evaluation.score]
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className={cn("text-xs font-medium", SCORE_TEXT_COLORS[evaluation.score])}>
            Sicurezza: {evaluation.label}
          </p>
        </div>
      )}

      {showRequirements && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 pt-1">
          {evaluation.requirements.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                r.met ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {r.met ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <Circle className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{r.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
