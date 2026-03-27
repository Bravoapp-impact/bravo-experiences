import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export default function SettingsMembers() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.company_id) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url, created_at")
      .eq("company_id", profile.company_id)
      .eq("role", "employee")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) devLog.error("Error fetching employees:", error);
        setEmployees(data || []);
        setLoading(false);
      });
  }, [profile?.company_id]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h2 className="text-lg font-semibold text-foreground">Membri e accessi</h2>
      <p className="text-sm text-muted-foreground mb-6">Gestisci chi può accedere a Bravo! nella tua azienda</p>

      {/* Domain block */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground">Dominio aziendale</h3>
          <Badge variant="outline" className="text-[10px]">Presto</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          I dipendenti che si registrano con questo dominio email accedono automaticamente alla tua azienda.
        </p>
        <Input placeholder="@nomeazienda.com" readOnly className="bg-muted/30 max-w-xs" />
        <p className="text-xs text-muted-foreground mt-1.5">
          Contatta il tuo referente Bravo! per configurare il dominio aziendale.
        </p>
      </div>

      <Separator className="my-6" />

      {/* Employees table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Dipendenti registrati</h3>
          <Button size="sm" disabled>Invita dipendente</Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : employees.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nessun dipendente registrato ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Data iscrizione</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={emp.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                            {getInitials([emp.first_name, emp.last_name].filter(Boolean).join(" "))}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium block">
                            {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">{emp.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{emp.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {format(new Date(emp.created_at), "d MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px]">Attivo</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
