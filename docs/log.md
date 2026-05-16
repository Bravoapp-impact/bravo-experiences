# Log

Il diario delle modifiche al sistema. Una entry per **sessione di lavoro** non banale, in **ordine cronologico inverso** (la più recente in alto).

Serve per ricostruire il "perché" di una scelta a mesi di distanza, e per tenere allineati `architettura.md` e `principi.md` con quello che è realmente in produzione.

---

## Quando si scrive una entry

**Sì:** modifiche a schema DB, RLS, RPC, edge function, nuove feature UI rilevanti, copy importanti, modifiche al design system, refactor non banali, fix di sicurezza, decisioni di prodotto applicate al codice.

**No:** typo, rename file, fix UI minori senza impatto funzionale, riformattazioni.

Una entry copre **una sessione di lavoro** — anche se contiene più modifiche correlate, restano in un'unica voce.

## Come si scrive una entry

Si copia il template, lo si compila in cima alla sezione "Entries", si separa dalla precedente con `---`. Tutti i campi sono obbligatori: se un campo non si applica, si scrive esplicitamente `—` (così è chiaro che è stato considerato).

Se la sessione tocca DB, RLS, RPC o edge function, ricordarsi di aggiornare anche `architettura.md`.

## Template entry

```markdown
### YYYY-MM-DD — Titolo sintetico

**Contesto.** Perché questa modifica. 1-3 righe sul bisogno o problema.

**Cosa cambia.**
- Bullet 1
- Bullet 2

**Impatto.** `DB schema` · `RLS` · `RPC` · `Edge function` · `UI` · `Email` · `Auth` · `Docs`

**File / aree toccate.**
- path/o/area

**Follow-up.** Cose lasciate aperte, oppure `—`.
```

---

## Entries

### 2026-05-16 — Volontariato: modello esclusività a 2 assi + cleanup RLS

**Contesto.** Il modello di esclusività delle esperienze era ambiguo a livello DB: nessun vincolo impediva a un'esperienza `private` di avere più aziende nel bridge, le RLS HR/dipendente avevano bug (HR non vedeva date di esperienze private; dipendenti vedevano date riservate ad altre aziende), e HR aveva ancora INSERT/DELETE su `experience_companies` (residuo del modello in cui HR curava il catalogo). Lo `Switch "privata"` del `VisibilityDialog` non rifletteva nessuna delle decisioni reali.

**Cosa cambia.**
- Modello a 2 assi indipendenti formalizzato: asse esperienza (`experiences.visibility` = `public`/`private`) + asse data (`experience_dates.company_id` NULL o valorizzato). Caso d'uso target "canile alternato": esperienza `public` con date riservate ad aziende diverse (A il 1°/3° mercoledì, B il 2°/4°).
- RLS migrate in 2 blocchi (add-then-drop):
  - `hr_view_experience_dates_v5` (rimuove filtro `visibility = 'public'` di v4 che escludeva date di esperienze private; mantiene `experience_companies` + `company_id IS NULL OR my_company`)
  - `employees_view_dates_v3` (aggiunge `company_id IS NULL OR my_company`, fix bug v2 che mostrava date riservate ad altre aziende)
  - `association_manage_own_experience_dates_v2` (ETS gestisce proprie date, `WITH CHECK` impedisce di valorizzare `company_id`)
- Falla privilege escalation chiusa: rimosse `HR admin can activate/deactivate experiences for own company` su `experience_companies`. La curation è esclusivamente super-admin.
- Duplicate rimosse: `HR admin can view own company experience_companies`, `Admins can view all experience dates`, `Admins can view all experiences`.
- Trigger DB di consistenza: funzione `public.enforce_private_experience_single_company()` con 2 trigger gemelli — `enforce_private_single_company_on_bridge` (BEFORE INSERT su `experience_companies`) e `enforce_private_single_company_on_experiences` (BEFORE UPDATE OF visibility su `experiences`). Garantiscono `visibility = 'private'` ⇔ ≤1 azienda nel bridge. Messaggi di errore in italiano.
- UI: `VisibilityDialog` refactorato. Toggle "Condivisa"/"Esclusiva" al posto dello `Switch "privata"`. Esclusiva = RadioGroup single-select, azienda obbligatoria. Condivisa = Checkbox multi-select (0-N). Copy: "Visibilità e assegnazione", "Visibile a una sola azienda…" / "Visibile a tutte le aziende selezionate". Sequenza di salvataggio: DELETE bridge → UPDATE visibility → INSERT bridge, progettata per rispettare il trigger.

