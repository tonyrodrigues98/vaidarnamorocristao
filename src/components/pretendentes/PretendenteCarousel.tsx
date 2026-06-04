import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { PretendenteFeaturedCard } from "./PretendenteFeaturedCard";

interface PretendenteCarouselProps {
  title: string;
  subtitle?: string;
  profiles: any[];
  affinityByProfile: Record<string, any[]>;
  maxScore: number;
  myAdvanced: any;
  extraPhotos: Record<string, string[]>;
  staffMap: Record<string, any>;
  isSuggestion: (profile: any) => boolean;
}

export function PretendenteCarousel({
  title,
  subtitle,
  profiles,
  affinityByProfile,
  maxScore,
  myAdvanced,
  extraPhotos,
  staffMap,
  isSuggestion,
}: PretendenteCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function scrollLeft() {
    containerRef.current?.scrollBy({
      left: -320,
      behavior: "smooth",
    });
  }

  function scrollRight() {
    containerRef.current?.scrollBy({
      left: 320,
      behavior: "smooth",
    });
  }

  if (!profiles.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>

          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="hidden gap-2 md:flex">
          <Button size="icon" variant="outline" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button size="icon" variant="outline" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="
          flex
          gap-4
          overflow-x-auto
          pb-2
          scrollbar-none
          snap-x
          snap-mandatory
        "
      >
        {profiles.map((p, index) => {
          const chips = affinityByProfile[p.id] ?? [];

          const score =
            maxScore > 0 ? Math.min(99, Math.round((chips.length / maxScore) * 100)) : 0;

          const showScore = chips.length >= 3 && score >= 50 && !!myAdvanced;

          const photos = [...(p.photo_url ? [p.photo_url] : []), ...(extraPhotos[p.id] ?? [])];

          return (
            <div
              key={p.id}
              className="
                w-[280px]
                shrink-0
                snap-start
              "
            >
              <PretendenteFeaturedCard
                profile={p}
                photos={photos}
                score={score}
                showScore={showScore}
                chips={chips}
                eager={index < 3}
                isSuggestion={isSuggestion(p)}
                staff={staffMap[p.id]}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
