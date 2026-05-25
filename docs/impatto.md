# Sistema di impatto — documento di design

Documento di riferimento del sistema di impatto di Bravo!. Definisce il modello dati, le viste canoniche e le quattro letture per i quattro attori della piattaforma.

Questo documento copre il **volontariato**. Team building e formazione avranno una rendicontazione propria, con KPI diversi: in questa fase i verticali non si aggregano tra loro.

---

## 1. La metrica principale

La regola del sistema: **l'impatto si calcola in un posto, le superfici diverse lo leggono e basta.** Quel posto sono le view SQL canoniche descritte alla sezione 4.4. Nessuna pagina ricalcola ore, partecipanti o KPI in JavaScript. Se domani si aggiunge una dimensione, si modifica una view e tutte le superfici si aggiornano.

**L'ora di volontariato è l'unità di misura a fondamento di tutto.** È la valuta del volontariato, è ciò che l'azienda acquista, è la grandezza che la rendicontazione di sostenibilità chiede. Ogni aggregazione e ogni confronto nel sistema ha le ore come base.

Il principio che regge tutto: si registra **solo ciò che viene effettivamente raggiunto**. L'impatto non è una stima derivata da un'ontologia, è la somma di cose concrete e certe accadute in una data precisa. L'esperienza è l'unità che certifica l'azione; tutto il quantitativo si registra sulla singola data dell'esperienza.

---

## 2. Lo stato attuale

A livello DB l'impatto è tre numeri e un array: `experience_dates.volunteer_hours` (decimal), `experience_dates.beneficiaries_count` (integer senza unità di misura), `experiences.sdgs` (array di codici tipo `sdg_4`), più `experience_reviews` per la soddisfazione. Non esiste alcuna view SQL di aggregazione.

A livello frontend l'impatto vive in quattro posti che ricalcolano tutto lato client: `Impact.tsx` (dipendente), `HRDashboard.tsx` con `MetricsCards.tsx` (HR), `SuperAdminDashboard.tsx` (super-admin), `HREmployeesPage.tsx` (stats per-dipendente), più la pagina `/hr/report`.

Tre difetti strutturali, che sono il motivo del rifacimento:

1. **"Completata" definita in quattro modi.** Conseguenza diretta dell'assenza di una fonte unica. Lo risolve la view canonica.
2. **Doppio conteggio SDG.** Aggregando "ore per SDG", un'esperienza taggata con tre SDG triplica artificialmente le ore. Lo risolve la scelta di non aggregare nulla di quantitativo sugli SDG (sezione 3).
3. **`beneficiaries_count` muto.** Un numero senza unità: "105 beneficiari" non dice se sono pasti, bambini o stanze. Lo risolve il modello dei KPI specifici nominati (sezione 4.2).

Inoltre il super-admin non ha KPI sistemici (solo conteggi operativi) e l'ETS non ha alcuna vista di impatto.

---

## 3. Le decisioni

**Rendicontazione per verticale.** Si costruisce il sistema del volontariato. TB e formazione avranno il proprio. Non si aggrega cross-verticale: i KPI sono troppo diversi perché la somma abbia senso.

**Le categorie restano informative.** Le categorie di esperienze del volontariato sono una tassonomia di navigazione del catalogo. Non hanno alcun ruolo nell'impatto e non sono legate agli SDG.

**Gli SDG sono qualitativi.** Ogni esperienza si associa a uno o più SDG. Servono a inquadrare il tipo di esperienza — l'area su cui agisce — e nient'altro. Non si rendiconta nulla di quantitativo sugli SDG: non esistono "ore per SDG" né "beneficiari per SDG". Il quantitativo vive interamente sulle altre metriche. Questo elimina il doppio conteggio alla radice: non si aggrega su un asse, quindi l'asse non può falsare i numeri.

**L'esperienza configura, la data produce il valore.** L'esperienza è l'unità che definisce cosa si misura — ore di volontariato, partecipanti dell'azienda, KPI specifici. La data è l'unità che produce il valore reale: ogni data completata contribuisce ad alimentare quelle metriche, e l'impatto di un'esperienza è la somma di ciò che le sue date completate hanno prodotto. Vale lo stesso pattern per tutte le metriche, non solo per i KPI. Si registra solo ciò che è effettivamente accaduto su una data conclusa.

**KPI specifici — definizione sull'esperienza, valore sulla data.** Ogni esperienza definisce 1-3 KPI specifici (l'etichetta di cosa misura: "pasti distribuiti", "bambini seguiti", "stanze ripulite"). Ogni data dell'esperienza registra il valore raggiunto per ciascun KPI. La definizione è stabile, il valore varia di data in data. I KPI sono leggibili per esperienza, sommabili tra date della stessa esperienza, ma mai sommati tra esperienze diverse.

**Il `beneficiaries_count` generico viene assorbito.** Non esiste più una metrica generica "beneficiari". I beneficiari sono uno dei KPI specifici nominati come gli altri. La colonna `experience_dates.beneficiaries_count` resta in vita come legacy finché le superfici non leggono dai KPI, poi si valuta il drop.

