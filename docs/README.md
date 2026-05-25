# Documentazione Bravo!

Punto di ingresso della documentazione di Bravo!. Leggi questo prima di toccare codice.

Lo scopo di questo file è uno solo: dirti **cosa leggere**, **in che ordine**, e **quale rituale seguire** prima e dopo ogni sessione di coding. Non duplica contenuto degli altri doc — rimanda.

---

## Indice dei documenti

| Doc | Cosa contiene | Quando consultarlo |
| --- | --- | --- |
| [`principi.md`](./principi.md) | Il **perché**: business model, 4 attori, principi tecnici non negoziabili | Sempre, all'inizio di qualsiasi nuova feature |
| [`architettura.md`](./architettura.md) | Il **cosa**: stack, modello dati, RLS, RPC, edge function, route per ruolo | Ogni volta che tocchi DB, RLS, RPC, edge function o aggiungi pagine |
| [`CLAUDE.md`](./CLAUDE.md) | Il **come**: regole di lavoro con AI, regole di sicurezza, regole operative | Sempre. È il contratto operativo |
| [`aperto.md`](./aperto.md) | Decisioni pending, debito tecnico noto, roadmap a ondate | Prima di ogni sessione, per evitare conflitti |
| [`log.md`](./log.md) | Diario sessione per sessione, cronologico inverso | Dopo ogni sessione non banale (scrittura) |
| [`data-fetching.md`](./data-fetching.md) | Convenzione TanStack Query, `queryKey`, `useMutation`, invalidation | Quando scrivi un hook nuovo o tocchi un hook esistente |
| [`design-system.md`](./design-system.md) | Token di colore, tipografia, componenti shadcn customizzati | Quando tocchi UI o aggiungi una primitive |
| [`tb-flow.md`](./tb-flow.md) | Verticale Team Building end-to-end | Quando tocchi qualcosa nell'area TB |
| [`impatto.md`](./impatto.md) | Sistema di impatto: modello dati, view canoniche, KPI per i 4 attori | Quando tocchi metriche, dashboard, report o aggregazioni di volontariato |
| [`transactional-emails.md`](./transactional-emails.md) | Pipeline email, wrapper edge function, come aggiungerne una | Quando aggiungi o modifichi un'email |

---

## Percorsi di lettura consigliati

**Sono nuovo (umano o AI).**
`principi.md` → `architettura.md` → `CLAUDE.md` → torna a questo README.

**Devo toccare DB, RLS, RPC o edge function.**
`architettura.md` §2-4 + `CLAUDE.md` §2 (regole di sicurezza). Mai DROP+CREATE nello stesso step.

**Devo lavorare su un verticale.**
Doc tematico pertinente (`tb-flow.md`, `transactional-emails.md`, `data-fetching.md`, `design-system.md`) + `principi.md` §4 per i pattern condivisi.

**Devo decidere se una funzionalità è in scope.**
`aperto.md` §3 (roadmap a ondate) + `principi.md` §2 (a quale dei 4 attori serve?).

---

## Checklist PRE-sessione

1. **Brief con tre cose esplicite.** Cosa cambia · perché cambia · **cosa NON deve cambiare**. Senza la terza, non si parte (rif. [`CLAUDE.md`](./CLAUDE.md) §1).
2. **`git pull origin main`.** Sempre il primo gesto.
3. **Leggi [`aperto.md`](./aperto.md).** Verifica che il task non confligga con un debito noto, non dipenda da una decisione ancora aperta, non sia già in lavorazione.
4. **Se tocchi dati / RLS / RPC / edge function** → leggi [`architettura.md`](./architettura.md) §2-4.
5. **Se ricadi in un'area tematica** → leggi il doc pertinente (TB, email, data fetching, design system).
6. **Conferma il pattern esistente.** Bravo! ha pattern consolidati: si estende un pattern, non se ne crea uno parallelo (rif. [`principi.md`](./principi.md) §4.6).

---

## Checklist POST-sessione

1. **Self-review di sicurezza** se hai toccato auth / RLS / RPC / edge function. Domanda: "un utente autenticato di un'altra company può leggere o modificare dati che non sono suoi?" (rif. [`CLAUDE.md`](./CLAUDE.md) §2).
2. **Aggiorna [`architettura.md`](./architettura.md)** se hai toccato schema DB, RLS, RPC o edge function. Se non lo aggiorni, smette di essere bussola.
3. **Scrivi una entry in [`log.md`](./log.md)** in cima alla sezione Entries, usando il template (Contesto · Cosa cambia · Impatto · File toccati · Follow-up).
4. **Aggiorna [`aperto.md`](./aperto.md).** Rimuovi ciò che hai chiuso, aggiungi il debito nuovo che hai introdotto consapevolmente, registra le decisioni rimaste aperte.
5. **Aggiorna il doc tematico** se hai introdotto o modificato un pattern trasversale (un nuovo tipo di email, una nuova convenzione di hook, un nuovo token di design).
6. **Commit `[area] descrizione breve`.** Una modifica = un commit logico. Non accorpare cambi non correlati (rif. [`CLAUDE.md`](./CLAUDE.md) §3).
7. **`git push origin main`.** Mai chiudere con modifiche locali non pushate.

---

## Regola d'oro

Se la doc non è aggiornata, smette di essere bussola. Aggiornarla è parte del task, non lavoro extra.
