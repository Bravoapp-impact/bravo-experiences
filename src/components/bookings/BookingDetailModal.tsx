import { useNavigate } from "react-router-dom";
import { Building, Info, CalendarX } from "lucide-react";
import { format, differenceInHours, subDays } from "date-fns";
import { it } from "date-fns/locale";

const CANCELLATION_WINDOW_DAYS = 14;
const CANCELLATION_WINDOW_HOURS = CANCELLATION_WINDOW_DAYS * 24;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BaseModal, ModalCloseButton } from "@/components/common/BaseModal";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { MeetingPlace } from "@/components/experience-detail/MeetingPlace";
import { ParticipantInfo } from "@/components/experience-detail/ParticipantInfo";
import { getBookingStatusLabel } from "@/lib/booking-utils";
import { MyEventPhotosSection } from "./MyEventPhotosSection";

interface BookingDetailModalProps {
  booking: {
    id: string;
    status: string;
    experience_dates: {
      id?: string;
      start_datetime: string;
      end_datetime: string;
      experiences: {
        id?: string;
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
  } | null;
  onClose: () => void;
  onCancel?: (bookingId: string) => void;
  isCancelling?: boolean;
  onUploadPhotos?: (booking: NonNullable<BookingDetailModalProps["booking"]>) => void;
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  verified: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

export function BookingDetailModal({ booking, onClose, onCancel, isCancelling, onUploadPhotos }: BookingDetailModalProps) {
  const navigate = useNavigate();
  if (!booking) return null;

  const experience = booking.experience_dates.experiences;
  const startDate = new Date(booking.experience_dates.start_datetime);
  const endDate = new Date(booking.experience_dates.end_datetime);

  const hoursUntilEvent = differenceInHours(startDate, new Date());
  const isPastEvent = hoursUntilEvent <= 0;
  const isConfirmedFuture = booking.status === "confirmed" && !isPastEvent;
  const canCancel = isConfirmedFuture && hoursUntilEvent > 48;

  const description = experience.description?.trim() || "";
  const hasDescription = description.length > 0;

  const handleSeeFullDetail = () => {
    if (!experience.id) return;
    onClose();
    navigate(`/app/experiences/${experience.id}`);
  };

  return (
    <BaseModal open={!!booking} onClose={onClose}>
      <div className="flex flex-col h-full sm:max-h-[85vh]">
        {/* Close button overlay */}
        <div className="absolute top-4 right-4 z-10">
          <ModalCloseButton onClick={onClose} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Compact 16:9 image */}
          <BaseCardImage
            imageUrl={experience.image_url}
            alt={experience.title}
            aspectRatio="video"
            fallbackEmoji="🤝"
            className="rounded-none"
            badge={
              <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? "secondary"}>
                {getBookingStatusLabel(booking.status)}
              </Badge>
            }
            badgePosition="top-left"
          />

          <div className="p-5 space-y-6">
            {/* Title + Association */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {experience.title}
              </h2>

              {experience.association_name && (
                <div className="flex items-center gap-2">
                  {experience.association_logo_url ? (
                    <img
                      src={experience.association_logo_url}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {experience.association_name}
                  </p>
                </div>
              )}
            </div>

            {/* WHEN — most prominent */}
            <section>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                Quando
              </h3>
              <p className="text-lg font-semibold text-foreground capitalize leading-tight">
                {format(startDate, "EEEE d MMMM yyyy", { locale: it })}
              </p>
              <p className="text-base text-foreground mt-1">
                {format(startDate, "HH:mm")} – {format(endDate, "HH:mm")}
              </p>
            </section>

            {/* WHERE */}
            <MeetingPlace address={experience.address} cityName={experience.city} />

            {/* WHAT TO BRING / PARTICIPANT INFO */}
            {experience.participant_info?.trim() ? (
              <ParticipantInfo info={experience.participant_info} />
            ) : (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Informazioni utili</h2>
                <div className="flex items-start gap-3 text-[15px] text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/70" />
                  <span>L'associazione ti invierà ulteriori dettagli prima dell'evento.</span>
                </div>
              </section>
            )}

            {/* DESCRIPTION */}
            {hasDescription && (
              <section>
                <h3 className="text-base font-semibold text-foreground mb-2">Descrizione</h3>
                <p className="text-[15px] text-muted-foreground font-light leading-relaxed line-clamp-4">
                  {description}
                </p>
                {experience.id && (
                  <button
                    type="button"
                    onClick={handleSeeFullDetail}
                    className="mt-2 text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                  >
                    Vedi tutto il dettaglio dell'esperienza
                  </button>
                )}
              </section>
            )}

            {/* MY PHOTOS — only for past events */}
            {isPastEvent && (
              <MyEventPhotosSection
                experienceDateId={(booking as any).experience_date_id ?? (booking.experience_dates as any).id}
                onUploadClick={onUploadPhotos ? () => onUploadPhotos(booking) : undefined}
              />
            )}

            {/* IN CASO DI IMPREVISTO */}
            {isConfirmedFuture && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">In caso di imprevisto</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Se non puoi più partecipare, annulla la tua prenotazione con il pulsante qui sotto.
                  Per annullamenti dell'ultimo minuto (meno di 48 ore dall'evento), contatta chi gestisce
                  il programma di volontariato nella tua azienda.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t border-border bg-background">
          {canCancel && onCancel ? (
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
            >
              {isCancelling ? "Annullamento in corso..." : "Annulla prenotazione"}
            </Button>
          ) : isConfirmedFuture ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center py-2 bg-muted/50 rounded-lg">
                Non è più possibile annullare online
              </p>
              <Button onClick={onClose} className="w-full h-12 text-base font-medium rounded-xl">
                Chiudi
              </Button>
            </div>
          ) : (
            <Button onClick={onClose} className="w-full h-12 text-base font-medium rounded-xl">
              Chiudi
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
