# Principi

## 1. Cos'è Bravo!

Bravo! è il sistema operativo che un'azienda usa per organizzare l'engagement delle proprie persone attraverso esperienze di impatto sociale costruite con il terzo settore. Non è un software generico di CSR, non è un'agenzia di eventi, non è un database di ONG. È l'infrastruttura dove quattro attori si incontrano e lavorano su un obiettivo condiviso: coinvolgere le persone e il territorio in attività che generano valore reciproco.

## 2. I quattro attori

Il sistema esiste perché mette in relazione quattro attori, ciascuno con la propria ragione di essere sulla piattaforma. Ogni feature deve rispondere alla domanda: "a quale dei quattro serve, e perché?".

**L'Azienda**, attraverso il referente HR o People, arriva con un bisogno concreto: organizzare un'attività di impatto sociale per i propri colleghi. Ha poco tempo, pochi contatti nel terzo settore, spesso nessun mandato formale — solo una sensibilità personale e la percezione che "si deve fare qualcosa". Ha bisogno di un sistema che le riduca il carico operativo e le dia accesso a partner di cui fidarsi.

**Il Dipendente** è il destinatario finale dell'engagement. Non paga, non sceglie il servizio, non firma contratti — ma è il motivo per cui tutto esiste. Se non vive un'esperienza positiva, l'azienda non rinnova. È anche l'utente più numeroso del sistema e quello che genera la maggior parte dei dati di engagement.

**L'ETS** (Ente del Terzo Settore) è il fornitore operativo delle esperienze. Sulla piattaforma trova opportunità che non avrebbe mai raggiunto da solo, strumenti per gestirle in modo strutturato, e — per i servizi a pagamento — una monetizzazione stabile.

**Il Super Admin** (Bravo! stesso) è l'orchestratore del sistema. Seleziona gli ETS, valida le esperienze, media tra domanda e offerta, costruisce i preventivi, garantisce la qualità. Nel tempo l'automazione assorbirà alcune sue funzioni operative, ma la responsabilità di qualità resta sua.

---

## 3. Le logiche del business model

Bravo! ha tre fonti di ricavo che rispondono a logiche diverse.

**Subscription della piattaforma.** È la base ricorrente che tiene insieme la relazione cliente-Bravo! oltre il singolo evento. Si paga per accedere ai tool software e al supporto operativo. Il prezzo segue la dimensione aziendale (numero totale di dipendenti, non utenti attivi) perché le funzionalità interessano tutta la popolazione, non un sottoinsieme.