**I partecipanti si derivano dai booking.** Il numero di partecipanti dell'azienda a una data è il conteggio dei booking completati su quella data. Non è un dato inserito a mano. Il tracciamento della presenza reale distinta dalla prenotazione (no-show) è una feature a parte, fuori scope.

**Il valore trasferito al terzo settore resta esterno.** Il KPI sistemico "valore trasferito al terzo settore" non ha oggi una fonte dati in piattaforma: il pacchetto ore commerciale è gestito fuori piattaforma. Resta un dato derivato da CRM/Excel; non si modella la rappresentazione economica del programma in questa fase.

---

## 4. Il modello dati

### 4.1 Gli SDG

Restano dove sono: `experiences.sdgs` (array di codici). Non si introduce alcuna colonna `theme`, alcuna tabella di temi, alcun mapping. L'SDG è il tag qualitativo che inquadra l'esperienza, impostato in fase editoriale dal super-admin con l'ETS.

Le superfici mostrano sempre l'SDG con etichetta in italiano e icona — mai il codice grezzo `sdg_4`. Le etichette vivono già in `sdg-data.ts`.

### 4.2 I KPI specifici

Due tabelle.

**`experience_impact_kpis`** — la definizione, una riga per KPI. Campi: `id`, `experience_id` (FK), `label` (es. "Pasti distribuiti"), `sort_order`. Da 1 a 3 righe per esperienza. È una scelta editoriale stabile, fatta in fase di publishing.

**`experience_date_kpi_values`** — il valore raggiunto, una riga per (data, KPI). Campi: `id`, `experience_date_id` (FK), `kpi_id` (FK a `experience_impact_kpis`), `value` (numerico). Si compila dopo che la data è avvenuta.

La presentazione unisce valore ed etichetta: `value` + `label` → "240 pasti distribuiti". L'aggregazione è pulita per costruzione: si somma `value` tra le date della stessa esperienza (stesso `kpi_id`), non tra esperienze diverse (etichette diverse, somma priva di significato).

### 4.3 La definizione di "partecipazione completata"

Una partecipazione conta come completata quando il booking è in stato `completed`.

Questo richiede che la funzione `process_completed_events` (che transiziona `confirmed → completed`) venga corretta e schedulata: oggi esiste ma non gira. È un prerequisito del sistema impatto, non un lavoro parallelo. Una volta schedulata, la vecchia condizione di ripiego "`confirmed` con data nel passato" diventa inutile e va eliminata da ogni superficie.

### 4.4 Le view SQL canoniche

Le view sono nominate con il prefisso del verticale, perché TB e formazione avranno le proprie e i nomi non devono entrare in collisione. Tutte filtrano sulle partecipazioni completate secondo 4.3.

**`v_volunteering_employee_impact`** — chiave `user_id`. Espone: ore totali donate, numero di esperienze completate, KPI specifici raggiunti per esperienza, SDG toccati (elenco qualitativo), data dell'ultima partecipazione. Alimenta la pagina Impatto del dipendente.

**`v_volunteering_company_impact`** — chiave `company_id`. Espone: persone uniche coinvolte, percentuale sul totale dipendenti, ore totali, ore medie per partecipante, partecipazioni totali, ETS coinvolti, città coperte, KPI specifici raggiunti per esperienza, SDG toccati (elenco qualitativo), rating medio, percentuale di `would_recommend`. Alimenta dashboard e report HR.

**`v_volunteering_platform_impact`** — vista globale e per singola company. Espone i KPI sistemici: nuove collaborazioni attivate (coppie azienda×ETS che collaborano per la prima volta), ETS qualificati attivi, ore totali erogate, partecipazioni. Il valore economico trasferito non è in questa view: resta dato derivato esterno. Alimenta il pannello super-admin.

Il dettaglio dei KPI specifici, essendo una struttura per-esperienza e non un numero piatto per azienda, può vivere in una view dedicata (`v_volunteering_company_kpi_breakdown`) o essere una seconda query dell'hook — scelta di implementazione, non di design.

Le view sostituiscono le query N+1 oggi presenti in `HRDashboard` e `SuperAdminDashboard`. Gli hook frontend (`useEmployeeImpact`, `useCompanyImpact`, `usePlatformImpact`) in pattern TanStack Query leggono dalle view e nient'altro.

---

## 5. Le quattro letture

Lo stesso dato, letto da quattro prospettive. Cambia il taglio e il tono, non la fonte.

### 5.1 Livello 1 — Il dipendente

Pagina `/app/impact`. La domanda è "cosa ho fatto io". Non un cruscotto: un racconto. Ore donate, esperienze completate, KPI concreti a cui ha contribuito espressi nella loro forma reale ("hai contribuito a distribuire 240 pasti"), SDG toccati dalle sue esperienze mostrati come aree in italiano con icona. Tono narrativo e motivante.

`Impact.tsx` oggi mostra una grid "Contributi SDG" con ore per SDG: la parte quantitativa va rimossa, l'SDG resta solo come inquadramento qualitativo. Legge da `v_volunteering_employee_impact`.

