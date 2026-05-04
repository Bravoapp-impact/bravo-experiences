import { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle, MapPin, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { HeroImage } from "@/components/experience-detail/HeroImage";
import { WhatYouWillDo } from "@/components/experience-detail/WhatYouWillDo";
import { TagsSection } from "@/components/experience-detail/TagsSection";
import { SdgSection } from "@/components/experience-detail/SdgSection";
import { TBFormatHeader } from "./TBFormatHeader";

export interface TBFormatDetailFormat {
  id: string;
  title: string;
  description: string | null;
  short_description?: string | null;
  image_url: string | null;
  category_name: string | null;
  location_type: string | null;
  duration_hours: number | null;
  participants_min: number | null;
  participants_max: number | null;
  sdgs: string[] | null;
  secondary_tags: string[] | null;
}

interface CityLite {
  id: string;
  name: string;
}

interface AssociationLite {
  id: string;
  name: string;
  logo_url: string | null;
}

interface TBFormatDetailContentProps {
  format: TBFormatDetailFormat;
  services?: string[];
  extraServices?: string[];
  cities?: CityLite[];
  nationwide?: boolean;
  associations?: AssociationLite[];
  headerExtras?: ReactNode;
  sidebarSlot?: ReactNode;
  mobileDrawerSlot?: ReactNode;
}

/**
 * Shared, role-agnostic content for the TB format detail page.
 * Pure presentation: receives data + slot nodes, no fetching, no role conditionals.
 */
export function TBFormatDetailContent({
  format,
  services,
  extraServices,
  cities,
  nationwide,
  associations,
  headerExtras,
  sidebarSlot,
  mobileDrawerSlot,
}: TBFormatDetailContentProps) {
  const showCitiesSection = nationwide || (cities && cities.length > 0);
  const showAssociationsSection = associations && associations.length > 0;
  const showServicesSection = services && services.length > 0;
  const showExtraServicesSection = extraServices && extraServices.length > 0;

  return (
    <>
      {/* Split-screen hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="lg:flex lg:gap-10 lg:items-stretch"
      >
        <div className="lg:w-[55%] flex-shrink-0">
          <HeroImage imageUrl={format.image_url} alt={format.title} />
        </div>
        <div className="mt-4 lg:mt-0 lg:w-[45%] lg:flex lg:flex-col lg:justify-center">
          <TBFormatHeader
            title={format.title}
            categoryName={format.category_name}
            description={format.description}
            locationType={format.location_type}
            durationHours={format.duration_hours}
            participantsMin={format.participants_min}
            participantsMax={format.participants_max}
            headerExtras={headerExtras}
          />
        </div>
      </motion.div>

      {/* Two-column: main + sidebar */}
      <div className="lg:flex lg:gap-12 mt-10">
        <div className="flex-1 min-w-0">
          {format.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Separator className="my-8 lg:hidden" />
              <WhatYouWillDo description={format.description} title="Cosa farete" />
            </motion.div>
          )}

          {format.secondary_tags && format.secondary_tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Separator className="my-8" />
              <TagsSection tags={format.secondary_tags} />
            </motion.div>
          )}

          {format.sdgs && format.sdgs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Separator className="my-8" />
              <SdgSection sdgs={format.sdgs} />
            </motion.div>
          )}

          {showServicesSection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Separator className="my-8" />
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Servizi inclusi</h2>
                <ul className="space-y-2">
                  {services!.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </motion.div>
          )}

          {showExtraServicesSection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Separator className="my-8" />
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Servizi extra</h2>
                <ul className="space-y-2">
                  {extraServices!.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PlusCircle className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </motion.div>
          )}

          {showCitiesSection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Separator className="my-8" />
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Città disponibili</h2>
                {nationwide ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <MapPin className="h-3 w-3 mr-1" />
                    Disponibile in tutta Italia
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cities!.map((city) => (
                      <Badge key={city.id} variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {city.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {showAssociationsSection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Separator className="my-8" />
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Associazioni erogabili</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {associations!.map((assoc) => (
                    <div
                      key={assoc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      {assoc.logo_url ? (
                        <img
                          src={assoc.logo_url}
                          alt={assoc.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {assoc.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium">{assoc.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </div>

        {sidebarSlot}
      </div>

      {mobileDrawerSlot}
    </>
  );
}
