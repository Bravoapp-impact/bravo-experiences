import { useState, useMemo } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Download, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import PageSection from "@/components/common/PageSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Booking {
  id: string;
  status: string;
  created_at: string;
  volunteer_hours: number;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  experience_title: string;
  start_datetime: string;
}

interface BookingsTableProps {
  bookings: Booking[];
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        booking.user.first_name?.toLowerCase().includes(searchLower) ||
        booking.user.last_name?.toLowerCase().includes(searchLower) ||
        booking.user.email.toLowerCase().includes(searchLower) ||
        booking.experience_title.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      // Date filter
      const bookingDate = new Date(booking.start_datetime);
      const matchesDateFrom = !dateRange.from || bookingDate >= dateRange.from;
      const matchesDateTo = !dateRange.to || bookingDate <= dateRange.to;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [bookings, searchTerm, statusFilter, dateRange]);

  const exportCSV = () => {
    const headers = ["Utente", "Email", "Esperienza", "Data", "Stato", "Ore"];
    const rows = filteredBookings.map((b) => [
      `${b.user.first_name || ""} ${b.user.last_name || ""}`.trim(),
      b.user.email,
      b.experience_title,
      format(new Date(b.start_datetime), "dd/MM/yyyy HH:mm"),
      b.status,
      b.volunteer_hours.toString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `prenotazioni_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-secondary text-secondary-foreground">Confermata</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annullata</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <PageSection
      title="Lista Prenotazioni"
      actions={
        <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Esporta CSV
        </Button>
      }
    >
      <div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca utente o esperienza..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="confirmed">Confermata</SelectItem>
              <SelectItem value="cancelled">Annullata</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 bg-popover" align="end">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Filtra per data</p>
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    locale={it}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({})}
                  className="w-full"
                >
                  Rimuovi filtro data
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Utente</TableHead>
                <TableHead>Esperienza</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Ore</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nessuna prenotazione trovata
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking, index) => (
                  <motion.tr
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border last:border-0"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {booking.user.first_name} {booking.user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate">{booking.experience_title}</p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.start_datetime), "dd MMM yyyy, HH:mm", {
                        locale: it,
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {booking.volunteer_hours}h
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Mostrando {filteredBookings.length} di {bookings.length} prenotazioni
        </p>
      </CardContent>
    </Card>
  );
}
