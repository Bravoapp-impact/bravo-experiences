import { useMemo } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Check,
  ChevronsUpDown,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface GalleryFilterOption {
  id: string;
  label: string;
}

export interface GalleryFiltersState {
  experienceIds: string[];
  dateRange: DateRange | undefined;
}

export const EMPTY_FILTERS: GalleryFiltersState = {
  experienceIds: [],
  dateRange: undefined,
};

interface Props {
  value: GalleryFiltersState;
  onChange: (next: GalleryFiltersState) => void;
  experienceOptions: GalleryFilterOption[];
}

export function GalleryFilters({
  value,
  onChange,
  experienceOptions,
}: Props) {
  const hasActiveFilter =
    value.experienceIds.length > 0 || !!value.dateRange?.from;

  const setFilter = <K extends keyof GalleryFiltersState>(
    key: K,
    v: GalleryFiltersState[K],
  ) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
      <MultiSelectFilter
        label="Esperienze"
        options={experienceOptions}
        selectedIds={value.experienceIds}
        onChange={(ids) => setFilter("experienceIds", ids)}
      />
      <DateRangeFilter
        value={value.dateRange}
        onChange={(r) => setFilter("dateRange", r)}
      />

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-muted-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Reset filtri
        </Button>
      )}
    </div>
  );
}

function MultiSelectFilter({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: GalleryFilterOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const summary =
    selectedIds.length === 0
      ? label
      : selectedIds.length === 1
        ? options.find((o) => o.id === selectedIds[0])?.label ?? label
        : `${label} · ${selectedIds.length}`;

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-between gap-2 min-w-[160px]",
            selectedIds.length > 0 && "border-primary text-foreground",
          )}
        >
          <span className="truncate">{summary}</span>
          {selectedIds.length > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {selectedIds.length}
            </Badge>
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Cerca ${label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Nessun risultato.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selectedSet.has(opt.id);
                return (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => toggle(opt.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
}) {
  const label = value?.from
    ? value.to
      ? `${format(value.from, "d MMM", { locale: it })} – ${format(value.to, "d MMM yyyy", { locale: it })}`
      : format(value.from, "d MMM yyyy", { locale: it })
    : "Periodo";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start gap-2 min-w-[160px]",
            value?.from && "border-primary text-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
          locale={it}
        />
        {value?.from && (
          <div className="flex justify-end p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
            >
              Cancella
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
