import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Lightbulb,
  Copy,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { HRLayout } from "@/components/layout/HRLayout";
import { useAuth } from "@/hooks/useAuth";

import { PageHeader } from "@/components/common/PageHeader";
import PageSection from "@/components/common/PageSection";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import { EmptyState } from "@/components/common/EmptyState";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { useSuggestionsList, type AssociationSuggestion } from "@/hooks/queries/suggestions/useSuggestionsList";
import { useCompanySuggestionToken } from "@/hooks/queries/suggestions/useCompanySuggestionToken";
import { useUpdateSuggestionStatus } from "@/hooks/queries/suggestions/useUpdateSuggestionStatus";
import { useRegenerateSuggestionToken } from "@/hooks/queries/suggestions/useRegenerateSuggestionToken";

const REASON_MAX = 80;

function truncate(text: string, max = REASON_MAX) {
  if (text.length <= max) return { text, truncated: false };
  return { text: text.slice(0, max).trimEnd() + "…", truncated: true };
}

function StatusBadge({ status }: { status: AssociationSuggestion["status"] }) {
  if (status === "new") {
    return <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-transparent">Nuovo</Badge>;
  }
  if (status === "seen") {
    return <Badge variant="secondary">Visto</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground">Archiviato</Badge>;
}

export default function HRSuggestionsPage() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const { data: suggestions, isLoading } = useSuggestionsList(companyId);
  const { data: token } = useCompanySuggestionToken(companyId);
  const updateStatus = useUpdateSuggestionStatus(companyId);
  const regenerate = useRegenerateSuggestionToken(companyId);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const publicUrl = useMemo(
    () => (token ? `${window.location.origin}/suggerisci-ets/${token}` : ""),
    [token],
  );

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiato negli appunti");
    } catch {
      toast.error("Impossibile copiare il link");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerate.mutateAsync();
      setConfirmOpen(false);
      toast.success("Nuovo link generato");
    } catch (e: unknown) {
      toast.error("Errore nella rigenerazione del link");
    }
  };

  const handleRowClick = (s: AssociationSuggestion) => {
    if (s.status === "new") {
      updateStatus.mutate({ id: s.id, status: "seen" });
    }
  };

  const handleArchive = (s: AssociationSuggestion) => {
    updateStatus.mutate(
      { id: s.id, status: "archived" },
      {
        onSuccess: () => toast.success("Suggerimento archiviato"),
        onError: () => toast.error("Errore nell'archiviazione"),
      },
    );
  };

  const handleRestore = (s: AssociationSuggestion) => {
    updateStatus.mutate(
      { id: s.id, status: "seen" },
      {
        onSuccess: () => toast.success("Suggerimento ripristinato"),
        onError: () => toast.error("Errore nel ripristino"),
      },
    );
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        <PageHeader
          title="ETS Suggeriti"
          icon={Lightbulb}
          iconColor="text-yellow-500"
        />

        {isLoading ? (
          <PageSkeleton variant="table" />
        ) : (
          <>
            <PageSection
              title="Link da condividere"
              description="Condividi questo link con i tuoi dipendenti per ricevere suggerimenti di enti non-profit da supportare."
              divider
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  readOnly
                  value={publicUrl}
                  className="font-mono text-xs flex-1"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCopy} className="shrink-0">
                    <Copy className="h-4 w-4 mr-2" />
                    Copia link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmOpen(true)}
                    className="shrink-0"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rigenera
                  </Button>
                </div>
              </div>
            </PageSection>

            <PageSection title="ETS suggeriti">
              {!suggestions || suggestions.length === 0 ? (
                <EmptyState
                  icon={Lightbulb}
                  title="Nessun suggerimento ancora"
                  description="Condividi il link qui sopra con i tuoi dipendenti per iniziare a raccogliere suggerimenti di enti non-profit."
                />
              ) : (
                <TooltipProvider delayDuration={200}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="overflow-x-auto"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead>ETS suggerito</TableHead>
                          <TableHead>Suggerito da</TableHead>
                          <TableHead>Motivazione</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((s) => {
                          const reason = s.reason ? truncate(s.reason) : null;
                          return (
                            <TableRow key={s.id} className="group">
                              <TableCell
                                className="cursor-pointer"
                                onClick={() => handleRowClick(s)}
                              >
                                <div className="font-medium text-foreground">
                                  {s.suggested_name}
                                </div>
                                {s.suggested_city && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {s.suggested_city}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{s.suggester_name}</div>
                                {s.suggester_email && (
                                  <a
                                    href={`mailto:${s.suggester_email}`}
                                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Mail className="h-3 w-3" />
                                    {s.suggester_email}
                                  </a>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[280px]">
                                {reason ? (
                                  reason.truncated ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-sm text-foreground/80 cursor-help">
                                          {reason.text}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm">
                                        <p className="text-sm whitespace-pre-wrap">{s.reason}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span className="text-sm text-foreground/80">{reason.text}</span>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {format(new Date(s.created_at), "d MMM yyyy", { locale: it })}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={s.status} />
                              </TableCell>
                              <TableCell className="text-right">
                                {s.status === "archived" ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRestore(s);
                                        }}
                                      >
                                        <ArchiveRestore className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ripristina</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleArchive(s);
                                        }}
                                      >
                                        <Archive className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Archivia</TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </motion.div>
                </TooltipProvider>
              )}
            </PageSection>
          </>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rigenerare il link?</AlertDialogTitle>
            <AlertDialogDescription>
              Il link attuale smetterà di funzionare immediatamente. Dovrai
              ridistribuire il nuovo link a tutti i dipendenti che vorranno
              inviare suggerimenti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerate.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRegenerate();
              }}
              disabled={regenerate.isPending}
            >
              {regenerate.isPending ? "Rigenero…" : "Rigenera link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HRLayout>
  );
}
