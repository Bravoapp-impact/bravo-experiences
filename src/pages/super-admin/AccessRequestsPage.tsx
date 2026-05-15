import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Eye, ExternalLink } from "lucide-react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RequestType = "employee_needs_code" | "company_lead" | "association_lead" | "individual_waitlist";
type RequestStatus = "pending" | "contacted" | "closed";

interface AccessRequest {
  id: string;
  request_type: RequestType;
  status: RequestStatus;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  message: string | null;
  company_name: string | null;
  association_name: string | null;
  role_in_company: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  employee_needs_code: "Dipendente",
  company_lead: "Lead Azienda",
  association_lead: "Lead Associazione",
  individual_waitlist: "Privato",
};

const REQUEST_TYPE_COLORS: Record<RequestType, string> = {
  employee_needs_code: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  company_lead: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  association_lead: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  individual_waitlist: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "In attesa",
  contacted: "Contattato",
  closed: "Chiuso",
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  contacted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
};

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editedStatus, setEditedStatus] = useState<RequestStatus>("pending");
  const [editedNotes, setEditedNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("request_type", filterType as RequestType);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus as RequestStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data as AccessRequest[]) || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare le richieste",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenDetail = (request: AccessRequest) => {
    setSelectedRequest(request);
    setEditedStatus(request.status);
    setEditedNotes(request.notes || "");
    setDetailDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedRequest) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: editedStatus,
          notes: editedNotes || null,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Modifiche salvate",
        duration: 3000,
      });

      setDetailDialogOpen(false);
      fetchRequests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayName = (request: AccessRequest) => {
    if (request.first_name && request.last_name) {
      return `${request.first_name} ${request.last_name}`;
    }
    if (request.first_name) {
      return request.first_name;
    }
    return "—";
  };

  const getOrganization = (request: AccessRequest) => {
    return request.company_name || request.association_name || "—";
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Richieste Accesso"
          description={`${pendingCount} richieste in attesa`}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tipo richiesta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="employee_needs_code">Dipendente</SelectItem>
              <SelectItem value="company_lead">Lead Azienda</SelectItem>
              <SelectItem value="association_lead">Lead Associazione</SelectItem>
              <SelectItem value="individual_waitlist">Privato</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli status</SelectItem>
              <SelectItem value="pending">In attesa</SelectItem>
              <SelectItem value="contacted">Contattato</SelectItem>
              <SelectItem value="closed">Chiuso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Organizzazione</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nessuna richiesta trovata
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetail(request)}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(request.created_at), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={REQUEST_TYPE_COLORS[request.request_type]}>
                        {REQUEST_TYPE_LABELS[request.request_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{getDisplayName(request)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {request.email}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {getOrganization(request)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[request.status]}>
                        {STATUS_LABELS[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenDetail(request); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettagli Richiesta</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{REQUEST_TYPE_LABELS[selectedRequest.request_type]}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.created_at), "dd MMMM yyyy, HH:mm", { locale: it })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <p className="font-medium">{getDisplayName(selectedRequest)}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <a href={`mailto:${selectedRequest.email}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                  {selectedRequest.email}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {selectedRequest.phone && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Telefono</Label>
                  <p className="font-medium">{selectedRequest.phone}</p>
                </div>
              )}

              {selectedRequest.company_name && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Azienda</Label>
                  <p className="font-medium">{selectedRequest.company_name}</p>
                </div>
              )}

              {selectedRequest.association_name && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Associazione</Label>
                  <p className="font-medium">{selectedRequest.association_name}</p>
                </div>
              )}

              {selectedRequest.role_in_company && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ruolo</Label>
                  <p className="font-medium">{selectedRequest.role_in_company}</p>
                </div>
              )}

              {selectedRequest.city && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Città</Label>
                  <p className="font-medium">{selectedRequest.city}</p>
                </div>
              )}

              {selectedRequest.message && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Messaggio</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRequest.message}</p>
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editedStatus} onValueChange={(v) => setEditedStatus(v as RequestStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">In attesa</SelectItem>
                      <SelectItem value="contacted">Contattato</SelectItem>
                      <SelectItem value="closed">Chiuso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Note interne</Label>
                  <Textarea
                    id="notes"
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Aggiungi note per uso interno..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
