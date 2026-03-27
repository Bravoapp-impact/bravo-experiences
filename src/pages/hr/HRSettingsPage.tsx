import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HRLayout } from "@/components/layout/HRLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sun, Moon, Monitor, Upload } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { devLog } from "@/lib/logger";

type SectionId =
  | "profilo" | "tema" | "notifiche" | "referral"
  | "generali" | "membri" | "upgrade" | "fatturazione"
  | "volontariato" | "team-building" | "formazione" | "negozio-solidale";

interface NavGroup {
  label: string;
  items: { id: SectionId; label: string; disabled?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Personale",
    items: [
      { id: "profilo", label: "Profilo" },
      { id: "tema", label: "Tema" },
      { id: "notifiche", label: "Notifiche", disabled: true },
      { id: "referral", label: "Referral", disabled: true },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "generali", label: "Generali" },
      { id: "membri", label: "Membri" },
      { id: "upgrade", label: "Upgrade", disabled: true },
      { id: "fatturazione", label: "Fatturazione", disabled: true },
    ],
  },
  {
    label: "Iniziative",
    items: [
      { id: "volontariato", label: "Volontariato" },
      { id: "team-building", label: "Team Building", disabled: true },
      { id: "formazione", label: "Formazione", disabled: true },
      { id: "negozio-solidale", label: "Negozio Solidale", disabled: true },
    ],
  },
];

const disabledSections = new Set<SectionId>([
  "notifiche", "referral", "upgrade", "fatturazione",
  "team-building", "formazione", "negozio-solidale",
]);

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