**Service fee sul volontariato.** Bravo! pacchettizza e vende programmi di volontariato come servizio strutturato. Il prezzo è programmatico (l'azienda compra un volume di ore), il costo unitario decresce al crescere del volume, ed esiste un pavimento sotto cui il prezzo non scende mai — quel pavimento garantisce un margine minimo positivo anche nel caso massimo di contributo riconosciuto all'ETS ospitante.

**Transaction fee sul catalogo ETS.** Sui servizi a catalogo (team building, formazione, eventi solidali) l'ETS fattura a Bravo! al proprio prezzo, e Bravo! fattura all'azienda cliente applicando un sovraprezzo. Bravo! guadagna solo se guadagna l'ETS.

### La distinzione strutturale: volontariato vs catalogo

Il volontariato e il catalogo ETS sono due relazioni economiche fondamentalmente diverse, anche se passano per la stessa piattaforma.

Nel volontariato l'ETS **ospita** i volontari: il valore principale che riceve è la manodopera, la visibilità, la relazione con l'azienda. Non è un canale di revenue. Il prezzo lo fissa Bravo!, l'ETS riceve al più un rimborso dei costi vivi.

Nel catalogo l'ETS **vende** un servizio professionale: il valore principale è per l'azienda. Il prezzo lo fissa l'ETS, Bravo! rivende il servizio specifico al cliente.

Confondere i due ruoli rompe il modello economico. Le architetture di dati, i flussi di approvazione, le RLS e le email seguono questa distinzione e non possono collassare i due casi in un'unica astrazione "generica".

### Le porte di ingresso

Un'azienda può entrare in Bravo! da più direzioni: chiedendo volontariato strutturato, chiedendo un singolo evento (team building, formazione), o cercando una soluzione di employee engagement completa. Ogni porta richiede un'esperienza di primo acquisto che abbassi la soglia di ingresso e crei la condizione per la relazione continuativa.

Conseguenza per il prodotto: ogni verticale deve poter funzionare come prima esperienza del cliente, non come componente accessoria di un altro. Un cliente che entra da una porta deve poter trovare valore senza essere costretto a comprare anche le altre.

## 4. I principi tecnici

Ogni principio tecnico qui sotto nasce da una scelta di prodotto. Sono i vincoli che ogni nuovo verticale, ogni nuova feature, ogni refactor deve rispettare.

### 4.1 Sistema operativo integrato

Bravo! è un sistema operativo che mette in relazione quattro attori. Conseguenza: ogni feature deve servire uno dei quattro attori in modo riconoscibile. Le ottimizzazioni che facilitano la vita al super admin a costo di degradare l'esperienza degli altri attori sono debito, non valore. Quando si progetta, si parte dall'attore che usa la feature, e ci si deve chiedere il perché di un particolare sviluppo.

### 4.2 Visibilità mediata, non semplificata

Quando un oggetto mette in relazione due o più attori (un preventivo, un evento, una transazione), ogni attore vede la propria porzione. L'HR non vede cosa incassa l'ETS, l'ETS non vede cosa paga l'azienda al netto del margine Bravo!, il super admin vede tutto.

Questo si implementa **a livello di colonne, non solo di righe**: la riga è la stessa per tutti, ma i campi visibili cambiano per ruolo. Margini, prezzi ETS e costi interni non possono mai essere accessibili in lettura diretta agli attori che non devono vederli — la separazione passa per `REVOKE` column-level e RPC dedicate, non per controlli applicativi nel frontend.

### 4.3 Il preventivo come oggetto del sistema, non come allegato

Per ogni verticale che preveda un'offerta economica, il preventivo è un oggetto strutturato del prodotto: header, items collegati a oggetti di verticale, totale calcolato, stato esplicito, record di accettazione.

Conseguenza: i preventivi sono interrogabili, aggregabili, comparabili. Le decisioni che gli attori prendono sui preventivi (accettazione, modifica, rifiuto) sono eventi di prodotto.

### 4.4 Stato di attivazione come view derivata, non come campo manuale

Lo stato di un'azienda nel proprio percorso (a che punto è dell'onboarding, dell'attivazione, dell'utilizzo) è una dimensione che il super admin deve poter leggere.

Lo stato è sempre **derivato** da eventi e oggetti dei verticali.

### 4.5 Tracciare oggi per automatizzare domani

Ogni azione significativa dell'utente, ogni decisione di matching, ogni cambio di stato di un oggetto del prodotto produce un evento loggato. È il dataset che permetterà all'automazione e all'AI di subentrare in attività oggi gestite a mano dal super admin.

Senza questo log, l'evoluzione del sistema verso il matching automatico e i suggerimenti contestuali è impossibile. Con questo log, è solo una questione di volumi. Per questo l'event logging è un requisito di tutte le feature nuove, non un nice-to-have.

### 4.6 Pattern condivisi, mai riscritti

Email transazionali, generazione PDF, regole RLS, RPC SECURITY DEFINER, gestione di stato dei preventivi: tutti questi sono pattern già consolidati nel sistema. I verticali nuovi vi si agganciano, non li riscrivono. Quando il pattern non basta, lo si estende; quando si rompe, lo si corregge per tutti — non si crea un secondo pattern parallelo.

Un pattern duplicato è un debito che si paga ogni volta che cambia qualcosa di trasversale (un'integrazione, una policy di sicurezza, un'email).

### 4.7 L'architettura resta aperta al B2C

La visione a lungo termine prevede che anche il singolo cittadino, fuori dall'azienda, possa accedere ad alcune esperienze. Non è una scelta comunicata esternamente oggi, ma vincola le scelte architetturali da subito: un `profile` deve poter esistere senza una `company_id`, le esperienze devono poter essere associate a un utente non aziendale, i flussi di pagamento non devono assumere la presenza di un contratto B2B.

Ogni volta che si modella un oggetto nuovo, va verificato che non chiuda questa porta.