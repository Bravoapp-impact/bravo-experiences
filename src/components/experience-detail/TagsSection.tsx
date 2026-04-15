import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TagsSectionProps {
  tags: string[];
}

export function TagsSection({ tags }: TagsSectionProps) {
  if (!tags.length) return null;

  return (
    <section>
      <Separator className="mb-8" />
      <h2 className="text-xl font-semibold text-foreground mb-4">Caratteristiche</h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="rounded-full text-sm px-3 py-1">
            {tag}
          </Badge>
        ))}
      </div>
    </section>
  );
}
