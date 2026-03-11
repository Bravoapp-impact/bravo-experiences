import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Loader2, Calendar, Clock, Building2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmployeeParticipationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    total_experiences: number;
    total_hours: number;
  } | null;
}

interface Participation {
  id: string;
  experience_title: string;
  association_name: string | null;
  start_datetime: string;
  volunteer_hours: number | null;
}

export function EmployeeParticipationsDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeParticipationsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [participations, setParticipations] = useState<Participation[]>([]);

  useEffect(() => {
    if (open && employee) {
      fetchParticipations();
    }
  }, [open, employee?.id]);

  const fetchParticipations = async () => {
    if (!employee) return;

    try {
      setLoading(true);

      // Fetch confirmed bookings with experience details
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          experience_dates!inner (
            start_datetime,
            volunteer_hours,
            experiences!inner (
              title,
              association_name
            )
          )
        `)
        .eq("user_id", employee.id)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data and filter only past experiences
      const now = new Date();
      const transformedData: Participation[] = (data || [])
        .map((booking) => {
          const expDate = booking.experience_dates as unknown as {
            start_datetime: string;
            volunteer_hours: number | null;
            experiences: {
              title: string;
              association_name: string | null;
            };
          };

          return {
            id: booking.id,
            experience_title: expDate.experiences.title,
            association_name: expDate.experiences.association_name,
            start_datetime: expDate.start_datetime,
            volunteer_hours: expDate.volunteer_hours,
          };
        })
        .filter((p) => new Date(p.start_datetime) <= now)
        .sort(
          (a, b) =>
            new Date(b.start_datetime).getTime() -
            new Date(a.start_datetime).getTime()
        );

      setParticipations(transformedData);
    } catch (err) {
      devLog.error("Error fetching participations:", err);
    } finally {
      setLoading(false);
    }
  };

  const employeeName = employee
    ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      employee.email
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{employeeName}</DialogTitle>
          {employee && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
              <span>{employee.total_experiences} esperienze</span>
              <span>•</span>
              <span>{employee.total_hours}h totali</span>
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : participations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nessuna partecipazione completata</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 pb-2">
              {participations.map((participation) => (
                <div
                  key={participation.id}
                  className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium text-foreground mb-2 line-clamp-2">
                    {participation.experience_title}
                  </h4>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {participation.association_name && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{participation.association_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(
                          new Date(participation.start_datetime),
                          "d MMMM yyyy",
                          { locale: it }
                        )}
                      </span>
                    </div>

                    {participation.volunteer_hours && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{participation.volunteer_hours}h</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
