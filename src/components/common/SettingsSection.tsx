import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  separator?: boolean;
  className?: string;
}

export default function SettingsSection({
  title,
  description,
  children,
  separator = true,
  className,
}: SettingsSectionProps) {
  return (
    <>
      <div className={className}>
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
        )}
        {children}
      </div>
      {separator && <Separator className="my-6" />}
    </>
  );
}
