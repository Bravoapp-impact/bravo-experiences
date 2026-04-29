
# Editor preventivi TB super-admin — piano

Sostituisce i placeholder "in arrivo" degli stati `quote_*` del workspace `TBRequestDetailPage` con un editor reale che chiama solo le RPC esistenti (`admin_save_tb_quote_draft`, `admin_send_tb_quote`, `admin_supersede_and_create_new_version`).

---

## 0. Risposte alle verifiche

**(1) zod / react-hook-form**
- `zod` è già usato (3 file: `ProfileEditForm`, `AccessRequestModal`, `SettingsProfile`) — sempre con `safeParse` manuale, mai con `zodResolver`.
- `react-hook-form` è installato (7.61.1) ma usato solo dalle UI primitive `src/components/ui/form.tsx`. Nessun consumer reale di `useFieldArray` nel codebase.
- **Decisione**: usiamo `react-hook-form` + `useFieldArray` (è il pattern dichiarato dal brief, è la libreria già in dipendenze, ed è oggettivamente più robusta di gestire un array con `useState` per un form complesso). Per la validazione usiamo **`zodResolver` da `@hookform/resolvers/zod`**. Verifica al primo passo dell'implementazione che `@hookform/resolvers` sia tra le deps di `package.json`; se manca lo aggiungiamo (è una dep ufficiale RHF, ~5kb). Se preferisci evitare nuove dep, fallback: validazione manuale con `zod.safeParse` dentro gli handler salva/invia (pattern coerente col resto del codebase, ma perdiamo l'integrazione `FormMessage` automatica).

