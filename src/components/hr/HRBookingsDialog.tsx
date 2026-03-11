import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Calendar, Mail, Clock, Download } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  created_at: string;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface HRBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceTitle: string;
  dateInfo: {
    start_datetime: string;
    end_datetime: string;
    max_participants: number;
  };
  bookings: Booking[];
}

export function HRBookingsDialog({
  open,
  onOpenChange,
  experienceTitle,
  dateInfo,
  bookings,
}: HRBookingsDialogProps) {
  const confirmedCount = bookings.filter((b) => ["confirmed", "completed"].includes(b.status)).length;

  const exportCSV = () => {
    const headers = ["Nome", "Cognome", "Email", "Stato", "Data Prenotazione"];
    const rows = bookings.map((b) => [
      b.user.first_name || "",
      b.user.last_name || "",
      b.user.email,
      b.status === "confirmed" || b.status === "completed" ? "Confermato" : b.status === "cancelled" ? "Annullato" : b.status === "no_show" ? "Assente" : b.status,
      format(new Date(b.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const safeTitle = experienceTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const dateStr = format(new Date(dateInfo.start_datetime), "yyyy-MM-dd");
    link.href = url;
    link.download = `prenotazioni_${safeTitle}_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold pr-8">
            Prenotazioni per {experienceTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Date info + Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-border/50">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Calendar className="h-3 w-3" />
              {format(new Date(dateInfo.start_datetime), "d MMM yyyy", { locale: it })}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Clock className="h-3 w-3" />
              {format(new Date(dateInfo.start_datetime), "HH:mm")} -{" "}
              {format(new Date(dateInfo.end_datetime), "HH:mm")}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Users className="h-3 w-3" />
              {confirmedCount}/{dateInfo.max_participants} posti
            </Badge>
          </div>
          {bookings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="shrink-0 gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Esporta CSV</span>
            </Button>
          )}
        </div>

        {/* Bookings list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {bookings.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nessuna prenotazione per questa data</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {booking.user.first_name || "—"} {booking.user.last_name || ""}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{booking.user.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prenotato il{" "}
                      {format(new Date(booking.created_at), "d MMM yyyy 'alle' HH:mm", {
                        locale: it,
                      })}
                    </p>
                  </div>
                   <Badge
                     variant={["confirmed", "completed"].includes(booking.status) ? "default" : "secondary"}
                     className={
                       ["confirmed", "completed"].includes(booking.status)
                         ? "bg-success/10 text-success border-success/20"
                         : "bg-destructive/10 text-destructive border-destructive/20"
                     }
                   >
                     {booking.status === "confirmed" || booking.status === "completed" ? "Confermato" : booking.status === "cancelled" ? "Annullato" : booking.status === "no_show" ? "Assente" : booking.status}
                   </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