### 5.2 Livello 2 — L'azienda (HR)

La domanda è "cosa abbiamo fatto come azienda". Quattro famiglie di indicatori:

- **Coinvolgimento** — persone uniche coinvolte, percentuale sul totale dipendenti, ore totali, ore medie per partecipante, partecipazioni totali.
- **Impatto sul territorio** — ETS coinvolti, città coperte, e i KPI specifici raggiunti, elencati per esperienza ("Esperienza X: 240 pasti distribuiti").
- **Aree di intervento** — gli SDG toccati dalle esperienze del programma, mostrati come badge qualitativi. Dicono "queste attività agiscono su questi SDG", senza alcun numero accanto: il quantitativo vive nelle altre tre famiglie.
- **Soddisfazione** — rating medio, percentuale di `would_recommend`, citazioni positive dai feedback testuali.

Si articola nella pagina **Report** come pagina dedicata, esportabile in PDF — il deliverable che l'HR porta al board. Legge da `v_volunteering_company_impact`.

### 5.3 Livello 3 — Bravo! (super-admin)

La domanda è "cosa stiamo cambiando nell'ecosistema". I tre KPI guida del BP: nuove collaborazioni attivate, ETS qualificati attivi, ore erogate sul territorio. Disponibili in vista globale e per singola company. Il valore economico trasferito si affianca come dato inserito a mano o importato, non calcolato dalla piattaforma.

`SuperAdminDashboard` oggi mostra conteggi operativi: va riorientato sui KPI sistemici. Legge da `v_volunteering_platform_impact`.

### 5.4 Livello 4 — L'ETS (associazione)

La domanda è "che impatto ho generato come ente". Ore di volontariato ospitate, persone coinvolte, aziende con cui ha collaborato, KPI specifici raggiunti, SDG presidiati, rating e feedback ricevuti. È materiale che l'ETS può usare nel proprio bilancio sociale — un motivo concreto per restare nella rete.

L'ETS vede **solo i propri dati**, secondo le RLS già in vigore: non vede margini Bravo!, non vede cosa pagano le aziende, non vede dati di altri enti. La vista si appoggia a una `v_volunteering_association_impact` analoga alle altre, filtrata per `association_id`.

---

## 6. Cosa cambia nel publishing flow

Il tagging dell'impatto si divide in due momenti.

**In fase di pubblicazione**, una volta per esperienza, il super-admin con l'ETS: sceglie uno o più **SDG**; definisce **1-3 KPI specifici** (le etichette di cosa quell'esperienza misura). Nella scheda esperienza del super-admin, la sezione SDG resta ma diventa puramente qualitativa, e si aggiunge la sezione per definire i KPI.

**Dopo ogni data**, si registrano i risultati raggiunti: le ore di volontariato (già oggi su `experience_dates`) e il **valore di ciascun KPI** per quella data. I partecipanti non si inseriscono: si derivano dai booking completati.

---

## 7. Sequenza di implementazione

2. **Modello dati.** Tabelle `experience_impact_kpis` e `experience_date_kpi_values`. La colonna `sdgs` resta invariata. `beneficiaries_count` resta come legacy.
3. **View SQL canoniche.** `v_volunteering_employee_impact`, `v_volunteering_company_impact`, `v_volunteering_platform_impact`. Più avanti `v_volunteering_association_impact`.
4. **Hook frontend.** `useEmployeeImpact`, `useCompanyImpact` in pattern TanStack Query.
5. **Publishing flow.** Sezione SDG qualitativa + definizione KPI nella scheda esperienza super-admin; inserimento valori KPI per data.
6. **Superficie dipendente.** Ridisegno `Impact.tsx`. _(Per HAVAS.)_
7. **Superficie HR.** Dashboard a quattro famiglie + Report PDF. _(Dashboard per HAVAS.)_
8. **Superficie super-admin.** KPI sistemici. _(Dopo HAVAS.)_
9. **Superficie ETS.** `v_volunteering_association_impact` + vista associazione. _(Dopo HAVAS.)_

I passi 1-5 sono il fondamento; i passi 6-9 sono le superfici sequenziate.

---

## 8. Rimane pending

- **Questionari pre/post sul purpose, soft skills, appartenenza.** Rimandati dopo HAVAS, fino a uno strumento psicometrico validato e un secondo cliente che lo richieda.
- **Rappresentazione economica del programma in-app.** Il pacchetto ore commerciale e il valore trasferito al terzo settore restano fuori piattaforma, tracciati in CRM/Excel. Da riaffrontare quando ci sarà una ragione forte per modellarli.
- **Drop della colonna `experience_dates.beneficiaries_count`.** Solo dopo che tutte le superfici leggono dai KPI specifici, con migration dedicata.
- **Tracciamento della presenza reale (no-show).** Oggi i partecipanti coincidono con i booking completati. Distinguere chi ha prenotato da chi si è presentato è una feature a sé.
- **Aggregazione cross-verticale.** Quando TB e formazione avranno il proprio sistema di impatto, si valuterà se e come dare una lettura aggregata. In questa fase non si fa.