**Impatto.** `DB schema` · `RLS` · `UI` · `Docs`

**File / aree toccate.**
- `experience_dates`, `experience_companies`, `experiences` (policy + trigger + funzione)
- `src/components/super-admin/VisibilityDialog.tsx`
- `docs/volunteering.md`, `docs/architettura.md`

**Follow-up.** `src/pages/super-admin/ExperiencesPage.tsx` legge ancora `visibility === "private"` per i badge in tabella — funziona (i valori DB restano `public`/`private`), ma le etichette UI andrebbero rinominate in "Esclusiva"/"Condivisa" per coerenza con il nuovo copy del dialog.

---

### 2026-05-15 — UI: disattivate entry animations framer-motion (no flicker)

**Contesto.** Dopo l'introduzione degli skeleton (entry sotto) restava un micro-flicker percepibile: lo skeleton spariva e il contenuto vero entrava con `motion.*` (`initial opacity:0, y:10 → animate opacity:1`) presente in ~30 pagine. In quella frazione di secondo lo schermo "lampeggiava".

**Cosa cambia.**
- `src/App.tsx`: wrap globale `<MotionConfig reducedMotion="always">` da framer-motion. Tutti i `motion.*` esistenti saltano la transizione e vanno direttamente allo stato `animate` — niente fade-in iniziale, niente slide-in, niente delay a cascata.
- Hover/tap, animazioni di submit (spinner pulsanti), CSS keyframes (accordion, dialog, sheet) e `animate-pulse` degli skeleton restano invariati: non sono entry animations.
- Nessuna rimozione fisica dei `motion.*` dal codice: la scelta è reversibile in una riga.

**Impatto.** `UI`

**File / aree toccate.**
- `src/App.tsx`

**Follow-up.** Cleanup futuro opzionale: rimuovere fisicamente i `motion.*` di sole entry animation quando si toccano le rispettive pagine.

---

### 2026-05-15 — UI: skeleton al posto degli spinner full-screen

**Contesto.** L'app sfarfallava nei caricamenti: prima lo spinner del route guard, poi lo spinner della pagina, poi il contenuto. Richiesta esplicita di rimuovere gli spinner generici e mostrare uno **skeleton che anticipi la struttura della pagina sottostante**, così l'utente capisce che sta caricando senza interruzioni visive.

**Cosa cambia.**
- Nuovi componenti `src/components/common/skeletons/PageSkeleton.tsx` (varianti `list` / `table` / `detail` / `dashboard` / `form` / `grid`) e `AppBootSkeleton.tsx` (shell completo lato admin/sidebar oppure mobile/employee).
- Route guards (`ProtectedRoute`, `ProtectedHRRoute`, `ProtectedSuperAdminRoute`, `ProtectedAssociationRoute`) sostituiscono lo spinner centrato con `AppBootSkeleton` (role `admin` / `employee`).
- Migrate da `LoadingState` / `Loader2` full-page a `PageSkeleton`: **HR** (`HRHomePage`, `HRDashboard`, `HRExperiencesPage`, `HRTeamBuildingPage`, `HRTBProposalDetailPage`, `HRNewTBRequestPage`, `HREmployeesPage`), **Association** (`AssociationHome`, `AssociationExperiencesPage`, `AssociationHistoryPage`, `AssociationCalendarPage`, `AssociationProfilePage`), **Employee** (`Profile`, `MyBookings`).
- Spinner legittimi preservati: dentro pulsanti submit, upload in corso, azioni inline brevi.

**Impatto.** `UI` · `Design system`

**File / aree toccate.**
- `src/components/common/skeletons/{PageSkeleton,AppBootSkeleton}.tsx` (nuovi)
- `src/components/Protected{,HR,SuperAdmin,Association}Route.tsx`
- 14 pagine sopra elencate
- `docs/design-system.md` (nuova nota "Loading states")

**Follow-up.** Estendere il pattern alle pagine super-admin che eventualmente usano ancora `LoadingState`/spinner full-page (sweep secondario quando le si tocca).

---

