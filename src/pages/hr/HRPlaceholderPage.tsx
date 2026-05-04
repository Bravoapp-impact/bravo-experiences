import { HRLayout } from "@/components/layout/HRLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { Construction } from "lucide-react";

export default function HRPlaceholderPage({ title }: { title: string }) {
  return (
    <HRLayout>
      <div className="p-6">
        <EmptyState
          icon={Construction}
          title={title}
          description="Questa funzionalità sarà disponibile a breve."
        />
      </div>
    </HRLayout>
  );
}
