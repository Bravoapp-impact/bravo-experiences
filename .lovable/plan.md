## Obiettivo

Eliminare l'incongruenza tra pagine "a riquadri" (es. HR Home, Super Admin Dashboard, liste con `<Card>` che wrappa una tabella) e pagine "piatte" (es. impostazioni profilo). Standard target: **layout piatto su background unico, separazioni con linee/spacing**, in stile Attio. Le `<Card>` restano un'eccezione, non la regola.

## Principio guida (regola da inserire nel design system)

Una `<Card>` si usa **solo** quando il blocco deve spiccare visivamente come oggetto a sé:

- sidebar di prenotazione su pagina dettaglio esperienza
- card di un item dentro una griglia (es. esperienza, format TB) — il "card" è il dato stesso
- riquadri evidenza in stati vuoti / call-to-action prominenti

In tutti gli altri casi (tabelle, liste, form sezionati, widget di dashboard, contenuto di modali) il contenitore è **piatto sul background della pagina**, e gli elementi sono separati da:

- titolo di sezione + spacing verticale generoso
- `border-b border-border` come hairline tra righe / sotto-sezioni
- per tabelle: nessun wrapper `rounded-lg border` attorno; solo header con `border-b` e righe con `border-b border-border/60`

## Inventario (output dell'analisi)

Card da rimuovere/appiattire (lista non esaustiva, da consolidare in fase 1):

**HR**

- `HRHomePage.tsx` — Card "Prossime iniziative" e "Riepilogo rapido": diventano sezioni piatte con titolo + lista a linee
- `HREmployeesPage.tsx` — Card filtri + Card tabella utenti: tabella diretta su background, filtri sopra senza wrapper
- `HRExperiencesPage.tsx` — Card filtri + Card empty state: appiattire
- `HRTBRequestDetailPage.tsx`, `HRTBProposalDetailPage.tsx` — sezioni status/brief in card → sezioni a linee
- `HRBookingsDialog`, `EmployeeParticipationsDialog`, `BookingsTable` — tabelle senza wrapper Card

**Super Admin**

- `SuperAdminDashboard.tsx` — Card "Azioni Rapide" + statistiche secondarie: appiattire (le metric card in alto restano, vedi sotto)
- `UsersPage`, `CompaniesPage`, `AssociationsPage`, `ExperiencesPage`, `TBFormatsPage`, `TBRequestsPage`, `AccessCodesPage`, `AccessRequestsPage`, `CitiesPage`, `CategoriesPage`, `EmailSettingsPage` — tutte hanno `<Card>` che wrappa filtri + tabella → appiattire
- `TBRequestDetailPage`, `TBFormatDetailPage` — sezioni in card → sezioni a linee
- `tb-quote-editor/QuoteEditor`, `QuoteReadOnlyView`, `QuoteHistoryAccordion`, `ClientModificationsPanel` — ridurre wrapper Card, mantenerla solo se serve a isolare il preventivo come "oggetto"

**Association**

- `AssociationHome`, `AssociationHistoryPage`, `AssociationExperiencesPage` (se presente la stessa logica) — stesso trattamento

**Componenti condivisi**

- `CrudTableCard` — diventa `CrudTableSection` (o si toglie il bordo/background mantenendo solo il padding e l'header)
- `BookingsTable`, `TopPerformersTable`, `EmployeeMetricsCards` (parte non-metric) — togliere wrapper Card
- `MetricCard` — **resta** (è un blocco che deve spiccare per attirare attenzione su un numero)

**Modali**

- `BookingDetailModal`, `FeedbackModal`, `ExperienceDateDialog`, `TBFormatEditDialog`, `VisibilityDialog`, dialog del quote editor — rimuovere card annidate dentro il `DialogContent`, usare sezioni con `border-b`

## Cosa NON cambia

- Card "evidenza" su pagine pubbliche e employee:
  - sidebar prenotazione su `ExperienceDetail` (DateSlotCard / DatesSidebar)
  - card item di griglia (HRExperienceCard, ExperienceCardRich/Compact, BravoCard, TB format card)
  - MetricCard nelle dashboard (numeri "hero")
- Layout AdminLayout / Sidebar / header pagina
- Logica, dati, RLS, RPC, edge functions, routing — niente di tutto questo viene toccato
- Stile pagine auth (login/register/reset)

## Approccio in 3 step incrementali

**Step 1 — Definire il pattern e applicarlo a un'area pilota (HR)**

- Aggiungere in `docs/design-system.md` la regola "Card vs sezione piatta" con esempi do/don't
- Creare (se serve) un piccolo componente `<PageSection title description>` che renderizza titolo + spacing + `border-b` finale, da usare al posto di `<Card>` per i blocchi piatti
- Refactor pagine HR: `HRHomePage`, `HREmployeesPage`, `HRExperiencesPage`, dettagli TB, modali HR
- Test visivo desktop + mobile su tutte le pagine HR

**Step 2 — Super Admin**

- Refactor di `CrudTableCard` (rendere il bordo/background opzionale, default off) — questo propaga la modifica su quasi tutte le liste super-admin in un colpo solo
- Refactor pagine super-admin che non passano da CrudTableCard (Dashboard, dettaglio TB, quote editor)
- Refactor modali super-admin

**Step 3 — Association**

- Stesso trattamento sulle pagine association (Home, History, dettagli, modali)
- Pulizia finale: rimuovere import `Card` non più usati, verificare che nessun `bg-card` residuo crei "isole" indesiderate

## Aggiornamenti documentazione (a fine implementazione)

- `docs/design-system.md` — sezione "Card vs sezione piatta"
- `docs/log.md` — entry per ciascuno step
- `docs/aperto.md` — eventuali pagine lasciate a card per scelta esplicita, con motivazione
- Memoria progetto: aggiungere riga in `mem://style/component-patterns` con la nuova regola

## Domande aperte (rispondibili anche dopo l'approvazione del piano)

1. Vuoi che parta dall'area HR (più visibile, dove hai notato l'incongruenza) o preferisci iniziare da Super Admin (più pagine, più impatto sistemico)? -> ok
2. Sul dark theme: la regola "no card" rischia di far perdere gerarchia perché tutto diventa stesso colore. Vuoi che mantenga `bg-card` come canvas pagina nel dark mode (pagina = card, sezioni piatte dentro), o anche in dark applichiamo lo stesso principio piatto? -> applichiamo lo stesso principio sul dark theme