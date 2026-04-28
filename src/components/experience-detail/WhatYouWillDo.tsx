import { useState } from "react";

interface WhatYouWillDoProps {
  description: string;
  title?: string;
}

export function WhatYouWillDo({ description, title = "Cosa farai" }: WhatYouWillDoProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 400;

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Cosa farai</h2>
      <div className="relative">
        <p
          className={`text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line ${
            !expanded && isLong ? "line-clamp-5" : ""
          }`}
        >
          {description}
        </p>
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          {expanded ? "Mostra meno" : "Mostra altro"}
        </button>
      )}
    </section>
  );
}
