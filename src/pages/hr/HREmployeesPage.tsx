import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import {
  Users,
  Search,
  Download,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react";
import { HRLayout } from "@/components/layout/HRLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeParticipationsDialog } from "@/components/hr/EmployeeParticipationsDialog";
import {
  EmployeeMetricsCards,
  type EmployeeSegment,
} from "@/components/hr/EmployeeMetricsCards";
import { PageHeader } from "@/components/common/PageHeader";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

interface EmployeeStats {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  total_experiences: number;
  total_hours: number;
  last_participation: string | null;
  created_at: string;
}

type SortField = "name" | "experiences" | "hours" | "last_participation";
type SortDirection = "asc" | "desc";

const SEGMENTS: { id: EmployeeSegment; label: string }[] = [
  { id: "all", label: "Tutti" },
  { id: "top", label: "Top Performers" },
  { id: "active", label: "Attivi" },
  { id: "inactive", label: "Da coinvolgere" },
  { id: "new", label: "Nuovi questo mese" },
];

const getMedal = (position: number): string | null => {
  if (position === 0) return "🥇";
  if (position === 1) return "🥈";
  if (position === 2) return "🥉";
  return null;
};

export default function HREmployeesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [segment, setSegment] = useState<EmployeeSegment>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchEmployees();
    }
  }, [profile?.company_id]);

  const fetchEmployees = async () => {
    if (!profile?.company_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, role, created_at")
        .eq("company_id", profile.company_id)
        .in("role", ["employee", "hr_admin"]);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      const userIds = profilesData.map((p) => p.id);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          user_id,
          status,
          experience_date_id,
          experience_dates!inner (
            start_datetime,
            volunteer_hours
          )
        `)
        .in("user_id", userIds)
        .in("status", ["confirmed", "completed"]);

      if (bookingsError) throw bookingsError;

      const statsMap = new Map<
        string,
        { total_experiences: number; total_hours: number; last_participation: string | null }
      >();

      profilesData.forEach((p) => {
        statsMap.set(p.id, {
          total_experiences: 0,
          total_hours: 0,
          last_participation: null,
        });
      });

      (bookingsData || []).forEach((booking) => {
        const stats = statsMap.get(booking.user_id);
        if (!stats) return;

        const expDate = booking.experience_dates as unknown as {
          start_datetime: string;
          volunteer_hours: number | null;
        };

        const startDate = new Date(expDate.start_datetime);
        if (startDate > new Date()) return;

        stats.total_experiences += 1;
        stats.total_hours += expDate.volunteer_hours ? Number(expDate.volunteer_hours) : 0;

        if (
          !stats.last_participation ||
          new Date(expDate.start_datetime) > new Date(stats.last_participation)
        ) {
          stats.last_participation = expDate.start_datetime;
        }
      });

      const employeesWithStats: EmployeeStats[] = profilesData.map((p) => {
        const stats = statsMap.get(p.id)!;
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          total_experiences: stats.total_experiences,
          total_hours: stats.total_hours,
          last_participation: stats.last_participation,
          created_at: p.created_at,
        };
      });

      setEmployees(employeesWithStats);
    } catch (err) {
      devLog.error("Error fetching employees:", err);
      setError("Errore nel caricamento degli utenti");
    } finally {
      setLoading(false);
    }
  };

  // Top-3 ranking on entire company set
  const topRanking = useMemo(() => {
    const rank = new Map<string, number>();
    [...employees]
      .filter((e) => e.total_experiences > 0)
      .sort((a, b) => {
        if (b.total_experiences !== a.total_experiences) {
          return b.total_experiences - a.total_experiences;
        }
        return b.total_hours - a.total_hours;
      })
      .forEach((e, i) => rank.set(e.id, i));
    return rank;
  }, [employees]);

  // Metrics
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.total_experiences >= 1).length;
  const inactiveCount = totalCount - activeCount;
  const newThisMonthCount = employees.filter(
    (e) => new Date(e.created_at) >= monthStart,
  ).length;

  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    // Segment filter
    switch (segment) {
      case "active":
        result = result.filter((e) => e.total_experiences >= 1);
        break;
      case "inactive":
        result = result.filter((e) => e.total_experiences === 0);
        break;
      case "new":
        result = result.filter((e) => new Date(e.created_at) >= monthStart);
        break;
      case "top": {
        const topIds = new Set(
          [...employees]
            .filter((e) => e.total_experiences > 0)
            .sort((a, b) => {
              if (b.total_experiences !== a.total_experiences) {
                return b.total_experiences - a.total_experiences;
              }
              return b.total_hours - a.total_hours;
            })
            .slice(0, 5)
            .map((e) => e.id),
        );
        result = result.filter((e) => topIds.has(e.id));
        break;
      }
      case "all":
      default:
        break;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.email.toLowerCase().includes(search) ||
          (e.first_name?.toLowerCase() || "").includes(search) ||
          (e.last_name?.toLowerCase() || "").includes(search),
      );
    }

    // Top segment keeps ranking order regardless of sort
    if (segment === "top") {
      result.sort((a, b) => (topRanking.get(a.id) ?? 99) - (topRanking.get(b.id) ?? 99));
      return result;
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name": {
          const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase();
          const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "experiences":
          comparison = a.total_experiences - b.total_experiences;
          break;
        case "hours":
          comparison = a.total_hours - b.total_hours;
          break;
        case "last_participation":
          if (!a.last_participation && !b.last_participation) comparison = 0;
          else if (!a.last_participation) comparison = -1;
          else if (!b.last_participation) comparison = 1;
          else
            comparison =
              new Date(a.last_participation).getTime() -
              new Date(b.last_participation).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [employees, segment, searchTerm, sortField, sortDirection, monthStart, topRanking]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEmployeeClick = (employee: EmployeeStats) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const exportCSV = () => {
    const headers = [
      "Nome",
      "Cognome",
      "Email",
      "Esperienze Completate",
      "Ore Totali",
      "Ultima Partecipazione",
    ];
    const rows = filteredEmployees.map((e) => [
      e.first_name || "",
      e.last_name || "",
      e.email,
      e.total_experiences.toString(),
      e.total_hours.toString(),
      e.last_participation
        ? format(new Date(e.last_participation), "dd/MM/yyyy")
        : "Mai",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `utenti_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <HRLayout>
        <PageSkeleton variant="dashboard" />
      </HRLayout>
    );
  }

  if (error) {
    return (
      <HRLayout>
        <EmptyState
          icon={Users}
          title="Errore di caricamento"
          description={error}
          className="min-h-[60vh]"
        />
      </HRLayout>
    );
  }

  if (employees.length === 0) {
    return (
      <HRLayout>
        <div className="space-y-6">
          <PageHeader title="Utenti" icon={Users} iconColor="text-blue-500" />
          <EmptyState
            icon={Users}
            title="Nessun utente registrato"
            description="Non ci sono ancora utenti registrati per la tua azienda. Gli utenti appariranno qui dopo la registrazione con il codice aziendale."
          />
        </div>
      </HRLayout>
    );
  }

  // For metric-card segment highlight, only highlight when segment matches an exposed card
  const metricsActiveSegment: EmployeeSegment =
    segment === "top" ? "all" : segment;

  return (
    <HRLayout>
      <div className="space-y-6">
        <PageHeader title="Utenti" icon={Users} iconColor="text-blue-500" />

        <EmployeeMetricsCards
          totalCount={totalCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
          newThisMonthCount={newThisMonthCount}
          activeSegment={metricsActiveSegment}
          onSegmentChange={setSegment}
        />

        {/* Segment pills + search + export */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={exportCSV}
              className="gap-2 shrink-0"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Esporta CSV</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SEGMENTS.map((s) => {
              const isActive = segment === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSegment(s.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                  )}
                  aria-pressed={isActive}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Employees Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 -ml-3 font-medium"
                    onClick={() => handleSort("name")}
                  >
                    Utente
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("experiences")}
                  >
                    Esperienze
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center hidden sm:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("hours")}
                  >
                    Ore
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 font-medium"
                    onClick={() => handleSort("last_participation")}
                  >
                    Ultima partecipazione
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nessun utente corrisponde ai filtri
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee, index) => {
                  const rank = topRanking.get(employee.id);
                  const medal = rank !== undefined ? getMedal(rank) : null;
                  return (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {medal && (
                            <span className="text-lg shrink-0" aria-label={`Top ${(rank ?? 0) + 1}`}>
                              {medal}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {employee.first_name || employee.last_name
                                ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
                                : "—"}
                            </p>
                            <p className="text-sm text-muted-foreground md:hidden truncate">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {employee.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{employee.total_experiences}</span>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <span className="font-medium">{employee.total_hours}h</span>
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                        {employee.last_participation
                          ? format(new Date(employee.last_participation), "d MMM yyyy", { locale: it })
                          : "—"}
                      </TableCell>
                      <TableCell className="w-10 text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <EmployeeParticipationsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employee={selectedEmployee}
        />
      </div>
    </HRLayout>
  );
}
