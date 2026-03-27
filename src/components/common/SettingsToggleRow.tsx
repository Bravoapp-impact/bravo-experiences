import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsToggleRowProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export default function SettingsToggleRow({
  label,
  checked,
  onCheckedChange,
  defaultChecked,
  disabled,
}: SettingsToggleRowProps) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        defaultChecked={defaultChecked}
        disabled={disabled}
      />
    </div>
  );
}
