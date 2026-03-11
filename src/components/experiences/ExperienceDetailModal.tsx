import { useState, useEffect, useMemo } from "react";
import { MapPin, Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, isSameMonth, addMonths, subMonths, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseModal, ModalCloseButton } from "@/components/common/BaseModal";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SDG_DATA } from "@/lib/sdg-data";

import type { Experience, ExperienceDate } from "@/types/experiences";

interface ExperienceDetailModalProps {
  experience: Experience | null;
  onClose: () => void;
  onBookingComplete: () => void;
}

type ModalStep = "detail" | "dates";

export function ExperienceDetailModal({
  experience,
  onClose,
  onBookingComplete,
}: ExperienceDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<ModalStep>("detail");
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [dates, setDates] = useState<ExperienceDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

  const [userBookedDateIds, setUserBookedDateIds] = useState<Set<string>>(new Set());

  // Fetch dates when entering the dates step
  useEffect(() => {
    if (!experience || step !== "dates") return;

    const fetchDates = async () => {
      setLoadingDates(true);
      setSelectedDateId(null);
      try {
        const { data, error } = await supabase
          .from("experience_dates")
          .select("id, start_datetime, end_datetime, max_participants")
          .eq("experience_id", experience.id)
          .gte("start_datetime", new Date().toISOString())
          .order("start_datetime", { ascending: true });

        if (error) throw error;

        const dateIds = (data || []).map((d) => d.id);
        const confirmedCountsMap = new Map<string, number>();
        const bookedByUser = new Set<string>();

        if (dateIds.length > 0) {
          // Fetch all confirmed bookings + check which ones belong to current user
          const { data: confirmedBookings } = await supabase
            .from("bookings")
            .select("experience_date_id, user_id")
            .in("experience_date_id", dateIds)
            .eq("status", "confirmed");

          (confirmedBookings || []).forEach((b) => {
            const prev = confirmedCountsMap.get(b.experience_date_id) || 0;
            confirmedCountsMap.set(b.experience_date_id, prev + 1);
            if (b.user_id === user?.id) {
              bookedByUser.add(b.experience_date_id);
            }
          });
        }

        setUserBookedDateIds(bookedByUser);

        const datesWithCount = (data || []).map((date) => ({
          ...date,
          confirmed_count: confirmedCountsMap.get(date.id) || 0,
        }));

        setDates(datesWithCount);
        
        if (datesWithCount.length > 0) {
          setCurrentMonth(startOfMonth(new Date(datesWithCount[0].start_datetime)));
        }
      } catch (error) {
        console.error("Error fetching dates:", error);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchDates();
  }, [experience, step, user?.id]);

  // Group dates by day within current month
  const datesByDay = useMemo(() => {
    const grouped = new Map<string, ExperienceDate[]>();
    
    dates
      .filter((date) => isSameMonth(new Date(date.start_datetime), currentMonth))
      .forEach((date) => {
        const dayKey = format(new Date(date.start_datetime), "yyyy-MM-dd");
        const existing = grouped.get(dayKey) || [];
        grouped.set(dayKey, [...existing, date]);
      });

    return grouped;
  }, [dates, currentMonth]);

  // Available months (those with dates)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    dates.forEach((date) => {
      months.add(format(new Date(date.start_datetime), "yyyy-MM"));
    });
    return months;
  }, [dates]);

  const canGoBack = availableMonths.size > 0 && 
    Array.from(availableMonths).some((m) => m < format(currentMonth, "yyyy-MM"));
  
  const canGoForward = availableMonths.size > 0 && 
    Array.from(availableMonths).some((m) => m > format(currentMonth, "yyyy-MM"));

  // Reset step when modal closes
  useEffect(() => {
    if (!experience) {
      setStep("detail");
      setSelectedDateId(null);
    }
  }, [experience]);

  if (!experience) return null;

  const handleBook = async () => {
    if (!selectedDateId || !user) return;

    setIsBooking(true);
    try {
      const { data: bookingData, error } = await supabase.from("bookings").insert({
        user_id: user.id,
        experience_date_id: selectedDateId,
        status: "confirmed",
      }).select().single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Sei già prenotato per questa data");
        }
        throw error;
      }

      // Trigger confirmation email
      if (bookingData) {
        supabase.functions.invoke("send-booking-confirmation", {
          body: { booking_id: bookingData.id },
        });
      }

      toast({
        title: "Prenotazione confermata! 🎉",
        description: "Ti aspettiamo per questa esperienza di volontariato.",
      });

      onBookingComplete();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore di prenotazione",
        description: error.message || "Non è stato possibile completare la prenotazione.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleShowDates = () => {
    setStep("dates");
  };

  const handleBackToDetail = () => {
    setStep("detail");
    setSelectedDateId(null);
  };

  return (
    <BaseModal
      open={!!experience}
      onClose={onClose}
      showBackButton={step === "dates"}
      onBack={handleBackToDetail}
      title={step === "dates" ? "Seleziona una data" : undefined}
    >
      {step === "detail" ? (
        /* DETAIL VIEW */
        <div className="flex flex-col max-h-[80vh] sm:max-h-[85vh]">
          {/* Close button overlay */}
          <div className="absolute top-4 right-4 z-10">
            <ModalCloseButton onClick={onClose} />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Square Image */}
            <BaseCardImage
              imageUrl={experience.image_url}
              alt={experience.title}
              aspectRatio="square"
              fallbackEmoji="🤝"
              className="rounded-none"
            />

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Category badge */}
              {experience.category && (
                <Badge variant="secondary" className="rounded-full">
                  {experience.category}
                </Badge>
              )}

              {/* Title */}
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {experience.title}
              </h2>

              {/* Description */}
              {experience.description && (
                <p className="text-[15px] text-muted-foreground font-light leading-relaxed">
                  {experience.description}
                </p>
              )}

              {/* Association */}
              {experience.association_name && (
                <div className="flex items-center gap-2 pt-2">
                  {experience.association_logo_url ? (
                    <img
                      src={experience.association_logo_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm">🏢</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {experience.association_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Associazione partner</p>
                  </div>
                </div>
              )}

              {/* Address */}
              {(experience.city || experience.address) && (
                <div className="flex items-start gap-2 pt-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {experience.address && `${experience.address}, `}
                    {experience.city}
                  </p>
                </div>
              )}

              {/* Participant info */}
              {experience.participant_info && (
                <div className="pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Informazioni per i partecipanti
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {experience.participant_info}
                  </p>
                </div>
              )}

              {/* SDGs */}
              {experience.sdgs && experience.sdgs.length > 0 && (
                <div className="pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Obiettivi di sostenibilità
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {experience.sdgs.map((sdgCode) => {
                      const sdg = SDG_DATA[sdgCode];
                      if (!sdg) return null;
                      return (
                        <div
                          key={sdgCode}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${sdg.color}15`,
                            color: sdg.color 
                          }}
                        >
                          <span>{sdg.icon}</span>
                          <span>{sdg.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed footer with CTA */}
          <div className="flex-shrink-0 p-5 border-t border-border bg-background">
            <Button 
              onClick={handleShowDates}
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              Vedi date disponibili
            </Button>
          </div>
        </div>
      ) : (
        /* DATE SELECTION VIEW */
        <div className="flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          {/* Month navigation */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              disabled={!canGoBack}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-base font-semibold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: it })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              disabled={!canGoForward}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable date slots */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {loadingDates ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : datesByDay.size > 0 ? (
              Array.from(datesByDay.entries()).map(([dayKey, dayDates]) => (
                <div key={dayKey} className="space-y-3">
                  {/* Day header */}
                  <h4 className="text-base font-semibold text-foreground">
                    {format(new Date(dayKey), "EEEE, d MMMM", { locale: it })}
                  </h4>

                  {/* Time slots for this day */}
                  <div className="space-y-2">
                    {dayDates.map((date) => {
                      const availableSpots = date.max_participants - (date.confirmed_count || 0);
                      const isFull = availableSpots <= 0;
                      const isSelected = selectedDateId === date.id;

                      return (
                        <button
                          key={date.id}
                          disabled={isFull}
                          onClick={() => setSelectedDateId(date.id)}
                          className={`
                            w-full p-4 rounded-2xl border text-left transition-all
                            ${isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-muted/30"
                            }
                            ${isFull ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-base font-medium text-foreground">
                                {format(new Date(date.start_datetime), "HH:mm")}–
                                {format(new Date(date.end_datetime), "HH:mm")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span className={isFull ? "text-destructive font-medium" : ""}>
                                {isFull ? "Completo" : `${availableSpots} posti`}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nessuna data disponibile in questo mese
                </p>
              </div>
            )}
          </div>

          {/* Fixed footer with confirm button */}
          <div className="flex-shrink-0 p-5 border-t border-border bg-background">
            <Button
              onClick={handleBook}
              disabled={!selectedDateId || isBooking}
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              {isBooking ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Conferma prenotazione"
              )}
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
