import {
  Ban,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTBStatusMeta, type TBRequestStatus } from "@/lib/tb-status";

interface Props {
  status: TBRequestStatus | string;
  interestedCount: number;
  onContinueDraft: () => void;
  onRequestQuote: () => void;
  isRequestingQuote: boolean;
}

export function TBRequestStatusSection({
  status,
  interestedCount,
  onContinueDraft,
  onRequestQuote,
  isRequestingQuote,
}: Props) {
  switch (status) {
    case "draft":
      return (
        <InfoCard
          icon={FileText}
          title="Brief da completare"
          description="Hai una bozza in sospeso. Completa il brief per ricevere le proposte."
          action={
            <Button onClick={onContinueDraft}>
              Continua brief
            </Button>
          }
        />
      );

    case "submitted":
    case "in_matching":
    case "proposals_ready":
      return (
        <InfoCard
          icon={Sparkles}
          title="Stiamo preparando le tue proposte"
          description="Il nostro team sta selezionando i format più adatti alla tua richiesta. Ti avviseremo via email quando saranno pronte."
        />
      );

    case "proposals_sent": {
      const disabled = interestedCount === 0;
      return (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {disabled
                  ? "Marca almeno una proposta come 'Mi interessa' per richiedere un preventivo"
                  : `Hai selezionato ${interestedCount} ${
                      interestedCount === 1 ? "proposta" : "proposte"
                    }`}
              </p>
              {!disabled && (
                <p className="text-xs text-muted-foreground">
                  Riceverai un preventivo dettagliato per le proposte selezionate.
                </p>
              )}
            </div>
            <Button
              onClick={onRequestQuote}
              disabled={disabled || isRequestingQuote}
              className="shrink-0"
            >
              <Send className="h-4 w-4 mr-1.5" />
              Richiedi preventivo
            </Button>
          </div>
        </Card>
      );
    }

    case "quote_requested":
    case "quote_in_composition":
    case "modification_requested":
      return (
        <InfoCard
          icon={Inbox}
          title="Stiamo preparando il preventivo"
          description="Abbiamo ricevuto la tua richiesta e stiamo coordinando con i partner. Riceverai un'email appena il preventivo sarà pronto."
        />
      );

    case "quote_sent":
      return (
        <InfoCard
          icon={FileText}
          title="Preventivo pronto"
          description="Il preventivo è pronto per la tua decisione. Vista preventivo in arrivo."
        />
      );

    case "quote_accepted":
      return (
        <InfoCard
          icon={CheckCircle2}
          title="Preventivo accettato"
          description="Ti contatteremo a breve via email per finalizzare il contratto. Una volta firmato, organizziamo l'evento."
        />
      );

    case "quote_rejected":
      return (
        <InfoCard
          icon={XCircle}
          title="Preventivo rifiutato"
          description="Hai rifiutato il preventivo. Se vuoi ripartire con una nuova proposta, apri una nuova richiesta dalla sezione Team Building."
        />
      );

    case "signed":
    case "event_scheduled":
      return (
        <InfoCard
          icon={CalendarCheck}
          title="Evento confermato"
          description="Il contratto è firmato. Coordineremo con te i dettagli finali dell'evento."
        />
      );

    case "completed":
      return (
        <InfoCard
          icon={CheckCircle2}
          title="Evento completato"
          description="Grazie per aver organizzato questo team building con noi."
        />
      );

    case "cancelled":
      return (
        <InfoCard
          icon={Ban}
          title="Richiesta annullata"
          description="Questa richiesta è stata annullata. Le informazioni restano disponibili per consultazione."
        />
      );

    default:
      return (
        <InfoCard
          icon={Clock}
          title={getTBStatusMeta(status).label}
          description="Aggiornamento di stato in corso."
        />
      );
  }
}

function InfoCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Clock;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Card>
  );
}
