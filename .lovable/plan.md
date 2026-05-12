## Refinements pagina dettaglio proposta TB

File: `src/pages/hr/HRTBProposalDetailPage.tsx`

### 1. Rimozione link "Torna alle proposte" nella sidebar

Eliminare il `<button>` finale dentro `CardContent` della sidebar (l'attuale link testuale "Torna alle proposte" sotto i due bottoni, righe 187-193). Il link in alto a sinistra resta come unica via di ritorno.

### 2. Lock UI dopo richiesta preventivo

Aggiungere una query leggera per recuperare lo `status` della `tb_requests`:

```ts
const { data: requestStatus } = useQuery({
  queryKey: ["tb-request-status", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tb_requests")
      .select("status")
      .eq("id", id!)
      .single();
    if (error) throw error;
    return data.status as string;
  },
  enabled: !!id,
});

const LOCKED_STATUSES = new Set([
  "quote_requested", "quote_in_composition", "modification_requested",
  "quote_sent", "quote_accepted", "quote_rejected",
  "signed", "event_scheduled", "completed", "cancelled",
]);
const isLocked = requestStatus ? LOCKED_STATUSES.has(requestStatus) : false;
```

- Sia i bottoni della sidebar che del mobile drawer ricevono `disabled={updateStatus.isPending || isLocked}`.
- Quando `isLocked`, sostituire il sottotitolo "Segna le proposte che ti interessano…" con "Hai già richiesto il preventivo" (in sidebar; in mobile drawer non c'è sottotitolo, basta il `disabled`).

### 3. Colorazione semantica bottoni

Il progetto ha già il token `success` in `index.css`/`tailwind.config.ts` (verde) e `destructive` (rosso).

**"Mi interessa"** (sostituisce variant="default" attuale):

- Stato non selezionato: `variant="outline"` + `className="hover:bg-success hover:text-success-foreground hover:border-success"`.
- Stato selezionato (`isInterested`): className `bg-success text-success-foreground border-success hover:bg-success/90` (override variant outline).

**"Non mi interessa"** (sostituisce variant="ghost" attuale):

- Stato non selezionato: `variant="outline"` + `className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"`.
- Stato selezionato (`isDeclined`): className `bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90`.

Per evitare duplicazione tra sidebar e mobile drawer, estraggo due piccoli helper di className locali al file (no nuovo componente):

```ts
const interestedBtnClass = (selected: boolean) => cn(
  "w-full gap-2 transition-colors",
  selected
    ? "bg-success text-success-foreground border-success hover:bg-success/90"
    : "hover:bg-success hover:text-success-foreground hover:border-success"
);
const declinedBtnClass = (selected: boolean) => cn(
  "w-full gap-2 transition-colors",
  selected
    ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90"
    : "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
);
```

Entrambi i Button usano `variant="outline"` (uniforme, lascia che le classi controllino il colore).

### 4. Cleanup minor

- Mobile drawer secondo button era `variant="ghost"`: passa a `variant="outline"` per coerenza visiva.
- `headerExtras` (badge "Interessato"/"Scartata") resta invariato.

### Cosa NON cambia

- Routing back con freccia in alto a sinistra
- Mutation `updateStatus` e logica toggle interessato/declinato
- `TBFormatDetailContent` e tutto il contenuto del format
- Skeleton/loading state

### Verifica

- Hover sui due bottoni mostra rispettivamente verde e rosso.
- Click → bottone resta colorato verde/rosso pieno (selected).
- Nuovo click sullo stesso bottone → torna outline neutro (toggle pending).
- Su una richiesta in stato `quote_requested` o successivo: bottoni disabilitati e copy aggiornato in sidebar.