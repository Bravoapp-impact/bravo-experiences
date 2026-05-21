import { MapPin, ExternalLink } from "lucide-react";

interface MeetingPlaceProps {
  address: string | null;
  cityName: string | null;
}

export function MeetingPlace({ address, cityName }: MeetingPlaceProps) {
  const fullAddress = [address, cityName].filter(Boolean).join(", ");
  if (!fullAddress) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Dove ci incontreremo</h2>
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-[15px] text-foreground">{fullAddress}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Apri in Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      {address && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <iframe
            src={embedUrl}
            title="Mappa del luogo di incontro"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-[260px] block border-0"
          />
        </div>
      )}
    </section>
  );
}
