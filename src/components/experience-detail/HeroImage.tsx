import { cn } from "@/lib/utils";

interface HeroImageProps {
  imageUrl: string | null;
  alt: string;
}

export function HeroImage({ imageUrl, alt }: HeroImageProps) {
  return (
    <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-muted aspect-[4/3] lg:aspect-[16/10]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-6xl">🤝</span>
        </div>
      )}
    </div>
  );
}
