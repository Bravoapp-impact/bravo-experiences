import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { BookingCard } from "@/components/bookings/BookingCard";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isPast } from "date-fns";

interface Booking {
  id: string;
  status: string;
  created_at: string;
  experience_dates: {
    id: string;
    start_datetime: string;
    end_datetime: string;
    experiences: {
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      association_name: string | null;
      association_logo_url?: string | null;
      city: string | null;
      address: string | null;
      category: string | null;
      participant_info?: string | null;
    };
  };
}

export default function MyBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          created_at,
          experience_dates (
            id,
            start_datetime,
            end_datetime,
            experiences (
              id,
              title,
              description,
              image_url,
              association_name,
              association_id,
              city,
              address,
              category,
              participant_info
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setBookings([]);
        return;
      }

      // Filter out bookings with missing nested data (deleted experience/date)
      const validBookings = data.filter(
        (b: any) => b.experience_dates && b.experience_dates.experiences
      );

      // Collect unique association ids
      const assocIds = Array.from(
        new Set(
          validBookings
            .map((b: any) => b.experience_dates.experiences.association_id)
            .filter((id: string | null): id is string => !!id)
        )
      );

      const assocMap = new Map<string, { name: string; logo_url: string | null }>();
      if (assocIds.length > 0) {
        const { data: assocs } = await supabase
          .from("associations_public" as any)
          .select("id, name, logo_url")
          .in("id", assocIds)
          .returns<{ id: string; name: string; logo_url: string | null }[]>();
        (assocs || []).forEach((a) => assocMap.set(a.id, { name: a.name, logo_url: a.logo_url }));
      }

      const transformedBookings = validBookings.map((booking: any) => {
        const exp = booking.experience_dates.experiences;
        const fromView = exp.association_id ? assocMap.get(exp.association_id) : undefined;
        return {
          ...booking,
          experience_dates: {
            ...booking.experience_dates,
            experiences: {
              ...exp,
              association_name: fromView?.name || exp.association_name,
              association_logo_url: fromView?.logo_url || null,
            },
          },
        };
      });

      setBookings(transformedBookings as Booking[]);
    } catch (e) {
      // swallow — keep UI usable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Prenotazione cancellata",
        description:
          "La tua prenotazione è stata cancellata con successo. Se avevi aggiunto l'evento al calendario, ricordati di liberare lo slot.",
      });

      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Non è stato possibile annullare la prenotazione.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Only show future confirmed bookings
  const futureBookings = bookings.filter(
    (b) => !isPast(new Date(b.experience_dates.start_datetime)) && b.status === "confirmed"
  );

  return (
    <AppLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-foreground mb-0.5">
          Le mie attività
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Le tue prossime attività confermate
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/30 p-3">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : futureBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-muted/30 rounded-2xl border border-border/50"
        >
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">Nessuna attività futura</h3>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
            Non hai attività confermate in programma. Esplora il catalogo e prenota la tua prossima esperienza!
          </p>
        </motion.div>
      ) : (
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 1 }}
            className="text-base font-semibold mb-4 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Prossime attività
            <span className="text-[13px] font-normal text-muted-foreground ml-1">
              ({futureBookings.length})
            </span>
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {futureBookings.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                index={index}
                onCancel={handleCancel}
                onView={setSelectedBooking}
                isCancelling={cancellingId === booking.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCancel={handleCancel}
        isCancelling={!!cancellingId}
      />
    </AppLayout>
  );
}
