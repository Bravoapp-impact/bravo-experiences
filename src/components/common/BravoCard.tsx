import { Fragment, ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { cn } from "@/lib/utils";

export interface BravoCardMetaItem {
  icon?: LucideIcon;
  text: string;
}

export interface BravoCardProps {
  imageUrl: string | null | undefined;
  imageAlt: string;
  aspectRatio?: "square" | "video";
  fallbackEmoji?: string;
  imageOverlay?: ReactNode;
  title: string;
  subtitleSlot?: ReactNode;
  metaItems?: BravoCardMetaItem[];
  onOpen?: () => void;
  actions?: ReactNode;
  dimmed?: boolean;
  index?: number;
  className?: string;
}

export function BravoCard({
  imageUrl,
  imageAlt,
  aspectRatio = "square",
  fallbackEmoji,
  imageOverlay,
  title,
  subtitleSlot,
  metaItems,
  onOpen,
  actions,
  dimmed = false,
  index = 0,
  className,
}: BravoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className={cn("group", dimmed && "opacity-60", className)}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="block w-full text-left rounded-xl focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
      >
        <div className="relative">
          <BaseCardImage
            imageUrl={imageUrl ?? null}
            alt={imageAlt}
            aspectRatio={aspectRatio}
            fallbackEmoji={fallbackEmoji}
          />
          {imageOverlay}
        </div>
        <div className="pt-2 space-y-1">
          <h3 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>
          {subtitleSlot}
          {metaItems && metaItems.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
              {metaItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Fragment key={i}>
                    {i > 0 && <span>·</span>}
                    <span className="flex items-center gap-0.5 truncate">
                      {Icon && <Icon className="h-2.5 w-2.5 flex-shrink-0" />}
                      {item.text}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      </button>
      {actions && (
        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </motion.div>
  );
}
