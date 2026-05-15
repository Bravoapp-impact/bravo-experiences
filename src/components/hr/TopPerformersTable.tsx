import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import PageSection from "@/components/common/PageSection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmployeeStats {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  total_experiences: number;
  total_hours: number;
}

interface TopPerformersTableProps {
  employees: EmployeeStats[];
  limit?: number;
}

const getMedalEmoji = (position: number): string => {
  switch (position) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return `${position}`;
  }
};

export function TopPerformersTable({
  employees,
  limit = 5,
}: TopPerformersTableProps) {
  // Filter active employees and sort by experiences (then hours as tiebreaker)
  const topPerformers = employees
    .filter((e) => e.total_experiences > 0)
    .sort((a, b) => {
      if (b.total_experiences !== a.total_experiences) {
        return b.total_experiences - a.total_experiences;
      }
      return b.total_hours - a.total_hours;
    })
    .slice(0, limit);

  const getDisplayName = (employee: EmployeeStats): string => {
    if (employee.first_name || employee.last_name) {
      return `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
    }
    return employee.email.split("@")[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <PageSection
        title={
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Top Performers
          </span>
        }
      >
          {topPerformers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nessun utente ha ancora partecipato a esperienze
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Utente</TableHead>
                      <TableHead className="text-center">Esperienze</TableHead>
                      <TableHead className="text-right">Ore</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPerformers.map((employee, index) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <span className="text-base">
                            {getMedalEmoji(index + 1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {getDisplayName(employee)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-primary">
                            {employee.total_experiences}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {employee.total_hours}h
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-2">
                {topPerformers.map((employee, index) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <span className="text-xl w-8 text-center">
                      {getMedalEmoji(index + 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {getDisplayName(employee)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.total_experiences} esperienze • {employee.total_hours}h
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