### 2026-05-15 — HR: `/hr/experiences/:id` diventa puramente informativa

**Contesto.** Il modello di prodotto è cambiato: l'HR non cura più il catalogo, lo *vede*. La pagina di dettaglio esperienza HR conteneva ancora tutta la logica di curation (attivazione/disattivazione esperienza per la propria azienda) ereditata dal modello precedente.

**Cosa cambia.**
- `src/pages/hr/HRExperienceDetail.tsx`: rimossi `isActive`, `isToggling`, `drawerOpen`, `handleToggle`, `fetchActivation`, `HRMobileActionDrawer`, `HRRelatedExperiencesList` di curation. Resta solo la vista informativa.
- Sidebar dettaglio riportata a stile Airbnb (coerente col resto delle viste experience-detail).
- Nessuna azione HR di attivazione/disattivazione su `experience_companies`: la curation è in mano al team Bravo!.

**Impatto.** `UI` · `Prodotto`

**File / aree toccate.**
- `src/pages/hr/HRExperienceDetail.tsx`
- `src/components/hr/HRSidebar.tsx` (e componenti correlati al dettaglio)

**Follow-up.** —

---

### 2026-05-15 — HR: `/hr/volontariato` come vista unica del programma aziendale

**Contesto.** Stesso cambio di modello dell'entry sopra: l'HR non vede più "il catalogo Bravo! da cui scegliere" + "il proprio programma" + "le statistiche" come tab separati. Vede direttamente, in una sola pagina, **il programma di volontariato attivato per la sua azienda** dal team Bravo!. RLS lato DB già aggiornate (HR non può scrivere su `experience_companies`).

**Cosa cambia.**
- `src/pages/hr/HRExperiencesPage.tsx` riscritta: rimossi i 3 tab (Catalogo / Il mio programma / Statistiche), `handleActivate`/`handleDeactivate`, lo stato `activatedIds`, gli stati `statsExperiences`/`statsLoading`/`statsLoaded`. Singola lista delle esperienze attivate per l'azienda.
- Grid card: su `HRExperiencesPage` e `HRTeamBuildingPage` sostituito `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` con `grid-cols-[repeat(auto-fill,minmax(...))]` — cap dimensionale per evitare card troppo grandi su schermi larghi. Card volutamente un filo più grandi di quelle del catalogo employee (`/app/experiences`).
- `src/components/common/BravoCard.tsx`: titolo `text-[13px]` → `text-[15px]`.

**Impatto.** `UI` · `Prodotto`

**File / aree toccate.**
- `src/pages/hr/HRExperiencesPage.tsx`
- `src/pages/hr/HRTeamBuildingPage.tsx`
- `src/components/common/BravoCard.tsx`

**Follow-up.** Allineare `docs/volunteering.md` e `docs/architettura.md` se descrivono ancora HR come curatore (vedi questa stessa sessione).

---

### 2026-05-15 — UI: sweep finale Card→PageSection per tabelle/liste

**Contesto.** Secondo passaggio del refactor stile Attio: bonifica dei call-site rimasti che ancora avvolgono tabelle e liste in `<Card><CardHeader/><CardContent/>`. Riferimento visivo: `/super-admin/associations`. Le primitive (`ui/table.tsx`, `crud/CrudTableCard.tsx`, `crud/CrudTableRow.tsx`) erano già allineate, non serviva un nuovo componente "Table".

**Cosa cambia.**
- HR: `BookingsTable`, `TopPerformersTable`, `UpcomingEvents` → `PageSection` (no Card wrapper).
- Super Admin: `TBRequestsPage`, `TBFormatsPage`, `AccessCodesPage`, `ExperiencesPage`, `EmailSettingsPage` → `PageSection`. Header tabella allineato con `bg-muted/50`.
- Association: `AssociationHistoryPage` → lista "Date Passate" piatta, summary cards (metriche hero) restano `<Card>` per regola.

**Impatto.** `UI` · `Design system`

**File / aree toccate.**
- `src/components/hr/BookingsTable.tsx`, `src/components/hr/TopPerformersTable.tsx`, `src/components/hr/UpcomingEvents.tsx`
- `src/pages/super-admin/{TBRequestsPage,TBFormatsPage,AccessCodesPage,ExperiencesPage,EmailSettingsPage}.tsx`
- `src/pages/association/AssociationHistoryPage.tsx`
- `docs/design-system.md` (nota header tabella `bg-muted/50`)

