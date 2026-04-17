import { Badge } from "@/components/ui/badge";

interface TagsSectionProps {
  tags: string[];
}

export function TagsSection({ tags }: TagsSectionProps) {
  if (!tags.length) return null;

  return (
    <section>
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
