import { useState, useEffect, useMemo } from "react";
import { devLog } from "@/lib/logger";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Users, ChevronLeft, ChevronRight, Loader2, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { format, isSameMonth, addMonths, subMonths, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHourBudget } from "@/hooks/useHourBudget";
import { SDG_DATA } from "@/lib/sdg-data";
import type { Experience, ExperienceDate } from "@/types/experiences";

type PageStep = "detail" | "dates" | "success";

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { remainingHours, isUnlimited, budgetHours, loading: budgetLoading } = useHourBudget();

  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<PageStep>("detail");
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [dates, setDates] = useState<ExperienceDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [userBookedDateIds, setUserBookedDateIds] = useState<Set<string>>(new Set());

  // Fetch experience
  useEffect(() => {
    if (!id) return;

    const fetchExperience = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("experiences")
          .select(`
            *,
            associations:association_id (
              name,
              logo_url
            )
          `)
          .eq("id", id)
          .eq("status", "published")
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setExperience({
          id: data.id,
          title: data.title,
          description: data.description,
          image_url: data.image_url,
          association_name: (data.associations as any)?.name ?? data.association_name,
          association_logo_url: (data.associations as any)?.logo_url ?? null,
          city: data.city,
          address: data.address,
          category: data.category,
          sdgs: data.sdgs ?? [],
          participant_info: data.participant_info ?? null,
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [id]);

  // Fetch dates when entering dates step
  useEffect(() => {
    if (!experience || step !== "dates") return;

    const fetchDates = async () => {
      setLoadingDates(true);
      setSelectedDateId(null);
      try {
        const { data, error } = await supabase
          .from("experience_dates")
          .select("id, start_datetime, end_datetime, max_participants, volunteer_hours")
          .eq("experience_id", experience.id)
          .gte("start_datetime", new Date().toISOString())
          .order("start_datetime", { ascending: true });

        if (error) throw error;

        const dateIds = (data || []).map((d) => d.id);
        const confirmedCountsMap = new Map<string, number>();
        const bookedByUser = new Set<string>();

        if (dateIds.length > 0) {
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
        devLog.error("Error fetching dates:", error);
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

      if (bookingData) {
        supabase.functions.invoke("send-booking-confirmation", {
          body: { booking_id: bookingData.id },
        });
      }

      toast({
        title: "Prenotazione confermata! 🎉",
        description: "Ti aspettiamo per questa esperienza di volontariato.",
      });

      setStep("success");
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

  const goBack = () => navigate("/app/experiences");

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </AppLayout>
    );
  }

  // Not found
  if (notFound || !experience) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-semibold mb-2">Esperienza non trovata</h2>
          <p className="text-sm text-muted-foreground mb-6">
            L'esperienza che cerchi non esiste o non è disponibile.
          </p>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al catalogo
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-bold mb-2">Prenotazione confermata!</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Ti aspettiamo per <strong>{experience.title}</strong>. Riceverai un'email di conferma.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/app/bookings")}>
                Le mie prenotazioni
              </Button>
              <Button variant="outline" onClick={goBack}>
                Torna al catalogo
              </Button>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // Build Google Maps link
  const mapsQuery = [experience.address, experience.city].filter(Boolean).join(", ");
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` : null;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto pb-24">
        {/* Back button */}
        <button
          onClick={step === "dates" ? () => { setStep("detail"); setSelectedDateId(null); } : goBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "dates" ? "Torna ai dettagli" : "Torna al catalogo"}
        </button>

        {step === "detail" ? (
          /* ─── DETAIL VIEW ─── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Hero image */}
            <BaseCardImage
              imageUrl={experience.image_url}
              alt={experience.title}
              aspectRatio="square"
              fallbackEmoji="🤝"
              className="rounded-xl overflow-hidden"
            />

            {/* Category badge */}
            {experience.category && (
              <Badge variant="secondary" className="rounded-full">
                {experience.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {experience.title}
            </h1>

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
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {experience.address && `${experience.address}, `}
                    {experience.city}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {experience.address && `${experience.address}, `}
                    {experience.city}
                  </p>
                )}
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
                          color: sdg.color,
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
          </motion.div>
        ) : (
          /* ─── DATE SELECTION VIEW ─── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Seleziona una data</h2>

            {/* Month navigation */}
            <div className="flex items-center justify-between py-2">
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

            {/* Hour budget banner */}
            {!isUnlimited && !budgetLoading && (
              <div>
                {remainingHours <= 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Hai esaurito le {budgetHours} ore disponibili quest'anno</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>Ore rimanenti: <strong className="text-foreground">{remainingHours}</strong> / {budgetHours}</span>
                  </div>
                )}
              </div>
            )}

            {/* Date slots */}
            <div className="space-y-6">
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
                    <h4 className="text-base font-semibold text-foreground">
                      {format(new Date(dayKey), "EEEE, d MMMM", { locale: it })}
                    </h4>
                    <div className="space-y-2">
                      {dayDates.map((date) => {
                        const availableSpots = date.max_participants - (date.confirmed_count || 0);
                        const isFull = availableSpots <= 0;
                        const isBookedByUser = userBookedDateIds.has(date.id);
                        const dateHours = Number(date.volunteer_hours) || 0;
                        const exceedsBudget = !isUnlimited && dateHours > remainingHours;
                        const isDisabled = isFull || isBookedByUser || exceedsBudget;
                        const isSelected = selectedDateId === date.id;

                        return (
                          <button
                            key={date.id}
                            disabled={isDisabled}
                            onClick={() => setSelectedDateId(date.id)}
                            className={`
                              w-full p-4 rounded-2xl border text-left transition-all
                              ${isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:bg-muted/30"
                              }
                              ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
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
                                {isBookedByUser ? (
                                  <span className="text-primary font-medium">✓ Già prenotato</span>
                                ) : exceedsBudget ? (
                                  <span className="text-destructive font-medium text-xs">Ore insufficienti</span>
                                ) : (
                                  <>
                                    <Users className="h-4 w-4" />
                                    <span className={isFull ? "text-destructive font-medium" : ""}>
                                      {isFull ? "Completo" : `${availableSpots} posti`}
                                    </span>
                                  </>
                                )}
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
          </motion.div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      {step === "detail" && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={() => setStep("dates")}
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              Vedi date disponibili
            </Button>
          </div>
        </div>
      )}

      {step === "dates" && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40">
          <div className="max-w-lg mx-auto">
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
    </AppLayout>
  );
}
