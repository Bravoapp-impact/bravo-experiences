import { MapPin, Calendar, Clock, Building, Sun, CloudRain, Shirt, Info, Navigation, X } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BaseModal, ModalCloseButton } from "@/components/common/BaseModal";
import { BaseCardImage } from "@/components/common/BaseCardImage";

interface BookingDetailModalProps {
  booking: {
    id: string;
    status: string;
    experience_dates: {
      start_datetime: string;
      end_datetime: string;
      experiences: {
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
}

// Tips based on category
const getCategoryTips = (category: string | null): { icon: React.ReactNode; title: string; tips: string[] } => {
  switch (category?.toLowerCase()) {
    case "ambiente":
      return {
        icon: <Sun className="h-5 w-5 text-primary" />,
        title: "Consigli per attività all'aperto",
        tips: [
          "Indossa abiti comodi che possono sporcarsi",
          "Porta scarpe chiuse e robuste (no sandali)",
          "Crema solare e cappello se c'è sole",
          "Porta una bottiglia d'acqua riutilizzabile",
          "Guanti da lavoro saranno forniti dall'associazione",
        ],
      };
    case "sociale":
      return {
        icon: <Shirt className="h-5 w-5 text-primary" />,
        title: "Come prepararsi",
        tips: [
          "Abbigliamento casual ma ordinato",
          "Scarpe comode per stare in piedi",
          "Arriva 10 minuti prima per il briefing",
          "Porta un documento d'identità",
        ],
      };
    case "educazione":
      return {
        icon: <Info className="h-5 w-5 text-primary" />,
        title: "Suggerimenti utili",
        tips: [
          "Porta pazienza e un sorriso!",
          "Abbigliamento casual e colorato piace ai bambini",
          "Se hai giochi o libri da condividere, portali pure",
          "Arriva qualche minuto prima per conoscere gli educatori",
        ],
      };
    case "anziani":
      return {
        icon: <Info className="h-5 w-5 text-primary" />,
        title: "Per una visita perfetta",
        tips: [
          "Parla lentamente e chiaramente",
          "Porta qualche foto o giornale da sfogliare insieme",
          "Abbigliamento ordinato ma non formale",
          "Evita profumi troppo forti",
          "La cosa più importante è ascoltare",
        ],
      };
    case "animali":
      return {
        icon: <CloudRain className="h-5 w-5 text-primary" />,
        title: "Preparati al meglio",
        tips: [
          "Vestiti che possono sporcarsi (molto!)",
          "Scarpe chiuse e robuste obbligatorie",
          "Porta guanti da lavoro se li hai",
          "Non portare cibo per gli animali",
          "Lascia a casa i tuoi animali domestici",
        ],
      };
    default:
      return {
        icon: <Info className="h-5 w-5 text-primary" />,
        title: "Informazioni utili",
        tips: [
          "Arriva 10-15 minuti prima dell'orario",
          "Porta un documento d'identità",
          "Abbigliamento comodo consigliato",
          "In caso di imprevisti, contatta l'associazione",
        ],
      };
  }
};

export function BookingDetailModal({ booking, onClose, onCancel, isCancelling }: BookingDetailModalProps) {
  if (!booking) return null;

  const experience = booking.experience_dates.experiences;
  const startDate = new Date(booking.experience_dates.start_datetime);
  const endDate = new Date(booking.experience_dates.end_datetime);
  const tips = getCategoryTips(experience.category);
  
  const hoursUntilEvent = differenceInHours(startDate, new Date());
  const canCancel = hoursUntilEvent > 48 && booking.status === "confirmed";
  const isPastEvent = hoursUntilEvent <= 0;

  const handleOpenMaps = () => {
    const query = encodeURIComponent(
      `${experience.address || ""} ${experience.city || ""}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <BaseModal open={!!booking} onClose={onClose}>
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
            badge={
              booking.status === "cancelled" ? (
                <Badge variant="destructive">Prenotazione annullata</Badge>
              ) : null
            }
            badgePosition="top-left"
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

            {/* Association */}
            {experience.association_name && (
              <div className="flex items-center gap-2">
                {experience.association_logo_url ? (
                  <img
                    src={experience.association_logo_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Building className="h-4 w-4 text-muted-foreground" />
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

            {/* Date & Time highlight card */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <p className="font-semibold">
                  {format(startDate, "EEEE d MMMM yyyy", { locale: it })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <p>
                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                </p>
              </div>
            </div>

            {/* Location with Maps link */}
            {(experience.city || experience.address) && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    {experience.city && (
                      <p className="font-medium">{experience.city}</p>
                    )}
                    {experience.address && (
                      <p className="text-sm text-muted-foreground">
                        {experience.address}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenMaps}
                  className="w-full"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Apri in Google Maps
                </Button>
              </div>
            )}

            {/* Description */}
            {experience.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrizione</h3>
                <p className="text-[15px] text-muted-foreground font-light leading-relaxed">
                  {experience.description}
                </p>
              </div>
            )}

            {/* Tips Section */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              {experience.participant_info ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Informazioni utili</h3>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {experience.participant_info}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    {tips.icon}
                    <h3 className="font-semibold">{tips.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {tips.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Fixed footer */}
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
          ) : !canCancel && ["confirmed", "completed"].includes(booking.status) && !isPastEvent && hoursUntilEvent <= 48 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center py-2 bg-muted/50 rounded-lg">
                Non annullabile (meno di 48h all'evento)
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
