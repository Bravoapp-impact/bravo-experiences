import { useEffect, useState } from "react";
import { Mail, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";
import SettingsPage from "@/components/common/SettingsPage";
import SettingsSection from "@/components/common/SettingsSection";

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
  const [domains, setDomains] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>("");
  const [domainsLoading, setDomainsLoading] = useState(true);

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

    setDomainsLoading(true);
    supabase
      .from("companies")
      .select("name, allowed_email_domains")
      .eq("id", profile.company_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) devLog.error("Error fetching company domains:", error);
        setDomains((data?.allowed_email_domains as string[] | null) || []);
        setCompanyName(data?.name || "");
        setDomainsLoading(false);
      });
  }, [profile?.company_id]);

  const mailtoHref = `mailto:team@bravoapp.it?subject=${encodeURIComponent(
    `Configurazione dominio aziendale${companyName ? ` — ${companyName}` : ""}`
  )}`;

  return (
    <SettingsPage title="Membri e accessi" icon={Users} iconColor="text-green-500">
      <SettingsSection
        title="Dominio aziendale"
        description="I dipendenti che si registrano con questo dominio email accedono automaticamente alla tua azienda."
      >
        {domainsLoading ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-7 w-32" />
          </div>
        ) : domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun dominio configurato.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <Badge key={d} variant="secondary" className="text-xs font-normal py-1 px-2.5">
                @{d.replace(/^@/, "")}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Contatta il tuo referente Bravo! per configurare o modificare il dominio aziendale.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3 gap-2">
          <a href={mailtoHref}>
            <Mail className="h-4 w-4" />
            Contatta il team Bravo!
          </a>
        </Button>
      </SettingsSection>

      <SettingsSection title="Dipendenti registrati" separator={false}>
        <div className="flex items-center justify-end mb-3">
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
      </SettingsSection>
    </SettingsPage>
  );
}