export default function HRSettingsPage() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionId>("profilo");
  const [companyName, setCompanyName] = useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [budgetHours, setBudgetHours] = useState<number | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Fetch company info
  useEffect(() => {
    if (!profile?.company_id) return;
    supabase
      .from("companies")
      .select("name, logo_url")
      .eq("id", profile.company_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCompanyName(data.name);
          setCompanyLogoUrl(data.logo_url);
        }
      });
  }, [profile?.company_id]);

  // Fetch employees when "membri" is active
  useEffect(() => {
    if (activeSection !== "membri" || !profile?.company_id) return;
    setEmployeesLoading(true);
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url, created_at")
      .eq("company_id", profile.company_id)
      .eq("role", "employee")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) devLog.error("Error fetching employees:", error);
        setEmployees(data || []);
        setEmployeesLoading(false);
      });
  }, [activeSection, profile?.company_id]);

  // Fetch hour budget when "volontariato" is active
  useEffect(() => {
    if (activeSection !== "volontariato" || !profile?.company_id) return;
    setBudgetLoading(true);
    supabase
      .from("hour_budgets")
      .select("hours_per_employee_year")
      .eq("company_id", profile.company_id)
      .limit(1)
      .then(({ data }) => {
        setBudgetHours(data && data.length > 0 ? data[0].hours_per_employee_year : null);
        setBudgetLoading(false);
      });
  }, [activeSection, profile?.company_id]);

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "";

  const renderContent = () => {
    if (disabledSections.has(activeSection)) {
      return (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Questa funzionalità sarà disponibile a breve</p>
        </div>
      );
    }

    switch (activeSection) {
      case "profilo":
        return <ProfileSection fullName={fullName} email={profile?.email} avatarUrl={profile?.avatar_url} firstName={profile?.first_name} lastName={profile?.last_name} />;
      case "tema":
        return <ThemeSection />;
      case "generali":
        return <GeneraliSection companyName={companyName} companyLogoUrl={companyLogoUrl} />;
      case "membri":
        return <MembriSection employees={employees} loading={employeesLoading} />;
      case "volontariato":
        return <VolontariatoSection budgetHours={budgetHours} loading={budgetLoading} />;
      default:
        return null;
    }
  };

  return (
    <HRLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-8">
          {/* Left nav */}
          <nav className="w-52 shrink-0 hidden md:block">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase mb-1 px-2">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    disabled={item.disabled}
                    onClick={() => !item.disabled && setActiveSection(item.id)}
                    className={cn(
                      "w-full text-left text-sm px-2 py-1.5 rounded-md",
                      item.disabled
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : activeSection === item.id
                        ? "bg-muted text-foreground font-medium cursor-pointer"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Mobile nav */}
          <div className="md:hidden w-full mb-4">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as SectionId)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {navGroups.map((group) =>
                group.items.map((item) => (
                  <option key={item.id} value={item.id} disabled={item.disabled}>
                    {group.label} — {item.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}

/* ── Section Components ─────────────────────────────────────── */

function ProfileSection({ fullName, email, avatarUrl, firstName, lastName }: { fullName: string; email?: string; avatarUrl?: string | null; firstName?: string | null; lastName?: string | null }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Profilo personale</h2>
      <p className="text-sm text-muted-foreground mb-6">Gestisci le tue informazioni personali</p>

      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-base font-medium">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input value={fullName} readOnly className="mt-1 bg-muted/30" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={email || ""} readOnly className="mt-1 bg-muted/30" />
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <h3 className="text-sm font-semibold text-foreground mb-1">Sicurezza</h3>
      <div>
        <Label className="text-xs text-muted-foreground">Password</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input type="password" value="••••••••" readOnly className="bg-muted/30 flex-1" />
          <Button variant="outline" size="sm" disabled>Cambia password</Button>
        </div>
      </div>
    </div>
  );
}

function ThemeSection() {
  const [selected, setSelected] = useState<"light" | "dark" | "system">("system");
  const options = [
    { id: "light" as const, label: "Chiaro", icon: Sun },
    { id: "dark" as const, label: "Scuro", icon: Moon },
    { id: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Aspetto</h2>
      <p className="text-sm text-muted-foreground mb-6">Scegli come visualizzare Bravo!</p>

      <div className="flex gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border px-6 py-4 transition-colors",
                active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm", active ? "font-medium text-foreground" : "text-muted-foreground")}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GeneraliSection({ companyName, companyLogoUrl }: { companyName: string; companyLogoUrl: string | null }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Profilo azienda</h2>
      <p className="text-sm text-muted-foreground mb-6">Informazioni sulla tua azienda su Bravo!</p>

      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={companyLogoUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-base font-medium">
            {getInitials(companyName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Button variant="outline" size="sm" disabled>
            <Upload className="mr-2 h-3.5 w-3.5" />
            Carica logo
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <Label className="text-xs text-muted-foreground">Nome azienda</Label>
        <Input value={companyName} readOnly className="mt-1 bg-muted/30" />
      </div>

      <p className="text-xs text-muted-foreground">Per modificare i dati contatta il tuo referente Bravo!</p>
    </div>
  );
}

function MembriSection({ employees, loading }: { employees: Employee[]; loading: boolean }) {
  return (
    <div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data iscrizione</TableHead>
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
                      <span className="text-sm font-medium">
                        {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(emp.created_at), "d MMM yyyy", { locale: it })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[11px]">
                      Attivo
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function VolontariatoSection({ budgetHours, loading }: { budgetHours: number | null; loading: boolean }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Volontariato aziendale</h2>
      <p className="text-sm text-muted-foreground mb-6">Configurazione del programma di volontariato</p>

      <h3 className="text-sm font-semibold text-foreground mb-2">Budget ore</h3>
      {loading ? (
        <Skeleton className="h-8 w-40" />
      ) : budgetHours !== null ? (
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-foreground">{budgetHours}</span>
          <span className="text-sm text-muted-foreground">ore/anno per dipendente</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nessun limite impostato</p>
      )}
      <p className="text-xs text-muted-foreground mt-2">Il budget è gestito dal tuo referente Bravo!</p>

      <Separator className="my-6" />

      <h3 className="text-sm font-semibold text-foreground mb-3">Configurazione</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">I dipendenti possono prenotarsi in autonomia</Label>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Mostra le ore nel profilo del dipendente</Label>
          <Switch defaultChecked />
        </div>
      </div>
    </div>
  );
}
