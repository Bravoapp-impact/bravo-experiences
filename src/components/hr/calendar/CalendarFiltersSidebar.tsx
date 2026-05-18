import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getEventColor } from "@/components/calendar/calendar-types";
import { cn } from "@/lib/utils";

export interface CalendarFilterGroup {
  id: string;
  label: string;
  experiences: { id: string; title: string }[];
}

interface CalendarFiltersSidebarProps {
  groups: CalendarFilterGroup[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
  collapsed?: boolean;
  onCollapsedChange?: (c: boolean) => void;
}

export function CalendarFiltersSidebar({
  groups,
  selectedIds,
  onChange,
  collapsed = false,
  onCollapsedChange,
}: CalendarFiltersSidebarProps) {
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const toggleGroup = (group: CalendarFilterGroup, checked: boolean) => {
    const next = new Set(selectedIds);
    group.experiences.forEach((e) => {
      if (checked) next.add(e.id);
      else next.delete(e.id);
    });
    onChange(next);
  };

  if (collapsed) {
    return (
      <aside className="w-10 border-r border-border bg-background flex flex-col items-center py-2 gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCollapsedChange?.(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-1.5 pt-2">
          {groups.flatMap((g) =>
            g.experiences
              .filter((e) => selectedIds.has(e.id))
              .map((e) => (
                <Tooltip key={e.id}>
                  <TooltipTrigger asChild>
                    <span
                      className="block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getEventColor(e.id) }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">{e.title}</TooltipContent>
                </Tooltip>
              ))
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[260px] border-r border-border bg-background shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtri
        </div>
        {onCollapsedChange && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCollapsedChange(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <FilterGroupBlock
            key={group.id}
            group={group}
            selectedIds={selectedIds}
            onToggleOne={toggleOne}
            onToggleGroup={(checked) => toggleGroup(group, checked)}
          />
        ))}
      </div>
    </aside>
  );
}

interface FilterGroupBlockProps {
  group: CalendarFilterGroup;
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleGroup: (checked: boolean) => void;
}

function FilterGroupBlock({ group, selectedIds, onToggleOne, onToggleGroup }: FilterGroupBlockProps) {
  const [open, setOpen] = useState(true);
  const total = group.experiences.length;
  const selected = group.experiences.filter((e) => selectedIds.has(e.id)).length;
  const allChecked = total > 0 && selected === total;
  const someChecked = selected > 0 && selected < total;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="px-2 pb-2">
      <div className="flex items-center gap-2 px-1 py-1.5">
        <Checkbox
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          onCheckedChange={(c) => onToggleGroup(!!c)}
          disabled={total === 0}
          aria-label={`Tutte ${group.label}`}
        />
        <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left text-xs font-semibold text-foreground uppercase tracking-wide hover:text-primary">
          <span className="truncate">{group.label}</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform shrink-0", !open && "-rotate-90")}
          />
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="pl-6 space-y-0.5">
        {total === 0 ? (
          <p className="text-xs text-muted-foreground py-1">Nessuna esperienza nel programma</p>
        ) : (
          group.experiences.map((exp) => {
            const checked = selectedIds.has(exp.id);
            return (
              <label
                key={exp.id}
                className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox checked={checked} onCheckedChange={() => onToggleOne(exp.id)} />
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getEventColor(exp.id) }}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate text-sm text-foreground flex-1 min-w-0">
                      {exp.title}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">{exp.title}</TooltipContent>
                </Tooltip>
              </label>
            );
          })
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
