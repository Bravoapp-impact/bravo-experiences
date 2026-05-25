import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExperienceCardCompact } from "./ExperienceCardCompact";
import type { Experience } from "@/types/experiences";

interface ExperienceSectionProps {
  title: string;
  experiences: Experience[];
}

export function ExperienceSection({ title, experiences }: ExperienceSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (experiences.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Header with navigation arrows (desktop only) */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        
        {/* Desktop navigation arrows */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal scroll container - Airbnb-style edge-to-edge on both sides */}
      <div className="overflow-x-auto scrollbar-hide -mx-8">
        <div
          ref={scrollRef}
          className="flex items-start gap-2.5 pl-8 pr-16 md:pr-20"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {experiences.map((experience, index) => (
            <div key={experience.id} style={{ scrollSnapAlign: "start" }}>
              <ExperienceCardCompact
                experience={experience}
                index={index}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
