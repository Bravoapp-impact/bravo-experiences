# Aperto

Il documento delle cose che non sono ancora chiuse: decisioni da prendere, debiti tecnici noti, prossimi sprint. Si tocca ogni volta che qualcosa entra, esce, o cambia di natura. 

L'ordine all'interno di ogni sezione è per urgenza decrescente: cosa sta sopra è quello che pesa di più *oggi*. Cosa pesa di più cambia nel tempo, e il documento va riordinato di conseguenza.

---

## Decisioni da prendere

**Matrice di feature gating del freemium.** Quali funzionalità sono nel tier gratuito e quali nel paid: numero massimo di dipendenti registrati, numero massimo di esperienze attive, accesso a galleria, comunicazioni email, Impact Report, esportazioni. È la decisione più strutturante per l'apertura self-serve di settembre — senza, il Capitolo Freemium non parte e mezzo prodotto resta in attesa.

**SDG: etichetta o metrica.** Oggi gli SDG sono badge descrittivi sulla scheda esperienza, non alimentano nessuna aggregazione. Promuoverli a dimensione vera dell'impatto significa modellarli nel layer dati e nei report. Decisione da prendere con Nicole, insieme alla successiva.

**Quali dimensioni di impatto sono canoniche.** Ore di volontariato, partecipanti unici, beneficiari raggiunti, SDG, soddisfazione aggregata, ritorno qualitativo da feedback — quali entrano effettivamente nel sistema impatto e quali no. Senza questa decisione, lo Scaffold 2 (layer dati impatto) resta parcheggiato e bloccano pagina Impatto dipendente, tab Statistiche HR, Impact Report.

**"Il mio programma" nel pannello HR: resta o sparisce.** Con il calendario HR centrale (Ondata 2), il tab "Il mio programma" rischia di essere ridondante. Se sparisce, semplifica la UI; se resta, va ridefinito lo scopo. Da decidere prima dell'Ondata 2.

**Esperienze di città vicine nel catalogo dipendente.** Quando l'HR ha impostato una città non coperta (es. Bologna senza ETS attive), il catalogo del dipendente non deve essere un deserto. L'opzione "mostrare Milano con tag *possibile trasferta*" risolve il senso di vuoto ma può creare confusione.

**Editor live esperienze associazione: prioritario o rimandabile.** Per il self-serve associazione di settembre serve un modo per le ETS di pubblicare esperienze. Editor live è la soluzione di qualità; il form attuale è la soluzione di compromesso che accetta una qualità minore del contenuto pubblicato. Decisione che impatta l'Ondata 6.

**Ambiente di staging separato dalla produzione.** Branch preview di Lovable, ambiente separato gestito manualmente, o altra alternativa? Prerequisito per aprire il self-serve a clienti sconosciuti — finché non c'è, ogni modifica al codice tocca direttamente la produzione. Decisione tecnica che posso preparare io, ma va presa.

**KPI in prima vista nel dashboard super admin.** Quali numeri si vedono al primo colpo d'occhio e quali stanno in drill-down. La regola che ci eravamo dati è "in prima vista solo quelli su cui si può agire", ma va concretizzata. Non blocca nulla finché l'Ondata 5 non parte.

**Guida contestuale all'HR: quanto invasiva.** Tooltip che appaiono quando l'utente si ferma su un elemento nuovo, o tour iniziale obbligatorio, o nulla. Da testare in beta: se gli HR si muovono bene da soli, la teniamo leggera; se si bloccano, la rendiamo più robusta. Decisione da prendere su dati reali, non a priori.

---

## Debito tecnico noto

Cose che sappiamo essere imperfette o incomplete, ma che non bloccano lo sprint corrente. Ordinate per urgenza: in alto quello che è già una frizione reale, in basso quello che diventerà un problema solo in futuro.

**Galleria: controparte super-admin assente.** La galleria HR è operativa (moderazione, bulk actions, upload diretto), ma manca una vista super-admin per supervisionare cross-company (audit, moderazione cross-tenant, gestione storage). Da aprire prima di scalare oltre una manciata di aziende con foto attive.

**Galleria dipendente: visibilità parziale.** Oggi il dipendente vede solo le foto che ha caricato lui. La galleria aziendale completa — foto approvate dall'HR di tutta la company — non gli è ancora esposta. Da decidere dove e come mostrarla (tab dedicato, pagina dedicata, sezione in `/app/impact`).

**Galleria HR: upload e filtri da rifinire.** Upload diretto HR funzionante ma migliorabile (drag-and-drop avanzato, batch più grandi, retry parziali, naming intelligente, edit metadata in-line). Filtri attuali (esperienza, range date) limitati: mancano filtro per associazione, per uploader, per stato (`hidden` vs `approved`), per "featured", e ricerca testuale su caption.

**Audit di sicurezza RLS/SECURITY DEFINER.** Lovable ha prodotto un inventario di punti deboli durante l'hardening dello sprint TB preventivi. Da rivedere e classificare per priorità in uno sprint dedicato.

