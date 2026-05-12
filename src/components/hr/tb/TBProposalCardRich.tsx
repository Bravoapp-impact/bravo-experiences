import { motion } from "framer-motion";
import { Clock, Users, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { cn } from "@/lib/utils";

export interface TBProposalCardData {
  proposal_id: string;
  client_status: string;
  format_title: string;
  format_description: string | null;
  format_short_description: string | null;
  format_image_url: string | null;
  format_category_name: string | null;
  format_duration_hours: number | null;
  format_participants_min: number | null;
  format_participants_max: number | null;
}

interface TBProposalCardProps {
  proposal: TBProposalCardData;
  index: number;
  readOnly?: boolean;
  onOpenDetail: () => void;
  onToggleInterest: () => void;
  onToggleDecline: () => void;
}

export function TBProposalCard({
  proposal,
  index,
  readOnly = false,
  onOpenDetail,
  onToggleInterest,
  onToggleDecline,
}: TBProposalCardProps) {
  const isInterested = proposal.client_status === "interested";
  const isDeclined = proposal.client_status === "declined";
  const subtitle = proposal.format_short_description ?? proposal.format_description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn(
        "group relative bg-card rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-md flex flex-col",
        isInterested && "ring-1 ring-primary/40",
        isDeclined && "opacity-50"
      )}
    >
      <div className="cursor-pointer" onClick={onOpenDetail}>
        <BaseCardImage
          imageUrl={proposal.format_image_url}
          alt={proposal.format_title}
          aspectRatio="video"
          fallbackEmoji="✨"
          badge={
            proposal.format_category_name ? (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                {proposal.format_category_name}
              </Badge>
            ) : null
          }
          badgePosition="top-left"
          className="rounded-none"
        />
      </div>

      <div className="p-6 space-y-3 flex-1 flex flex-col">
        <div className="cursor-pointer space-y-2" onClick={onOpenDetail}>
          <h3 className="text-base font-semibold text-foreground line-clamp-2">
            {proposal.format_title}
          </h3>
          {subtitle && (
            <p className="text-[13px] text-muted-foreground line-clamp-2">{subtitle}</p>
          )}
        </div>

        {(proposal.format_duration_hours ||
          (proposal.format_participants_min && proposal.format_participants_max)) && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {proposal.format_duration_hours && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {proposal.format_duration_hours}h
              </span>
            )}
            {proposal.format_participants_min && proposal.format_participants_max && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {proposal.format_participants_min}–{proposal.format_participants_max}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 mt-auto border-t border-border/50">
          <Button
            size="sm"
            variant={isInterested ? "default" : "outline"}
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              onToggleInterest();
            }}
            className="text-xs h-8 flex-1"
          >
            <Heart className={cn("h-3.5 w-3.5 mr-1", isInterested && "fill-current")} />
            {isInterested ? "Interessato" : "Mi interessa"}
          </Button>
          {!isInterested && (
            <Button
              size="sm"
              variant="ghost"
              disabled={readOnly}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDecline();
              }}
              className={cn(
                "text-xs h-8 text-muted-foreground",
                isDeclined && "bg-muted"
              )}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              {isDeclined ? "Scartata" : "No"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
