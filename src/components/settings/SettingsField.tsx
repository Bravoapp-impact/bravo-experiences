import { useState, ReactNode } from "react";

interface SettingsFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  editable?: boolean;
  actionLabel?: string;
  children?: (close: () => void) => ReactNode;
}

export function SettingsField({
  label,
  value,
  placeholder = "Non impostato",
  editable = true,
  actionLabel,
  children,
}: SettingsFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const displayValue = value && value.trim().length > 0 ? value : placeholder;
  const isEmpty = !value || value.trim().length === 0;
  const action = actionLabel || (isEmpty ? "Aggiungi" : "Modifica");

  return (
    <div className="py-5 border-b border-border last:border-b-0">
      {!isEditing ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className={`text-sm mt-1 ${isEmpty ? "text-muted-foreground italic" : "text-muted-foreground"}`}>
              {displayValue}
            </p>
          </div>
          {editable && children && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity shrink-0"
            >
              {action}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity shrink-0"
            >
              Annulla
            </button>
          </div>
          {children?.(() => setIsEditing(false))}
        </div>
      )}
    </div>
  );
}
