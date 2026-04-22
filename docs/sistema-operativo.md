# Sistema Operativo Bravo! — Principi e architettura del prodotto

*Documento di riferimento — Aprile 2026*

---

## Premessa

Questo documento fissa la cornice entro cui ogni decisione di prodotto si prende. Non è un trattato di architettura né un documento commerciale: è la bussola che tiene insieme verticali, flussi, attori e scelte tecniche. Quando un nuovo pezzo di prodotto va progettato — un verticale nuovo, un flusso nuovo, una feature nuova — questo doc dice *dove* si colloca nel sistema e *quali principi* deve rispettare per non rompere la coerenza. Tutto il resto (`tb-flow.md`, `volunteering.md`, roadmap, specifiche) si aggancia qui.

---

## 1. La filosofia del sistema

### 1.1 Cos'è Bravo!

Bravo! è il **sistema operativo che un'azienda usa per organizzare l'engagement delle proprie persone attraverso esperienze di impatto sociale costruite con il terzo settore**. Non è un software generico di CSR, non è un'agenzia di eventi, non è un database di ONG. È l'infrastruttura dove quattro attori si incontrano e lavorano su un obiettivo condiviso: coinvolgere le persone e il territorio in attività che generano valore reciproco.

L'asset principale non è il codice. Sono tre cose combinate: una rete verificata di ETS (difficile da costruire, difficile da replicare), il know-how operativo nel disegnare programmi di engagement sociale, e le relazioni con gli HR/People delle aziende italiane. Il software è lo strumento che abilita e scala questi tre asset.

### 1.2 I quattro attori

Il sistema esiste perché mette in relazione quattro attori, ciascuno con la propria ragione di essere sulla piattaforma.

**L'Azienda**, attraverso il referente HR o People, arriva con un bisogno concreto: organizzare un'attività di impatto sociale per i propri colleghi. Ha poco tempo, pochi contatti nel terzo settore, e spesso nessun mandato formale — solo una sensibilità personale e la percezione che "si deve fare qualcosa". Ha bisogno di un sistema che riduca il suo carico operativo e le dia accesso a partner di cui fidarsi. Sul prodotto, l'HR è l'orchestratore del lato domanda: compila brief, sceglie proposte, firma preventivi, monitora il programma.

**Il Dipendente** è il destinatario finale dell'engagement e il cittadino di prima classe del prodotto mobile. Non paga, non sceglie il servizio, non firma contratti — ma è il motivo per cui tutto esiste. Se non vive un'esperienza positiva, l'azienda non rinnova. Il prodotto mobile è pensato per lui: semplice, veloce, leggibile sullo smartphone durante una pausa caffè. Non è un "utente secondario" in ottica di sviluppo: è l'utente più numeroso del sistema, quello che genera i dati di engagement, quello che può evolvere in cittadino attivo della piattaforma. La visione a lungo termine prevede che in futuro anche il singolo cittadino (non tramite azienda) possa partecipare ad attività — la naturale evoluzione B2C, che non viene comunicata esternamente oggi ma che informa le scelte architetturali da subito.

**L'ETS** (Ente del Terzo Settore) è il fornitore operativo delle esperienze. Ospita i volontari, progetta i team building, eroga le formazioni. Sulla piattaforma trova aziende che non avrebbe mai raggiunto da solo, strumenti per gestire le relazioni in modo strutturato, e — per i servizi a pagamento — una monetizzazione stabile. Il modello di Bravo! diverge radicalmente dai competitor internazionali proprio qui: **l'ETS non è un conto corrente con un nome, è un attore economico autonomo nel marketplace**.

**Il Super Admin** (Bravo! stesso) è l'orchestratore del sistema. Non è un ruolo residuale, è un attore strategico: seleziona gli ETS, valida le esperienze, media tra domanda e offerta, costruisce i preventivi, garantisce la qualità. La piattaforma riflette il suo lavoro, non lo sostituisce. Nel tempo l'automazione assorbirà alcune sue funzioni operative (matching, email, notifiche), ma la responsabilità di qualità resta sua.

### 1.3 Il posizionamento

Il posizionamento esterno, nella forma Dunford che Bravo! ha adottato, è:

> *Per le aziende con 50+ dipendenti che vogliono ingaggiare le proprie persone generando un impatto positivo sul territorio, Bravo! è la soluzione che permette di ideare, strutturare e gestire facilmente attività di social engagement. A differenza di organizzare queste attività in autonomia o con partner sempre diversi, Bravo! unisce una tecnologia intuitiva, un team di esperti e un network di enti no-profit locali verificati, per garantire iniziative ad alto impatto e misurabili.*