**Follow-up.** Modali (`BookingDetailModal`, `FeedbackModal`, `ExperienceDateDialog`, `TBFormatEditDialog`, `VisibilityDialog`) e detail pages TB (`HRTBRequestDetailPage`, `HRTBProposalDetailPage`, `TBRequestDetailPage`, `TBFormatDetailPage`, `tb-quote-editor/*`) restano da bonificare. Pagine employee-facing (`Impact`, `Profile`) lasciate nello stile Airbnb attuale.

---

### 2026-05-15 — UI: rimozione card-wrapper a favore di layout piatto stile Attio

**Contesto.** Incongruenza visiva tra pagine "a riquadri" (HR Home, dashboard super-admin, liste con `<Card>` che wrappano una tabella) e pagine "piatte" (impostazioni profilo). Decisa una regola unica: la `<Card>` resta riservata ai blocchi che devono spiccare visivamente; tutto il resto va piatto sul background della pagina, separato da hairline e spacing.

**Cosa cambia.**
- Nuovo componente `src/components/common/PageSection.tsx` come alternativa flat a `<Card>` per liste/widget/sezioni di settings.
- `src/components/crud/CrudTableCard.tsx` riscritto: stesso nome e stessa API, ma non renderizza più il wrapper `<Card>` — solo header con hairline + content. Propaga il layout piatto a tutte le liste super-admin (Users, Companies, Associations, Experiences, TBFormats, TBRequests, AccessCodes, AccessRequests, Cities, Categories, EmailSettings).
- HR: `HRHomePage` (widget "Prossime iniziative" + "Riepilogo rapido"), `HREmployeesPage` (filtri + tabella utenti), `HRExperiencesPage` (filtri tab statistiche) — tutti appiattiti su background unico, divisori a linea.
- Super Admin: `UsersPage` rifatto a mano (non passava da `CrudTableCard`); `SuperAdminDashboard` "Azioni Rapide" appiattito.
- Association: `AssociationHome` widget appiattiti.
- Stessa regola applicata anche al dark theme (nessuna eccezione per il canvas).

**Impatto.** `UI` · `Design system`

**File / aree toccate.**
- `src/components/common/PageSection.tsx` (nuovo)
- `src/components/crud/CrudTableCard.tsx` (riscritto, no Card wrapper)
- `src/pages/hr/HRHomePage.tsx`, `src/pages/hr/HREmployeesPage.tsx`, `src/pages/hr/HRExperiencesPage.tsx`
- `src/pages/super-admin/UsersPage.tsx`, `src/pages/super-admin/SuperAdminDashboard.tsx`
- `src/pages/association/AssociationHome.tsx`

**Follow-up.** Sweep successiva su:
- HR: `HRTBRequestDetailPage`, `HRTBProposalDetailPage`, modali HR (`HRBookingsDialog`, `EmployeeParticipationsDialog`), `BookingsTable`, `TopPerformersTable`.
- Super Admin: `TBRequestDetailPage`, `TBFormatDetailPage`, `tb-quote-editor/*`, modali (`ExperienceDateDialog`, `TBFormatEditDialog`, `VisibilityDialog`).
- Association: `AssociationHistoryPage`, `AssociationPublicProfile`, modali condivisi (`BookingDetailModal`, `FeedbackModal`).
- `EmployeeMetricsCards`: tenere come MetricCard (numeri hero) ma verificare coerenza wrapper.

---

### 2026-05-13 — TB rollout: Step 1 + Step 2 (lista HR riprogettata)

**Contesto.** Avvio dell'implementazione del nuovo modello "bacheca accumulativa" descritto in `tb-flow.md`. Si parte dagli step abilitanti: DB additivo minimo (Step 1) e riprogettazione della lista HR `/hr/team-building` (Step 2).

