import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  MapPin,
  Building2,
  Tag,
  Calendar,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { cn } from "@/lib/utils";
import { SDG_DATA } from "@/lib/sdg-data";
import { HRBookingsDialog } from "./HRBookingsDialog";

interface ExperienceDate {
  id: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  volunteer_hours: number | null;
  bookings: {
    id: string;
    status: string;
    created_at: string;
    user: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  }[];
}

interface HRExperienceCardProps {
  experience: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    status: string;
    address: string | null;
    sdgs: string[] | null;
    association: { name: string } | null;
    city: { name: string } | null;
    category: { name: string } | null;
    dates: ExperienceDate[];
  };
}

export function HRExperienceCard({ experience }: HRExperienceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<ExperienceDate | null>(null);

  const now = new Date();
  const futureDates = experience.dates.filter(
    (d) => new Date(d.start_datetime) > now
  );

  return (
    <>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left p-4 sm:p-6 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-start gap-4">
              {/* Image thumbnail using BaseCardImage */}
              {experience.image_url && (
                <div className="hidden sm:block w-20 h-20 shrink-0">
                  <BaseCardImage
                    imageUrl={experience.image_url}
                    alt={experience.title}
                    aspectRatio="square"
                    className="w-20 h-20 rounded-lg"
                  />
                </div>
              )}

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-base leading-tight">
                      {experience.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {experience.association && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Building2 className="h-3 w-3" />
                          {experience.association.name}
                        </Badge>
                      )}
                      {experience.city && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {experience.city.name}
                        </Badge>
                      )}
                      {experience.category && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Tag className="h-3 w-3" />
                          {experience.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Status & expand button */}
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        experience.status === "published"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {experience.status === "published" ? "Pubblicata" : "Bozza"}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-4 mt-3 text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {futureDates.length} eventi futuri
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {experience.dates.reduce(
                      (sum, d) =>
                        sum + d.bookings.filter((b) => ["confirmed", "completed"].includes(b.status)).length,
                      0
                    )}{" "}
                    iscritti totali
                  </span>
                </div>
              </div>
            </div>
          </button>
        </CardHeader>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0 px-4 sm:px-6 pb-6">
                <div className="border-t border-border/50 pt-4 space-y-6">
                  {/* Full image and description */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {experience.image_url && (
                      <div className="md:col-span-1">
                        <BaseCardImage
                          imageUrl={experience.image_url}
                          alt={experience.title}
                          aspectRatio="video"
                          className="rounded-lg"
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "space-y-3",
                        experience.image_url ? "md:col-span-2" : "md:col-span-3"
                      )}
                    >
                      {experience.description && (
                        <p className="text-muted-foreground text-[13px] leading-relaxed">
                          {experience.description}
                        </p>
                      )}
                      {experience.address && (
                        <p className="text-[13px] flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{experience.address}</span>
                        </p>
                      )}

                      {/* SDGs */}
                      {experience.sdgs && experience.sdgs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {experience.sdgs.map((sdg) => {
                            const sdgInfo = SDG_DATA[sdg];
                            if (!sdgInfo) return null;
                            return (
                              <div
                                key={sdg}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: sdgInfo.color }}
                                title={sdgInfo.name}
                              >
                                <span>{sdgInfo.icon}</span>
                                <span>{sdgInfo.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates section */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date programmate
                    </h4>

                    {experience.dates.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4 text-center bg-muted/30 rounded-lg">
                        Nessuna data programmata
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {experience.dates.map((date) => {
                          const confirmedBookings = date.bookings.filter(
                            (b) => b.status === "confirmed"
                          ).length;
                          const fillPercentage = Math.round(
                            (confirmedBookings / date.max_participants) * 100
                          );
                          const isPast = new Date(date.start_datetime) < now;

                          return (
                            <button
                              key={date.id}
                              onClick={() => setSelectedDate(date)}
                              className={cn(
                                "text-left p-3 rounded-lg border border-border/50 hover:bg-muted/30 hover:shadow-sm transition-all group/date",
                                isPast && "opacity-60"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {format(
                                      new Date(date.start_datetime),
                                      "EEEE d MMMM",
                                      { locale: it }
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(date.start_datetime), "HH:mm")} -{" "}
                                    {format(new Date(date.end_datetime), "HH:mm")}
                                  </div>
                                  {date.volunteer_hours && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {date.volunteer_hours}h volontariato
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/date:text-muted-foreground/70 transition-colors shrink-0 mt-1" />
                              </div>

                              {/* Fill rate bar */}
                              <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {confirmedBookings}/{date.max_participants}
                                  </span>
                                  <span
                                    className={cn(
                                      "font-medium",
                                      fillPercentage >= 80
                                        ? "text-destructive"
                                        : fillPercentage >= 50
                                        ? "text-warning"
                                        : "text-success"
                                    )}
                                  >
                                    {fillPercentage}%
                                  </span>
                                </div>
                                <Progress
                                  value={fillPercentage}
                                  className="h-1.5"
                                />
                              </div>

                              {isPast && (
                                <Badge
                                  variant="secondary"
                                  className="mt-2 text-xs"
                                >
                                  Passato
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Bookings Dialog */}
      {selectedDate && (
        <HRBookingsDialog
          open={!!selectedDate}
          onOpenChange={(open) => !open && setSelectedDate(null)}
          experienceTitle={experience.title}
          dateInfo={{
            start_datetime: selectedDate.start_datetime,
            end_datetime: selectedDate.end_datetime,
            max_participants: selectedDate.max_participants,
          }}
          bookings={selectedDate.bookings}
        />
      )}
    </>
  );
}