**Rimettere "Formazione", "Negozio solidale", "Convenzioni" nella sidebar HR.** Voci e relative sezioni Impostazioni rimosse temporaneamente dalla sidebar HR (e dal layout impostazioni) perché non ancora implementate. Le route placeholder e le pagine di settings vanno ripristinate quando i moduli verranno aperti. Riferimenti rimossi in `HRLayout.tsx`, `HRSettingsLayout.tsx`, `App.tsx` (route `/hr/formazione`, `/hr/negozio`, `/hr/convenzioni` e relative `impostazioni/*`).

**Sweep "no-card" — secondo passaggio fatto, restano i dettagli e i modali.** Sweep finale del 2026-05-15 ha appiattito tabelle/liste su HR (`BookingsTable`, `TopPerformersTable`, `UpcomingEvents`), Super Admin (`TBRequestsPage`, `TBFormatsPage`, `AccessCodesPage`, `ExperiencesPage`, `EmailSettingsPage`) e Association (`AssociationHistoryPage`). Restano: detail pages TB (`HRTBRequestDetailPage`, `HRTBProposalDetailPage`, `TBRequestDetailPage`, `TBFormatDetailPage`, `tb-quote-editor/*`) e modali (`BookingDetailModal`, `FeedbackModal`, `HRBookingsDialog`, `EmployeeParticipationsDialog`, `ExperienceDateDialog`, `TBFormatEditDialog`, `VisibilityDialog`). Pagine employee-facing (`Impact`, `Profile`) lasciate in stile Airbnb. Eccezioni invariate: `MetricCard`, sidebar prenotazione su `ExperienceDetail`, card item di griglia.

**Ambiente di staging assente.** Bravo! oggi non ha un ambiente di staging separato dalla produzione pubblica. Durante la migrazione email questo ha creato un momento di rischio (schermata bianca in produzione durante un fix). Prima di aprire il self-serve a settembre, va affrontato. Collegato alla decisione corrispondente in §1.

**Drop colonne legacy su `experiences` e `experience_dates`.** `experience_dates.company_id`, `experiences.city`, `experiences.category`, `experiences.association_name` sono colonne sostituite da foreign key (`city_id`, `category_id`, `association_id`) ma ancora presenti nel DB. Prima di droppare va verificato che nessun frontend le legga ancora — se sì, riscrivere il frontend prima del drop. Regola "aggiungi prima, rimuovi dopo".

**`company_service_config` nelle catene RLS.** La tabella resta in vista del freemium, ma è ancora referenziata da policy di visibilità che andavano costruite per retrocompatibilità. Le policy vanno semplificate togliendo `company_service_config` dalla catena, lasciando solo la tabella per l'uso futuro.

**Query N+1 in pagine HR pesanti.** `HRExperiencesPage` (tab statistiche) e `HRDashboard` fanno query inefficienti. Vanno migrate alle view SQL del layer impatto — ma quel layer non esiste finché non si chiudono le decisioni su SDG e dimensioni d'impatto.

**Hook legacy non ancora migrati a TanStack Query.** Lo scaffold è chiuso, gli hook nuovi seguono il pattern. I vecchi vengono migrati "in corsa" quando si tocca la pagina che li consuma — non in blocco. Pattern di riferimento: `useRelatedExperiences`, `useEmployeeCatalog`. Convenzioni in `data-fetching.md`.

**3 fix puntuali al `QuoteEditor`.** Bug `useEffect` reset (aggiungere flag `hasInitialized` con `useRef`), pre-popolazione `quantity` con `request.participants_min` lungo la catena `TBRequestDetailPage → StatusSection → EditorEmpty → QuoteEditor`, passaggio `mode: "onChange"` → `mode: "onBlur"` per ridurre re-render. Un singolo prompt Lovable in Default Mode.

**Email `tb-quote-sent` da implementare.** Notifica HR all'invio del preventivo super-admin. È l'unica che fa partire l'azione cliente — le altre transizioni di stato (accepted, rejected, modification_requested) restano notifiche in-app per V1. Pattern wrapper su `send-transactional-email` già consolidato.

**Lazy loading e prefetch sui punti di navigazione prevedibili.** Quando l'HR clicca una card, il dettaglio si potrebbe prefetchare già. Lavoro semplice con `prefetchQuery` di TanStack Query.

**Mobile e accessibilità.** Bravo! è stato progettato desktop-first. Per il self-serve va bene mobile-friendly (non mobile-first), ma i bug evidenti vanno chiusi con un test sistematico mobile sui flussi critici.

**Testing end-to-end sui flussi critici.** Registrazione freemium, attivazione programma, invito dipendente, prenotazione, feedback, upgrade. Ogni flusso testato su almeno due ruoli. Non esistono test automatici oggi; ne va aperto un ciclo prima dell'apertura self-serve.

**Event tracking di prodotto.** Nessun PostHog o equivalente installato. Quando a settembre arriveranno aziende sconosciute, senza tracking non sapremo perché entrano, cosa guardano, dove si fermano. Must prima del lancio pubblico. Candidato leggero: PostHog.