**(2) Derivazione versione precedente**
La RPC `get_tb_quote_history_for_admin(p_request_id)` restituisce `(id, version, status, total_amount_final, total_amount_ets, sent_at, decided_at, client_decision_notes, created_at, updated_at)` ordinata `ORDER BY version DESC`. Confermato leggendo la migration. Quindi:
```ts
const previous = history.find(h => h.version === currentVersion - 1);
// previous.id → fetch dettaglio via get_tb_quote_full_for_admin + get_tb_quote_items_full_for_admin
```
Nessun bisogno di RPC nuove. La history espone già `client_decision_notes` e `decided_at` della v_n-1, quindi il pannello "Modifiche richieste" può essere alimentato direttamente dalla history senza un fetch full extra (lo facciamo solo se l'utente apre "Vedi versione precedente").

**(3) Calcoli live dei totali**
Pattern: `useWatch({ control, name: 'items' })` (più performante di `watch()` perché re-renderizza solo i sottoscrittori), poi `useMemo` per i totali. La row `QuoteItemRow` fa il proprio `useWatch` su `items.${index}` per i totali di riga, così solo la riga modificata si re-renderizza, non tutta la lista. Pattern idiomatico RHF, niente di custom.

**(4) Salva bozza vs Invia**
Conferma la tua proposta: **salvataggio bozza permissivo, invio restrittivo**.
- Salva bozza: validazione minima (description non vuota su almeno una riga, oppure zero righe consentite). Quantità/prezzi possono essere NULL/0 senza bloccare. Razionale: l'admin compone in fasi, prima inserisce le voci, poi attende i prezzi ETS, poi torna e completa.
- Invia: schema zod completo (vedi sotto), totale finale > 0, valid_until ≥ oggi, almeno 1 item con quantity > 0 e prezzi >= 0.

Implementazione: **due schemi zod separati** (`draftSchema` lasco, `sendSchema` stretto) e due handler che validano col proprio schema prima di chiamare la RPC. `zodResolver` sul form usa solo `draftSchema` (così `FormMessage` non sputa errori "richiesto" mentre digiti); l'handler "Invia" fa `sendSchema.safeParse` esplicito e in caso di errori li popola via `form.setError` per visualizzarli inline.

**(5) Stato `modification_requested` non mappato in `tb-status.ts`**
Ho controllato: `modification_requested` compare nelle migration RPC ma **NON** è nella `TBRequestStatus` union di `src/lib/tb-status.ts`. Va aggiunto, altrimenti il branch del nuovo `StatusSection` non lo riconosce e cade nel fallback "Stato non riconosciuto". Aggiunta nel file dei deliverables (vedi sotto).

---

## 1. Architettura

```text
TBRequestDetailPage (page, gestisce fetch e routing per status)
  └─ <StatusSection status={request.status}>
       ├─ status='quote_requested' → <EditorEmpty onStart={...}>
       ├─ status='quote_in_composition' (con quote draft attiva)
       │     → <QuoteEditor quoteId=draftId requestId=...>
       ├─ status='quote_sent'         → <QuoteReadOnlyView quoteId=sentId>
       ├─ status='quote_accepted'     → <QuoteReadOnlyView + badge verde>
       ├─ status='quote_rejected'     → <QuoteReadOnlyView + CTA "Crea nuovo">
       └─ status='modification_requested'
             → <QuoteEditor quoteId=newDraftId
                            previousClientNotes=...
                            previousDecidedAt=... >
       └─ <QuoteHistoryAccordion> (in fondo, per tutti gli stati B–F)
```

`QuoteEditor` è il componente che fa il lavoro pesante. Sotto, struttura interna:

```text
<QuoteEditor>
  ├─ <ClientModificationsPanel>          (solo se previousClientNotes)
  │     └─ <PreviousVersionDialog>       (lazy)
  ├─ <Form react-hook-form>
  │     ├─ valid_until + terms_text
  │     ├─ <QuoteItemRow> × N            (useFieldArray)
  │     ├─ <QuoteTotalsSummary>          (useWatch su items)
  │     └─ Footer: Svuota / Salva / Invia
  └─ <QuoteHistoryAccordion>             (passata dal parent come children o prop)
```

---

## 2. File nuovi e modificati

### Nuovi

1. **`src/lib/tb-defaults.ts`**
   - Costante `TERMS_DEFAULT_TB` con testo italiano placeholder ("Validità 30 gg, pagamento 30 gg DF, comunicazione variazioni 7 gg prima, ecc."). Filippo lo affinerà.
   - Costante `QUOTE_DEFAULT_VALIDITY_DAYS = 30`.

2. **`src/lib/tb-quote-schema.ts`**
   - `quoteItemDraftSchema` / `quoteItemSendSchema` (zod).
   - `quoteDraftSchema` / `quoteSendSchema` con `items: z.array(...)`.
   - Type `QuoteFormValues = z.infer<typeof quoteDraftSchema>` (la draft è il superset di forma, così il form ne usa il tipo).
   - Helper puri: `computeRowTotals(qty, ets, final)`, `computeQuoteTotals(items)`.

3. **`src/components/super-admin/tb-quote-editor/QuoteEditor.tsx`**
   - Container. Props: `requestId`, `quoteId | null`, `previousClientNotes?`, `previousDecidedAt?`, `onAfterSend?` (callback per parent invalidate).
   - Setup RHF + `zodResolver(quoteDraftSchema)` + `useFieldArray({ name: 'items' })`.
   - Carica dati iniziali via `get_tb_quote_full_for_admin` + `get_tb_quote_items_full_for_admin` se `quoteId` è valorizzato; altrimenti pre-popola da `tb_proposals` (vedi sotto).
   - Mutations react-query: `saveDraftMutation` (chiama `admin_save_tb_quote_draft`), `sendMutation` (chiama `admin_save_tb_quote_draft` poi `admin_send_tb_quote`).
   - Beforeunload guard se `formState.isDirty` → vedi rischi.

4. **`src/components/super-admin/tb-quote-editor/QuoteItemRow.tsx`**
   - Props: `control`, `index`, `onRemove`.
   - `useWatch` su `items.${index}` per calcolare total_ets/total_final/margin live.
   - Layout: card con bordo, NO `<Table>` (le righe sono troppo dense). Description full-width in alto, sotto griglia `grid-cols-2 md:grid-cols-5` con qty / unit_ets / unit_final / total / margin. Trash icon a destra.
   - Inputs: description (`Input`), quantity/unit_price_ets/unit_price_final (`Input type='number'` con prefisso "€" per i prezzi). Display read-only per total_ets, total_final, margin_amount, margin_percent.
   - `proposal_id` è hidden field (non visualizzato, ma persistito nel payload).

5. **`src/components/super-admin/tb-quote-editor/QuoteTotalsSummary.tsx`**
   - Props: `control`. Fa `useWatch({ control, name: 'items' })` e calcola live i 4 totali (cliente, ETS, margine €, margine %).
   - Layout sticky in fondo alla sezione items, card con i 4 valori in griglia.
   - Numeri formattati `it-IT`: `new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })`.

6. **`src/components/super-admin/tb-quote-editor/QuoteHistoryAccordion.tsx`**
   - Props: `requestId`. Fetch interno via `useQuery(['tb-quote-history', requestId])` su `get_tb_quote_history_for_admin`.
   - Accordion shadcn collassato di default. Lista versioni: `v{n} · {status} · €{total_final} · {decided}`. Click su riga → apre `<PreviousVersionDialog quoteId={row.id}>`.

7. **`src/components/super-admin/tb-quote-editor/PreviousVersionDialog.tsx`**
   - Props: `quoteId`, `open`, `onOpenChange`.
   - Dialog shadcn (z-index 200 da memory rule). Fetch `get_tb_quote_full_for_admin` + `get_tb_quote_items_full_for_admin` su mount aperto.
   - Internamente renderizza `<QuoteReadOnlyView>` con i dati ricevuti.

8. **`src/components/super-admin/tb-quote-editor/ClientModificationsPanel.tsx`**
   - Props: `notes`, `decidedAt`, `previousQuoteId`.
   - Card amber/warning: titolo + data + body notes + bottone discreto "Vedi versione precedente" → apre `<PreviousVersionDialog>`.

9. **`src/components/super-admin/tb-quote-editor/QuoteReadOnlyView.tsx`**
   - Props: `quote`, `items` (oggetti già fetchati). Pure presentation, niente fetch.
   - Layout simile all'editor ma tutti i campi in display mode (no input). Usato sia da `<PreviousVersionDialog>` che dai branch `quote_sent / accepted / rejected` di `StatusSection`.

### Modificati

10. **`src/lib/tb-status.ts`** — aggiungere lo status `modification_requested` alla union `TBRequestStatus`, alla mappa `TB_REQUEST_STATUS_META` (label "Modifiche richieste", group `admin_action_needed`, badge ambra). Necessario per il nuovo branch dello switch.

11. **`src/pages/super-admin/TBRequestDetailPage.tsx`**
    - Sostituzione completa dei case `quote_requested`, `quote_in_composition`, `quote_sent`, `quote_accepted`, `quote_rejected` + nuovo case `modification_requested` con i componenti veri.
    - `StatusSection` ora ha bisogno anche di `requestId` e `quoteHistory` per individuare la draft attiva e la quote sent / accepted / rejected. Aggiunte props.
    - Mutation `superseedeMutation` (chiama `admin_supersede_and_create_new_version`) gestita qui per i flussi D ed F (così il page invalida le query e re-renderizza nello stato corretto). On success: `queryClient.invalidateQueries(['super-admin-tb-request', id])` + history + status-log. La pagina si re-renderizza nel nuovo stato `quote_in_composition` con la nuova draft, e `QuoteEditor` riceve i `previousClientNotes` come props per mostrare il pannello.

### Pattern del codebase riusati

- `useQuery` + `supabase.rpc(...)` come già fatto in `TBRequestDetailPage` per `get_tb_quote_history_for_admin`.
- `Card / CardHeader / CardContent`, `Input`, `Button`, `AlertDialog`, `Dialog`, `Accordion` shadcn standard.
- `toast.success / toast.error` da `sonner` come tutto il codebase.
- `format` / `formatDistanceToNow` da `date-fns` con `locale: it`.
- `Form / FormField / FormItem / FormControl / FormMessage` da `src/components/ui/form.tsx` (mai usate prima per veri form, ma sono pronte e wrappano RHF correttamente).
- Validazione zod come in `ProfileEditForm` ma con `zodResolver` invece di `safeParse` manuale (giustificato dalla complessità del form).

---

## 3. Pre-popolazione e flussi specifici

**EditorEmpty (status `quote_requested`)**: card con CTA "Avvia composizione". Click → setta lo stato locale `composing=true` e renderizza `<QuoteEditor quoteId={null} requestId={id} initialItemsFromProposals={proposals.filter(p => p.client_status === 'interested')}>`. Il `QuoteEditor` quando `quoteId` è null e ha `initialItemsFromProposals` pre-popola il field array con un item per proposta:
```ts
{ description: proposal.tb_formats.title, quantity: request.participants_min ?? 1,
  unit_price_ets: 0, unit_price_final: 0, proposal_id: proposal.id, notes: '' }
```
`valid_until = today + 30gg`, `terms_text = TERMS_DEFAULT_TB`. Nessun salvataggio automatico: il primo `admin_save_tb_quote_draft` lo fa l'admin cliccando "Salva bozza" o "Invia".

**Status `quote_in_composition`**: il `StatusSection` cerca nella `quoteHistory` la quote con `status='draft'` (deve essere unica per la request, garantito dal vincolo di business). Se trovata → `<QuoteEditor quoteId=draft.id ...>`. Se non trovata (caso anomalo, race condition o stato incoerente) → mostra `<InfoCard>` con messaggio "Bozza non trovata, ricarica la pagina" + bottone refresh.

**Status `modification_requested`**: il `StatusSection` cerca la draft attiva (status='draft') E la versione precedente con `status='modification_requested'`. Passa a `<QuoteEditor>` la draft + i `previousClientNotes` / `previousDecidedAt` della quote `modification_requested`. Il pannello `ClientModificationsPanel` resta visibile finché la nuova versione è in draft.

**Status `quote_rejected` con CTA "Crea nuovo preventivo"**: click → chiama `admin_supersede_and_create_new_version(rejected.id)`. La RPC restituisce `{new_quote_id, ...}` e cambia lo status request a `quote_in_composition`. `invalidateQueries` → la pagina si re-renderizza nel ramo `quote_in_composition` con la nuova draft già caricata.

**Storico (per stati B–F)**: `<QuoteHistoryAccordion>` sempre montato sotto l'editor / read-only. Il filtro RLS lato DB già esclude le `superseded` per HR ma per super_admin le mostra tutte → bene, lo storico deve mostrare anche le superseded.

---

## 4. Validazione zod (sintesi)

```ts
// draft = permissivo
quoteItemDraftSchema = z.object({
  id: z.string().uuid().optional(),
  proposal_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500),
  quantity: z.coerce.number().min(0).default(1),
  unit_price_ets: z.coerce.number().min(0).default(0),
  unit_price_final: z.coerce.number().min(0).default(0),
  notes: z.string().max(1000).nullable().optional(),
});
quoteDraftSchema = z.object({
  valid_until: z.string().nullable(),
  terms_text: z.string().max(10000),
  items: z.array(quoteItemDraftSchema),
});

// send = stretto, applicato solo all'handler Invia
quoteItemSendSchema = quoteItemDraftSchema.extend({
  description: z.string().trim().min(1, "Descrizione obbligatoria").max(500),
  quantity: z.coerce.number().positive("Quantità deve essere > 0"),
  unit_price_final: z.coerce.number().min(0),
  unit_price_ets: z.coerce.number().min(0),
});
quoteSendSchema = quoteDraftSchema.extend({
  valid_until: z.string().refine(d => new Date(d) >= startOfToday(),
    "Data validità deve essere oggi o futura"),
  items: z.array(quoteItemSendSchema).min(1, "Aggiungi almeno una voce"),
}).refine(v => sumFinal(v.items) > 0, { message: "Totale finale deve essere > 0", path: ['items'] });
```

---

## 5. Rischi specifici

**(R1) Doppio click su "Invia"**
Mitigazione: `disabled={sendMutation.isPending || saveDraftMutation.isPending}` su entrambi i bottoni footer. `AlertDialog` di conferma prima dell'invio aggiunge un secondo gate naturale. Inoltre la RPC `admin_send_tb_quote` controlla `status='draft'` come precondizione → seconda chiamata fallisce con errore esplicito che mostriamo via toast.

**(R2) Navigazione via con draft non salvata**
Mitigazione: `useEffect` che attacca `beforeunload` quando `form.formState.isDirty && !sendMutation.isSuccess`. Per la navigazione client-side React Router non triggera `beforeunload` → aggiungiamo un `useBlocker` di React Router v6 (controlla che sia disponibile nella versione installata; in alternativa hook custom con `<Prompt>` deprecato → fallback toast warning + conferma manuale via AlertDialog). **Decisione**: se `useBlocker` non disponibile, gestiamo solo `beforeunload` per il refresh/close tab e accettiamo che la navigazione interna possa perdere modifiche non salvate (il pulsante "Salva bozza" è ben visibile, e il rischio è contenuto data l'utenza super-admin tecnica).

**(R3) Reload durante l'invio**
Se l'admin ricarica mentre `sendMutation` è in volo: la RPC è atomica server-side (transazione). Quindi il quote o è stato inviato (status=`sent`) o non lo è. Al reload, il fetch ricarica la fonte di verità: se status=`sent` → render branch `quote_sent`, se status=`draft` → editor di nuovo aperto. Nessuna corruzione possibile. Documentiamo questo comportamento nel commento del componente.

**(R4) `unit_price_ets` colonna REVOKE-ata: insert/update diretto fallirebbe in modo opaco**
Tutte le mutations passano dalle RPC SECURITY DEFINER → bypassano il REVOKE. Il client legge i prezzi via `get_tb_quote_items_full_for_admin` (anche essa SECURITY DEFINER). Il pericolo sarebbe un'evoluzione futura del codice che bypassa l'editor con `.from('tb_quote_items').update(...)`. **Mitigazione**: commento esplicito sopra il file `QuoteEditor.tsx` "Tutte le scritture passano dalle RPC. NON usare `.from('tb_quote_items')` o `.from('tb_quotes')` direttamente: il REVOKE colonne ets bloccherebbe il client e gli stati non transiterebbero correttamente."

**(R5) Race condition due super-admin sulla stessa quote**
La RPC `admin_save_tb_quote_draft` fa `DELETE + INSERT` sugli items dentro una singola transazione → row lock implicito su `tb_quotes` via UPDATE. Il secondo super-admin attende il commit del primo, poi sovrascrive. Risultato: "last writer wins" senza corruzione di stato ma con perdita silenziosa delle modifiche del primo. Accettabile per ora (super-admin multipli sulla stessa quote è scenario raro). Documentazione nel commento del container; in futuro si può aggiungere `If-Match` con `updated_at` come optimistic lock se diventa un problema.

**(R6) Numeri in input con virgola italiana**
Input `type="number"` rispetta il locale del browser per il punto decimale, ma molti utenti italiani digitano con virgola e l'input rifiuta. Mitigazione: `type="text" inputMode="decimal"` + parsing manuale che accetta sia virgola che punto, e display formattato `it-IT`. Pattern: `String(value).replace(',', '.')` prima di `parseFloat`. Lo wrapperemo in un piccolo helper `parseDecimal(input)` in `tb-quote-schema.ts` e useremo `z.coerce.number()` che chiama `Number()` → quindi normalizziamo virgola → punto in `onChange` dell'input.

**(R7) `modification_requested` non in tb-status.ts**
Senza l'aggiornamento di `TB_REQUEST_STATUS_META` lo switch del nuovo `StatusSection` non tipiziarrebbe il branch (il `case 'modification_requested'` sarebbe valido a runtime ma TS lamenterebbe se il tipo della prop `status` fosse stretto). Aggiunto come deliverable esplicito. Verifica al primo step.

---

## 6. Ordine di implementazione

1. Verifica `@hookform/resolvers` in `package.json`. Se manca, `bun add @hookform/resolvers`.
2. Aggiungi `modification_requested` a `tb-status.ts`.
3. Crea `tb-defaults.ts` e `tb-quote-schema.ts` (puri, no UI).
4. Crea i componenti di presentazione: `QuoteItemRow`, `QuoteTotalsSummary`, `QuoteReadOnlyView`, `ClientModificationsPanel`.
5. Crea `PreviousVersionDialog` e `QuoteHistoryAccordion`.
6. Crea il container `QuoteEditor` con tutte le mutations.
7. Modifica `TBRequestDetailPage` sostituendo i branch `quote_*`.
8. Smoke test manuale con i 6 stati e con la transizione `modification_requested → nuova versione`.

---

Mi fermo qui. Quando approvi, procedo nell'ordine sopra.
