## Obiettivo

Creare `docs/README.md` come **punto di ingresso unico** della documentazione: chi arriva (umano o AI) sa in 30 secondi cosa leggere, in che ordine, e quale rituale seguire prima e dopo ogni sessione di coding.

Il file non duplica contenuto degli altri doc: rimanda. È un indice + checklist, niente di più.

## Struttura del file

**1. Header breve.** Una frase: "Punto di ingresso della documentazione di Bravo!. Leggi questo prima di toccare codice."

**2. Indice dei documenti.** Tabella con tre colonne — nome doc · cosa contiene · quando consultarlo. Ordine per priorità di lettura per un nuovo arrivato:

- `principi.md` — il *perché* (business model, 4 attori, principi tecnici)
- `architettura.md` — il *cosa* (stack, dati, RLS, RPC, edge function, route)
- `CLAUDE.md` — il *come* (regole di lavoro AI, sicurezza, operativo)
- `aperto.md` — decisioni pending, debito tecnico, roadmap a ondate
- `log.md` — diario sessione per sessione
- `data-fetching.md` — convenzione TanStack Query
- `design-system.md` — token, colori, componenti
- `tb-flow.md` — verticale Team Building
- `transactional-emails.md` — pipeline email

**3. Percorsi di lettura consigliati.** Tre micro-percorsi in base al motivo per cui apri la doc:
- "Sono nuovo" → `principi` → `architettura` → `CLAUDE` → questo README
- "Devo toccare DB / RLS / RPC" → `architettura` §2-4 + `CLAUDE` §2
- "Devo toccare un verticale" → doc tematico (`tb-flow`, `transactional-emails`, `data-fetching`, `design-system`)

**4. Checklist PRE-sessione.** Lista azionabile, derivata da `CLAUDE.md` + buon senso:
1. Brief con cosa cambia / perché / **cosa NON deve cambiare**
2. `git pull origin main`
3. Leggere `aperto.md` (verificare conflitti con debito noto / decisioni aperte)
4. Leggere `architettura.md` §2-4 se tocchi dati / RLS / RPC / edge
5. Leggere il doc tematico pertinente
6. Confermare il pattern esistente (estendere, non duplicare — rif. `principi.md` §4.6)

**5. Checklist POST-sessione.** Lista azionabile:
1. Self-review sicurezza se hai toccato auth / RLS / RPC / edge (rif. `CLAUDE.md` §2)
2. Aggiornare `architettura.md` se hai toccato schema / RLS / RPC / edge
3. Scrivere entry in `log.md` usando il template
4. Aggiornare `aperto.md` (rimuovere chiuso, aggiungere debito nuovo, registrare decisioni aperte)
5. Aggiornare il doc tematico se hai introdotto/modificato un pattern trasversale
6. Commit `[area] descrizione breve`, una modifica = un commit logico
7. `git push origin main`

**6. Regola d'oro finale.** Una riga: "Se la doc non è aggiornata, smette di essere bussola. Aggiornarla è parte del task, non lavoro extra."

## Vincoli

- Italiano, tono diretto come gli altri doc.
- File breve (target ~120-150 righe). Niente prosa lunga: tabelle e bullet.
- Solo riferimenti, mai ripetere contenuto degli altri doc.
- Zero modifiche ad altri file in questa sessione.

## File toccati

- **Nuovo:** `docs/README.md`
- A valle (in una sessione successiva, non ora): aggiungere entry in `docs/log.md` per registrare la creazione del README.
