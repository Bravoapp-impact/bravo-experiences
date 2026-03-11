import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Loader2, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BookingCard } from "@/components/bookings/BookingCard";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { FeedbackModal } from "@/components/bookings/FeedbackModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isPast } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [feedbackBooking, setFeedbackBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    if (!user) return;

    setLoading(true);
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
            city,
            address,
            category,
            participant_info,
            associations:association_id (
              name,
              logo_url
            )
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const transformedBookings = data.map((booking: any) => ({
        ...booking,
        experience_dates: {
          ...booking.experience_dates,
          experiences: {
            ...booking.experience_dates.experiences,
            association_name:
              booking.experience_dates.experiences.associations?.name ||
              booking.experience_dates.experiences.association_name,
            association_logo_url:
              booking.experience_dates.experiences.associations?.logo_url || null,
          },
        },
      }));
      setBookings(transformedBookings as Booking[]);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("experience_reviews" as any)
      .select("booking_id")
      .returns<{ booking_id: string }[]>();

    if (data) {
      setReviewedBookingIds(new Set(data.map((r) => r.booking_id)));
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchReviews();
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
        title: "Prenotazione annullata",
        description: "La tua prenotazione è stata annullata con successo.",
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

  const handleFeedbackSubmitted = () => {
    setFeedbackBooking(null);
    fetchReviews();
  };

  // Split bookings into future and past
  const futureBookings = bookings.filter(
    (b) => !isPast(new Date(b.experience_dates.start_datetime)) && b.status === "confirmed"
  );
  const pastBookings = bookings.filter(
    (b) => isPast(new Date(b.experience_dates.start_datetime)) || ["cancelled", "completed", "no_show"].includes(b.status)
  );

  // Count past done bookings without reviews
  const pendingFeedbackCount = pastBookings.filter(
    (b) => ["confirmed", "completed"].includes(b.status) && !reviewedBookingIds.has(b.id)
  ).length;

  return (
    <AppLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-foreground mb-0.5">
          Le mie prenotazioni
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Gestisci le tue esperienze di volontariato
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-muted/30 rounded-2xl border border-border/50"
        >
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">Nessuna prenotazione</h3>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
            Non hai ancora prenotato nessuna esperienza. Esplora il catalogo!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-12">
          {/* Future bookings */}
          {futureBookings.length > 0 && (
            <section>
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-base font-semibold mb-4 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Prossime esperienze
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

          {/* Past bookings - Collapsible */}
          {pastBookings.length > 0 && (
            <section>
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="flex items-center gap-2 py-2 group"
              >
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-[15px] font-medium text-muted-foreground"
                >
                  Storico
                </motion.h2>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    historyExpanded && "rotate-180"
                  )} 
                />
                <span className="text-sm text-muted-foreground">
                  ({pastBookings.length})
                </span>
                {pendingFeedbackCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {pendingFeedbackCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {historyExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-4">
                      {pastBookings.map((booking, index) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          index={index}
                          isPast
                          hasReview={reviewedBookingIds.has(booking.id)}
                          onCancel={handleCancel}
                          onView={setSelectedBooking}
                          onFeedback={booking.status === "confirmed" ? setFeedbackBooking : undefined}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCancel={handleCancel}
        isCancelling={!!cancellingId}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        open={!!feedbackBooking}
        onClose={() => setFeedbackBooking(null)}
        onSubmitted={handleFeedbackSubmitted}
        booking={feedbackBooking}
      />
    </AppLayout>
  );
}