**Cosa cambia.**
- **Step 1 (DB additivo, ✅):** aggiunta colonna `tb_requests.state` `GENERATED` (4 valori: `open`/`confirmed`/`completed`/`cancelled`, mappata da `status`); aggiunta `tb_proposals.is_active boolean NOT NULL DEFAULT true`; indici `idx_tb_requests_state`, `idx_tb_proposals_is_active`. Nessun drop, RLS invariate, comportamento esistente non toccato.
- **Step 2 (frontend, ⚠️ da rivedere):** riscrittura di `src/pages/hr/HRTeamBuildingPage.tsx` con tre sezioni ("Eventi in programma" / "Richieste in corso" / "Archivio" collassato) guidate da `state`. Pill calcolata client-side dalla gerarchia proposte+quote. Bozze unificate dentro "Richieste in corso". Query batch con `.in()` (1 + N parallele in `Promise.all`).
- Nuovo helper `src/lib/tb-category-icons.ts`: mappa fissa `categoryId → LucideIcon` per le 11 categorie + `getTbPrimaryCategoryId` che estrae la prima preferred activity da `extra_services`. Nessuna modifica al wizard (la categoria preferita era già catturata).
- Fix in corso giornata: l'embed `format:tb_formats(image_url)` su `tb_events` rompeva la query (FK inesistente) → empty state anche con 9 richieste a DB. Sostituito recuperando l'immagine da `tb_proposals.format_id` della proposta accettata, via query parallela aggiuntiva.
- Documentazione: aggiunto banner di stato in cima a `tb-flow.md` (Step 1 ✅, Step 2 ⚠️, Step 3–7 non avviati). Creato `docs/tb-flow-implementation-plan.md` con il piano originario completo come reference.

**Impatto.** `DB schema` · `UI` · `Docs`

**File / aree toccate.**
- `tb_requests` (colonna `state` generated), `tb_proposals` (colonna `is_active`), indici relativi
- `src/pages/hr/HRTeamBuildingPage.tsx` (riscrittura)
- `src/lib/tb-category-icons.ts` (nuovo)
- `docs/tb-flow.md`, `docs/tb-flow-implementation-plan.md`, `.lovable/plan.md`

**Follow-up.**
- **Step 2 da rivedere**: ci sono errori residui sulla lista HR (oltre al fix embed `tb_events` già applicato). Aprire una sessione di correzione prima di considerare lo Step 2 chiuso e di procedere con lo Step 3.
- Aggiornare `architettura.md` con la nuova colonna `state` su `tb_requests` e `is_active` su `tb_proposals`.
- Step 3 (DB additivo Fase 1 + RPC per-proposal) resta in attesa.

---
### 2026-05-11 — Introdotto `docs/log.md`

**Contesto.** Mancava un punto unico dove tracciare le modifiche al sistema sessione per sessione. `architettura.md` descrive lo stato attuale, `principi.md` descrive il perché — ma il "cosa è cambiato e quando" era disperso tra commit e memoria.

**Cosa cambia.**
- Creato `docs/log.md` con header, regole d'uso, template e questa prima entry seed.
- Definito lo schema fisso di ogni entry (Contesto, Cosa cambia, Impatto, File toccati, Follow-up) e l'ordine cronologico inverso.

**Impatto.** `Docs`

**File / aree toccate.**
- `docs/log.md`

**Follow-up.** A regime, ogni sessione che tocca DB / RLS / RPC / edge function deve aggiornare anche `architettura.md` oltre al log.

---

## 2026-05-15 — Header pagina allineato alla sidebar + icona titolo

**Cosa cambia.** Il `<main>` di `AdminLayout` ora usa `pt-3` (allineato al `pt-3` della sidebar): il titolo della pagina cade alla stessa altezza del nome utente in alto a sinistra, stile Attio. `PageHeader` accetta `icon` e `iconColor` opzionali e renderizza un quadrato `h-7 w-7 rounded-md bg-muted` con l'icona della voce sidebar corrispondente, accanto al titolo.

**File / aree toccate.**
- `src/components/layout/AdminLayout.tsx`
- `src/components/common/PageHeader.tsx`
- Tutte le pagine che usano `PageHeader` (Super Admin, HR, Association) — aggiunta `icon` + `iconColor` coerenti con la sidebar.

**Follow-up.** Le pagine con header custom inline (es. `AccessCodesPage`, `ExperiencesPage`, `TBFormatsPage`, `EmailSettingsPage`, `AssociationHistoryPage`, `AssociationExperiencesPage`, `HRHomePage`, `AssociationHome`) ereditano l'allineamento via `pt-3` ma non l'icona — migrare a `PageHeader` in un passaggio successivo.