**Documenti tematici mancanti.** `volunteering.md` da scrivere a valle della stabilizzazione TB (per formalizzare il flusso volontariato come `tb-flow.md` formalizza il TB). `copy-voice.md` mai scritto: tono, terminologia, parole vietate. Utile prima dell'Ondata 4 onboarding, dove il copy è centrale.

**Tracciamento ETS-per-proposta strutturato (TB).** Oggi il super-admin riceve i prezzi via email dall'ETS e li trascrive a mano nella riga giusta del preventivo. Funziona finché i preventivi attivi sono pochi, da affrontare strutturalmente con più di 3 preventivi attivi contemporaneamente.

**Campo "margine % desiderato" nel `QuoteEditor`.** Quality of life: se valorizzato, calcola automaticamente `unit_price_final` da `unit_price_ets`. Da introdurre quando il volume di preventivi cresce.

**Etichette "Pubblica/Privata" nella tabella esperienze (super-admin).** Il `VisibilityDialog` ora usa "Condivisa/Esclusiva" allineato al modello prodotto (trigger DB che vincola le esperienze esclusive a una sola azienda). La tabella in `ExperiencesPage.tsx` legge ancora `visibility === "private"` per mostrare badge "Privata"/"Pubblica": va rinominato in "Esclusiva"/"Condivisa" per coerenza terminologica. Solo cambio di copy, nessuna logica.

**Template email in italiano hardcoded.** Funziona finché il target è Italia. Quando si aprirà a un cliente non italofono, la struttura attuale richiede la moltiplicazione dei template per lingua. Vincolo architetturale da riconoscere, non da risolvere oggi.

**Pagina "Utenti HR" single-vertical.** Oggi la pagina `/hr/users` mostra metriche, segmenti e funnel solo per la verticalità volontariato (ore, presenze, top performer). Quando apriremo formazione, negozio solidale e team building come verticali complete, la pagina dovrà diventare cross-verticale: ogni card metrica dovrà supportare il breakdown per verticalità (o almeno la selezione della verticalità attiva), e i segmenti "Attivi / Da coinvolgere / Nuovi" dovranno essere ricalibrati per non essere esclusivamente volontariato-centrici. Da affrontare quando la seconda verticale (dopo volontariato) sarà in produzione.

---

## Prossimi sprint

Vista temporale, dall'immediato al medio termine. Ordine cronologico: in alto cosa parte ora, in basso cosa arriva dopo.

**Chiusura sprint TB preventivi.** I 3 fix puntuali al `QuoteEditor`, la pagina HR preventivo (`HRTBRequestDetailPage` con vista cliente, RPC `mark_tb_quote_viewed`, decisioni via `hr_decide_on_quote`), l'email `tb-quote-sent`. Dettagli operativi in `tb-sprint-handoff.md`.

**Lancio volunteering — giugno 2026.** Primo cliente firmato in produzione. Finalizzare il modulo volontariato prima del lancio, solo bug-fixing reattivo se emerge qualcosa nei test interni. È la densità maggiore di evidenza che genereremo: ~20 ipotesi di prodotto testate contemporaneamente.

**Ondata 1 — completamento foundations.** Scaffold layer impatto (sbloccabile quando si chiudono le decisioni SDG + dimensioni canoniche). Email aggiuntive del lifecycle prenotazione (notifiche associazione di nuova prenotazione e cancellazione). Ridisegno catalogo dipendente in stile Airbnb (indipendente, può partire anche prima).

**Ondata 2 — HR operatività.** Calendario HR in homepage e pagina dedicata. Ridisegno tab Statistiche come anteprima report. Impact Report completo con export PDF. Homepage HR ridisegnata come dashboard contestuale. Galleria foto.

**Ondata 3 — Esperienza dipendente.** Pagina Impatto dipendente ridisegnata (dipende dal Capitolo 1). Flusso feedback attivo con email post-evento. Ridisegno "Le mie prenotazioni". Badge base. Comunicazione HR → dipendenti (broadcast email, infrastruttura `announcements` separata da quella transazionale).

**Ondata 4 — Freemium e onboarding.** Matrice feature gating implementata (dipende dalla decisione corrispondente in §1). Onboarding HR e dipendente al primo accesso. Email di onboarding. Empty states ridisegnati.

**Ondata 5 — Super admin e KPI.** Dashboard KPI prodotto. Vista pipeline aziende. Flusso approvazione esperienze e gestione `association_suggestions`. Panel configurazioni globali.

**Ondata 6 — Associazione e contenuto.** Homepage associazione con calendario. Recensioni ricevute. Editor live esperienze (se viene presa la decisione corrispondente in §1). Impostazioni HR. Gestione città non coperte lato dipendente. Flusso approvazione associazioni.

**Ondata 7 — Self-serve associazione e polish.** Self-serve onboarding associazione. Debt cleanup (le voci §2 sopravvissute fin qui). Performance pass. Testing end-to-end. Ambiente di staging separato. Beta privata in pieno utilizzo.

**Ondata 8 — Lancio pubblico self-serve — settembre 2026.** Apertura registrazioni self-serve. Monitoraggio KPI. Iterazioni veloci sui primi dati di campo.