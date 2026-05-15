import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { it } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import PageSection from "@/components/common/PageSection";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTBStatusMeta, TB_REQUEST_STATUS_OPTIONS } from "@/lib/tb-status";

interface TBRequestRow {
  id: string;
  title: string;
  status: string;
  company_id: string;
  status_since: string | null;
  created_at: string;
  companies: { name: string } | null;
}

export default function TBRequestsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["super-admin-tb-requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tb_requests_with_status_since")
        .select("id, title, status, company_id, status_since, created_at, companies(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TBRequestRow[];
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["super-admin-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (companyFilter !== "all" && r.company_id !== companyFilter) return false;
      return true;
    });
  }, [requests, statusFilter, companyFilter]);

  const description = isLoading
    ? "Caricamento…"
    : `${filtered.length} richiest${filtered.length === 1 ? "a" : "e"} ${filtered.length !== requests?.length ? "filtrate" : "in lavorazione"}`;

  return (
    <SuperAdminLayout>
      <div className="space-y-5">
        <PageHeader title="Richieste TB" description={description} />

        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[220px] text-sm">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {TB_REQUEST_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="h-8 w-[220px] text-sm">
              <SelectValue placeholder="Azienda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le aziende</SelectItem>
              {(companies ?? []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PageSection>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Azienda</TableHead>
                <TableHead>Titolo richiesta</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Giorni in stato</TableHead>
                <TableHead>Data creazione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ClipboardList className="h-8 w-8 opacity-50" />
                      <p className="text-sm">Nessuna richiesta TB ancora.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const meta = getTBStatusMeta(r.status);
                  const sinceDate = r.status_since ?? r.created_at;
                  const days = differenceInDays(new Date(), new Date(sinceDate));
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/super-admin/team-building/richieste/${r.id}`)}
                    >
                      <TableCell className="font-medium">
                        {r.companies?.name ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate">{r.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meta.badgeClass}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {days === 0 ? "Oggi" : `${days}g`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(r.created_at), "d MMM yyyy", { locale: it })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </PageSection>
      </div>
    </SuperAdminLayout>
  );
}
