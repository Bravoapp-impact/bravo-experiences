import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExperienceCardCompact } from "@/components/experiences/ExperienceCardCompact";
import type { Experience } from "@/types/experiences";

interface RelatedExperiencesListProps {
  experiences: Experience[];
  loading: boolean;
  title: string;
  /** Optional link prefix for card navigation (defaults to /app/experiences). */
  linkPrefix?: string;
}

/**
 * Pure presentational component for a horizontal scrollable list of related experiences.
 * Does no fetching — receives data and renders. Returns null when there's nothing to show.
 */
export function RelatedExperiencesList({
  experiences,
  loading,
  title,
  linkPrefix,
}: RelatedExperiencesListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [experiences.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!loading && experiences.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 lg:h-9 lg:w-9 rounded-full"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label="Scorri indietro"
          >
            <ChevronLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 lg:h-9 lg:w-9 rounded-full"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label="Scorri avanti"
          >
            <ChevronRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[165px] h-[200px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex items-start gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pr-12 scrollbar-hide scroll-smooth"
          >
            {experiences.map((exp, i) => (
              <ExperienceCardCompact
                key={exp.id}
                experience={exp}
                index={i}
                linkPrefix={linkPrefix}
              />
            ))}
          </div>
          <div className="hidden lg:block pointer-events-none absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent" />
        </div>
      )}
    </section>
  );
}
