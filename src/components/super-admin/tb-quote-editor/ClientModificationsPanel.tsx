import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AlertTriangle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PreviousVersionDialog } from "./PreviousVersionDialog";

interface ClientModificationsPanelProps {
  notes: string;
  decidedAt: string | null;
  previousQuoteId: string | null;
}

export function ClientModificationsPanel({ notes, decidedAt, previousQuoteId }: ClientModificationsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-amber-900">Il cliente ha richiesto modifiche al preventivo precedente</h3>
              {decidedAt && (
                <p className="text-xs text-amber-800">
                  Richiesta del {format(new Date(decidedAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-md bg-white/70 border border-amber-200 p-3">
            <p className="text-sm whitespace-pre-line text-amber-950">{notes}</p>
          </div>
          {previousQuoteId && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Vedi versione precedente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {previousQuoteId && (
        <PreviousVersionDialog quoteId={previousQuoteId} open={open} onOpenChange={setOpen} />
      )}
    </>
  );
}
