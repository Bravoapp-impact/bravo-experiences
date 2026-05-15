import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarDays, Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import PageSection from "@/components/common/PageSection";
import { Badge } from "@/components/ui/badge";

interface UpcomingEvent {
  id: string;
  experience_title: string;
  city: string | null;
  start_datetime: string;
  company_participants: number;
  max_participants: number;
}

interface UpcomingEventsProps {
  events: UpcomingEvent[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <PageSection title="Prossimi Eventi">
        <p className="text-[13px] text-muted-foreground text-center py-8">
          Nessun evento in programma
        </p>
      </PageSection>
    );
  }

  return (
    <PageSection title="Prossimi Eventi">
      <div className="space-y-3">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors"
          >
            <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
              <span className="text-xs text-primary font-medium uppercase">
                {format(new Date(event.start_datetime), "MMM", { locale: it })}
              </span>
              <span className="text-base font-bold text-primary">
                {format(new Date(event.start_datetime), "dd")}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {event.experience_title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(event.start_datetime), "HH:mm")}
                </div>
                {event.city && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {event.city}
                  </div>
                )}
              </div>
            </div>

            <Badge variant="secondary" className="shrink-0 gap-1">
              <Users className="h-3 w-3" />
              {event.company_participants}/{event.max_participants}
            </Badge>
          </motion.div>
        ))}
      </div>
    </PageSection>
  );
}