Tre elementi di questo posizionamento devono guidare ogni scelta di prodotto.

*Coinvolgere le persone e il territorio* è il **perché** — la motivazione del buyer, non un benefit laterale. Ogni flusso deve facilitare questo incontro, non altre logiche (compliance, reporting, CSR per la CSR).

*Ideare, strutturare, gestire* è il **cosa** — i tre momenti in cui la piattaforma entra nel lavoro dell'azienda. Non "trovare" (che è quello che fa Google), non "donare" (che è il modello americano). Ideare, strutturare, gestire.

*Tecnologia + team + network* è il **come** — nessuno dei tre da solo basta. Una piattaforma senza rete fallisce (Benevity in Italia). Una rete senza piattaforma non scala. Un team senza entrambi è un'agenzia. Bravo! è il sistema che tiene insieme i tre.

### 1.4 La bussola

La logica di valore per il buyer si riassume in sei passaggi, che corrispondono a sei momenti del prodotto: **accesso** (il buyer entra facilmente), **obiettivi** (definisce cosa vuole ottenere), **proposte** (riceve opzioni tarate sui suoi bisogni), **strumenti** (gestisce in modo strutturato), **lancio** (esegue l'attività), **miglioramento** (rendiconta, capitalizza, torna al prossimo ciclo).

I problemi che Bravo! risolve, in ordine di priorità percepita dal buyer: organizzazione e gestione delle attività (il dolore primario, quello che fa scattare la ricerca di una soluzione), ricerca e verifica dei partner del territorio (il dolore di fiducia), dati-report-contenuti (il dolore della non-dimostrazione). I tre problemi non sono indipendenti: risolvere il primo senza il secondo fa risparmiare tempo ma non abilita nuove attività; risolvere i primi due senza il terzo rende difficile difendere l'investimento dentro l'azienda.

I benefici attesi corrispondono ordinatamente ai tre problemi: efficienza operativa, accesso a partner verificati, dimostrazione dei risultati. I risultati finali: benessere sul luogo di lavoro, supporto al territorio, migliore immagine e reputazione, riduzione del rischio percepito, misurazione dell'impatto.

---

## 2. Gli oggetti dominio condivisi

Sotto i verticali ci sono oggetti che il sistema possiede **una sola volta** e che tutti i verticali riutilizzano. Questo capitolo li elenca e fissa le regole di base.

**Company.** Un'azienda cliente. Ha un nome, un logo, uno o più codici di accesso, una dimensione, un anno fiscale. Le company sono il punto di raccolta di tutti gli utenti HR e dipendenti di quella azienda. Un profilo può appartenere a una sola company attiva alla volta.

**Profile.** Un essere umano sulla piattaforma, collegato a un account auth. Ha un ruolo attivo (`employee`, `hr_admin`, `association_admin`, `super_admin`) e, in base al ruolo, un'appartenenza a una `company` o a un'`association`. Un profilo non può essere contemporaneamente hr_admin di un'azienda e association_admin di un ETS: sono identità separate. Il ruolo `super_admin` non è legato a una company o association.

**Association.** Un ETS. Ha nome, descrizione, logo, contatti, città in cui opera (tabella ponte `association_cities` perché un ETS può operare in più città), stato di validazione. Gli association admin appartengono a un'association. Un'association può partecipare a più verticali: propone esperienze di volontariato, eroga team building, fa formazione.

**City.** Una città. Oggetto di riferimento per città di azienda, città di ETS, città di esperienze. Non semplice testo libero: tabella con ID, per permettere filtri puliti e gating territoriale.

**Category.** Una categoria di attività (gastronomia, arte, ambiente, animali, inclusione, eccetera). Ha mappature SDG di default. Serve a classificare le esperienze e a guidare il matching. Le categorie sono trasversali ai verticali: la stessa "Arte e creatività" può ospitare esperienze di volontariato ed esperienze di team building.

**SDG.** I 17 Sustainable Development Goals delle Nazioni Unite. Oggi etichette descrittive, in futuro dimensione di aggregazione dell'impatto. Ogni esperienza può essere mappata a uno o più SDG.

**Principio da rispettare.** Quando un verticale nuovo introduce un oggetto nuovo (es. `tb_format`), quell'oggetto **deve** usare i riferimenti standard: `association_id` verso `associations`, `city_id` verso `cities`, `category_id` verso `categories`. Non ricreiamo tabelle parallele di associazioni o città per il team building. Il sistema è uno solo.

---

## 3. Il concetto di verticale

Un **verticale** è una linea di servizio con una sua logica di consumo, un suo flusso, un suo schema dati, ma che si poggia sugli oggetti dominio condivisi del capitolo 2 e sulle infrastrutture trasversali del capitolo 4.

### 3.1 I verticali oggi

**Volontariato.** Il verticale più avanzato in termini di codice. Logica: catalogo aperto, prenotazione in autonomia dei dipendenti, tracking ore, post-evento con check-in e feedback. Programma continuativo a budget ore. In costruzione, prima apertura operativa con HAVAS a giugno 2026.

**Team Building.** In costruzione. Logica: richiesta su commissione, matching da catalogo di format, preventivo in-app, accettazione, esecuzione evento una tantum. Costruzione imminente per mostrarlo a potenziali clienti.

**Formazione, Consulenza, Gadget solidali.** In backlog. Arriveranno dopo che volontariato e TB sono stabili.

### 3.2 Cosa definisce un verticale

Quando si aggiunge un verticale, il suo documento dedicato (`<verticale>-flow.md`) deve rispondere a sei domande:

*Gli oggetti propri.* Ogni verticale ha le sue tabelle (es. `experiences` + `experience_dates` per il volontariato; `tb_formats` + `tb_requests` + `tb_proposals` + `tb_quotes` per il TB). Non si forzano dentro tabelle esistenti per "risparmiare": un verticale pulito ha i suoi oggetti. Il riuso sta negli oggetti dominio condivisi (capitolo 2) e nelle infrastrutture trasversali (capitolo 4), non nello schema specifico del verticale.

*Gli stati e il flusso.* Dalla prima apertura (l'HR apre una pagina) alla chiusura (il servizio è erogato), quali sono gli stati intermedi, chi li fa avanzare, cosa succede in ciascuno.

*Chi vede cosa.* Quali attori sono coinvolti, in quali fasi, con quale visibilità dei dati (vedi capitolo 5).

*La UI dedicata.* Le pagine che i quattro attori vedono per operare su quel verticale, su desktop e su mobile.

*Le email e notifiche.* Quali eventi del verticale generano email transazionali, con quali template, secondo il pattern già consolidato (vedi 4.4).

*Gli eventi analytics.* Quali momenti del flusso vanno loggati in `user_events` per il cruscotto super admin (vedi 4.5).

**Principio.** Quando si aggiunge un verticale si parte dal doc dedicato, che risponde a queste sei domande. Senza il doc, non si inizia a costruire.

---

## 4. Flussi e infrastrutture trasversali

Ci sono pezzi del sistema che ogni verticale usa. Questo capitolo li fissa una volta per tutte, così nessun verticale li reinventa.

### 4.1 Onboarding azienda

Un'azienda entra nel sistema in uno di tre modi: acquista un servizio specifico (TB, pacchetto volontariato, formazione), accede tramite codice fornito da Bravo!, o si registra dal sito in self-serve. In tutti e tre i casi, **l'onboarding produce una `company` con i suoi HR admin e, progressivamente, i suoi dipendenti**. Durante l'onboarding si raccolgono: dimensione aziendale, settore, città principali, contatti dell'HR di riferimento, eventuali verticali attivati.

Lo stato dell'onboarding — e, più in generale, lo **stato di attivazione** di un'azienda — è una dimensione che tutto il sistema deve poter leggere. Serve al super admin per sapere dove un'azienda si è fermata e chiamarla al momento giusto; serve all'HR per capire a che punto è nel proprio percorso; serve in futuro all'AI per suggerire il prossimo passo. È una view SQL derivata dagli eventi (vedi 4.5) e dagli oggetti dei verticali, non un campo manuale.

### 4.2 Il preventivo come oggetto del sistema

Il preventivo è **un oggetto di prodotto, non un allegato**. Per ogni verticale che preveda un'offerta economica (tutti tranne il volontariato base in licenza), il preventivo ha una struttura comune.

*Header.* A chi è destinato, da chi è emesso, quando, con che numero/riferimento.

*Items.* Le voci che compongono il prezzo. Ogni voce può riferirsi a un'esperienza/format, a un'ETS erogante, a una quantità (partecipanti, ore, pezzi), a un prezzo. Le voci possono essere collegate a oggetti del verticale (un format TB, un'esperienza di formazione) oppure libere (logistica, trasporti, "varie ed eventuali").

*Totale.* Calcolato, non digitato. Con eventuali sconti, IVA, eccetera.

*Stato.* `draft` → `sent` → `viewed` → `accepted` / `rejected` / `modification_requested`.

*Firma.* Record di accettazione. In V1 può essere manuale (super admin carica PDF firmato o conferma firma avvenuta fuori app), in V2 è un clic in-app vincolante con log, in V3 può essere DocuSign/firma qualificata.

*Principio di visibilità.* Il cliente non vede il margine Bravo! scomposto, vede i prezzi finali per voce. L'ETS non vede il prezzo finale fatturato al cliente, vede solo quello che incassa. Il super admin vede tutto. Questo si riflette in RLS e in logica di visualizzazione (capitolo 5).

Il PDF del preventivo, dove serve, viene **generato** dall'app a partire dai dati strutturati, non caricato a mano. Questo richiede edge function di generazione PDF; va nel backlog ma non è bloccante per la V1.

### 4.3 Contratto

In V1 il contratto coincide con la firma del preventivo, via PDF scambiato fuori dall'app per la firma legale, registrato dentro l'app come evento. In V2 la firma è in-app con clic vincolante (IP + timestamp + user_id + versione del preventivo firmato loggati). La parte legale della V2 va verificata con l'avvocato di Bravo! prima di rilasciare. Nel frattempo il sistema registra l'accettazione come evento di prodotto: consente all'HR di vedere "preventivo accettato" e al super admin di procedere con l'esecuzione.

### 4.4 Email transazionali

Il pattern è già consolidato: ogni email ha un template in `supabase/functions/_shared/transactional-email-templates/`, una wrapper edge function `send-<nome>`, un log su `email_logs` per idempotenza. Ogni verticale aggiunge le proprie email seguendo questo pattern. Non si usa Resend direttamente, si passa per `send-transactional-email`.

Le email del verticale TB (richiesta quotazione a ETS, preventivo pronto per HR, preventivo accettato, conferma evento) si aggiungono seguendo il pattern, non lo riscrivono.

### 4.5 Analytics di prodotto

Questo è il capitolo che nella roadmap v6 era stato rinviato e che ora promuoviamo a pilastro trasversale. Il principio è semplice: **ogni azione significativa dell'utente genera un evento** in una tabella `user_events`. Non è analytics di marketing, è analytics operative per il super admin — il cruscotto con cui Bravo! si accorge che un cliente si è fermato e lo richiama.

Gli eventi hanno: `user_id`, `company_id`, `event_type` (es. `tb_request_submitted`, `tb_quote_viewed`, `tb_quote_accepted`, `volunteering_experience_viewed`, `login`), `context` JSONB con informazioni specifiche, timestamp.

Sopra questa tabella vivono due viste.

*Cruscotto super admin "stato aziende".* Per ogni azienda cliente, l'ultimo evento significativo, lo stadio del funnel TB/volontariato, i giorni dall'ultima interazione. Permette di vedere "Mario di AziendaX ha aperto il preventivo 4 giorni fa e non ha ancora risposto" e di agire.

*Analytics operative per l'HR.* Quanti dipendenti si sono attivati, quale percentuale ha prenotato almeno un'esperienza, eccetera. Non è marketing, è visibilità sul programma.

In V1 il cruscotto è una pagina super admin che legge direttamente da `user_events`. Se i volumi crescono, si può integrare PostHog o Mixpanel inviando gli stessi eventi in parallelo. La tabella resta la fonte di verità interna.

### 4.6 Matching e futura AI

Il matching — l'accoppiamento tra bisogno espresso e proposta concreta — è un'infrastruttura trasversale ai verticali che lo prevedono (oggi TB; domani formazione e consulenza; mai volontariato, che è pull). Il principio da rispettare: **il flusso utente deve essere identico da giorno 1 al giorno +365**. L'HR vede sempre N proposte, ovunque esse vengano. Quello che cambia è chi le sceglie sotto il cofano: oggi super admin a mano con il supporto di query SQL, domani un sistema di scoring, dopodomani un modello addestrato.

Per rendere questo possibile, ogni scelta di matching (cosa è stato proposto, perché, cosa il cliente ha scelto tra le proposte) viene loggata in una tabella dedicata — per il TB sarà `tb_matching_decisions`. Nel tempo questa tabella diventa dataset di training. Senza questo log, l'automazione futura è impossibile; con questo log, è solo questione di volumi.

---

## 5. Permessi e RLS: i principi

Le Row-Level Security policy su Supabase sono il meccanismo tecnico. Qui fissiamo i **principi** che quelle policy devono implementare, perché un verticale nuovo possa scriverle senza partire da zero.

**Regola 1 — Ogni attore vede il proprio mondo.** L'HR vede solo i dati della propria company. L'ETS admin vede solo i dati della propria association. Il dipendente vede solo i propri dati personali e le esperienze che la sua company ha abilitato. Il super admin vede tutto.

**Regola 2 — Cross-visibilità mediata dal ruolo del super admin.** Quando un oggetto mette in relazione due attori (un preventivo mette in relazione un'azienda, un'ETS, e Bravo!), ogni attore vede la propria porzione. L'HR non vede cosa incassa l'ETS; l'ETS non vede cosa paga l'azienda al netto del margine. Questa regola è applicata a livello di campi, non di righe: la riga è la stessa per tutti, ma le colonne visibili cambiano.

**Regola 3 — Aggiungere prima, rimuovere dopo.** Quando si cambia una policy, si aggiunge la nuova prima di rimuovere la vecchia. Le RLS sono OR-valutate, quindi è sempre sicuro aggiungere una policy nuova che allarga l'accesso. Rimuovere senza aver verificato che la nuova regge è un punto di non ritorno.

**Regola 4 — Gli oggetti dominio condivisi hanno visibilità comune, i verticali hanno visibilità propria.** Una `company` è visibile all'HR di quella company in lettura, al super admin in tutto, al dipendente in parte, all'ETS mai. Ma un `tb_request` è visibile solo agli HR e super admin finché un ETS non viene coinvolto; nel volontariato, un `experience` pubblicato è visibile a più attori. Ogni verticale definisce le proprie regole, ma non contraddice quelle degli oggetti condivisi.

---

## 6. Come evolve il sistema

Lo stato dei verticali oggi, in forma essenziale, per orientarsi quando si rilegge il doc tra qualche mese.

**Volontariato.** In costruzione. Prima apertura operativa con HAVAS a giugno 2026, cui seguiranno altre aziende nei mesi successivi. Le tabelle sono in piedi, i flussi di base esistono, restano da rifinire: galleria foto, comunicazione HR → dipendenti, impostazioni HR, homepage HR come dashboard contestuale. Documento dedicato (`volunteering.md`) sarà scritto a valle della costruzione del TB, per formalizzare lo stato stabile.

**Team Building.** In costruzione. Documento di flusso (`tb-flow.md`) in scrittura. Costruzione imminente perché serve per mostrarlo a potenziali clienti. Obiettivo: digitalizzare il processo oggi gestito via Canva + mail, con preventivo in-app e flusso di matching che prepara il terreno per una futura automazione.

**Formazione.** Backlog. ETS con competenze specifiche (disabilità, violenza di genere, migrazione) possono erogare formazione alle aziende. Il verticale è naturale evoluzione del TB: stessi attori, stessa logica di richiesta → preventivo → erogazione, contenuto diverso. Non si apre finché TB non è stabile.

**Consulenza.** Backlog. Servizi di progettazione di strategia di impatto. Meno transazionale, più relazionale. Forse non diventerà mai un verticale autonomo — potrebbe vivere come servizio legato alla subscription premium.

**Gadget solidali / shop.** Backlog. Catalogo di prodotti realizzati da cooperative sociali o ETS, acquistabili dalle aziende per regalistica aziendale o gift corporate. Logica di e-commerce classica, tecnicamente distante dal resto. Ultimo in ordine.

**Apertura B2C.** Non è un verticale, è un'evoluzione del modello: permettere al singolo cittadino (non tramite azienda) di accedere ad alcune esperienze. Scelta strategica non comunicata esternamente oggi, ma che informa le scelte architetturali (es. un `profile` senza `company_id` deve poter esistere). Temporalmente: dopo che almeno tre verticali sono stabili.

---

## Come si usa questo documento

Quando devi **aggiungere un verticale**: rileggi capitolo 3, scrivi il doc del verticale, torna qui per verificare che i principi siano rispettati.

Quando devi **cambiare un flusso trasversale** (preventivo, email, analytics): aggiorna il capitolo 4 di questo doc prima di toccare il codice, così i verticali che lo ereditano sanno che cosa è cambiato.

Quando devi **aggiungere un attore o cambiare un permesso**: capitolo 5. Mai toccare le RLS senza aver riletto le quattro regole.

Quando devi **spiegare Bravo! a qualcuno dentro l'azienda** (un nuovo assunto, un consulente, un investor per la parte prodotto): capitolo 1. Gli altri capitoli sono interni.

Questo è un documento **vivo**: va aggiornato quando il sistema cambia. Un doc che non si aggiorna diventa falso e smette di essere bussola. Responsabile dell'aggiornamento: Filippo (CGO, product owner di Bravo!).

---

*Versione 1.0 — Aprile 2026*
