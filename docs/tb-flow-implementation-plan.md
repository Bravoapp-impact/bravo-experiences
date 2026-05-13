# Team Building — Piano di implementazione (reference)

> Piano originario di rollout del nuovo modello TB ("bacheca accumulativa") definito a partire da `docs/tb-flow.md` §11.1.
> Conservato qui come reference. Lo stato di avanzamento aggiornato vive nel banner in cima a `tb-flow.md`.

## Stato corrente

- **Step 1**: ✅ implementato.
- **Step 2**: ⚠️ implementato ma da rivedere (errori emersi sulla lista HR, vedi nota in `tb-flow.md`).
- **Step 3–7** e cantiere parallelo: non avviati.

---

## Contesto

`docs/tb-flow.md` ridefinisce il verticale TB attorno a tre principi: brief modificabile, pratica accumulativa, un solo punto di chiusura (accettazione preventivo). Lo stato granulare a 15 valori su `tb_requests.status` viene sostituito da `tb_requests.state` a 4 valori (`open`/`confirmed`/`completed`/`cancelled`); le quote diventano per-`proposal_id` (oggi sono per-`request_id`); le proposte acquisiscono `is_active`.

Confronto con lo stato attuale (verificato a DB e codice):

- `tb_requests`: ha solo `status` (15 valori). Manca `state`.
- `tb_proposals`: manca `is_active`.
- `tb_quotes`: ha `request_id`, manca `proposal_id` e ha ancora `valid_until`.
- `tb_request_status_log` ancora presente.
- Frontend HR (`HRTeamBuildingPage.tsx`, `HRTBRequestDetailPage.tsx`, `TBRequestStatusSection.tsx`, `tb-status.ts`) è interamente orchestrato sui 15 status.
- Super admin (`TBRequestDetailPage.tsx`) idem.

La doc al §11.1 propone già un ordine di implementazione: lo adottiamo come scaletta. Ogni step è una sessione a sé, da approvare prima di iniziare.

---

## Step 1 — DB additivo minimo per la lista HR

Solo migrazioni additive, nessun drop. Stato vecchio e nuovo coesistono.

- **Migration A**: `ALTER TABLE tb_requests ADD COLUMN state text GENERATED ALWAYS AS (...) STORED` mappata da `status` (`draft`/`submitted`/`in_matching`/`proposals_ready`/`proposals_sent`/`quote_*`/`modification_requested`/`signed`/`event_scheduled` → `open`; `quote_accepted` → `confirmed`; `completed` → `completed`; `cancelled`/`quote_rejected` → `cancelled`).
- **Migration B**: `ALTER TABLE tb_proposals ADD COLUMN is_active boolean NOT NULL DEFAULT true`. Backfill implicito (default).
- **Indici**: `idx_tb_requests_state`, `idx_tb_proposals_is_active`.
- **RLS**: nessuna modifica (`state` è derivato, le policy esistenti continuano a funzionare).
- **Esito**: nessun cambio funzionale, ma la lista HR può già leggere `state` e `is_active`.

---

## Step 2 — Lista HR `/hr/team-building` riprogettata (sez. 5.1)

Solo frontend. Riscrittura di `src/pages/hr/HRTeamBuildingPage.tsx`:

- Tre sezioni: "Eventi in programma" (`state=confirmed`), "Richieste in corso" (`state=open`), "Archivio" (`state in (completed,cancelled)`, collassata).
- Grid responsive di `BravoCard` quadrate (2/3/4/5 colonne) — stesso pattern di `AssociationExperiencesPage.tsx`.
- Pill di stato solo per `state=open`, calcolata client-side dalla gerarchia: preventivo da decidere → N proposte da valutare → preventivo in lavorazione → proposte in arrivo. Per calcolarla servono `tb_proposals(is_active, client_status)` e `tb_quotes(status)` aggregati per request — query batch lato HR, una sola roundtrip.
- Card "Evento in programma" con badge data overlay (pattern `BookingCard`), card "Richiesta in corso" con placeholder colorato + icona Tabler da `preferred_category_id`.
- Rimossi `ActiveCard` e `HistoryCard` interni al file. La logica draft (dialog "Hai una bozza in sospeso") resta: una `tb_request` in `state=open` senza proposte e con titolo vuoto è la "bozza" di oggi.
- Empty state attuale invariato.
- Documento `team-building-nuova-interfaccia.md`: archiviato (rinominato `_archived_*`) se esiste.

---

## Step 3 — DB additivo Fase 1 completa + RPC per-proposal

- **Migration C**: `ALTER TABLE tb_quotes ADD COLUMN proposal_id uuid REFERENCES tb_proposals(id)`. Backfill: per ogni quote esistente, popolare `proposal_id` cercando l'unica proposta `interested` della stessa request (caso oggi reale, le quote sono di fatto già 1:1 con una proposta). Validare che il backfill copra tutto, poi `SET NOT NULL`.
- **Migration D**: nuovi vincoli additivi:
  - Unique partial: una sola quote in (`draft`,`sent`,`viewed`,`modification_requested`) per (`request_id`, `proposal_id`).
  - Trigger di validazione (no `CHECK`) che vieta inserimento di quote senza `proposal_id`.
- **RPC nuove** (tutte `SECURITY DEFINER` con `SET search_path = public, pg_temp`, `REVOKE ... FROM PUBLIC`, `GRANT TO authenticated`, autorizzazione in cima):
  - `hr_request_alternative_for_proposal(proposal_id)` → notifica super admin.
  - `hr_update_brief(request_id, jsonb_diff)` → patch del brief, log diff.
  - `admin_deactivate_proposal(proposal_id)` → set `is_active = false`.
- **Refactor RPC esistenti** (additivo, non rimuoviamo le firme vecchie): `admin_save_tb_quote_draft`, `admin_send_tb_quote`, `hr_decide_on_quote`, `admin_supersede_and_create_new_version` accettano `proposal_id` e lo persistono. Le firme vecchie restano funzionanti finché lo Step 7 non le elimina.

---

## Step 4 — Workspace super admin `/super-admin/team-building/richieste/{id}`

Solo frontend (più eventuali query helper). Refactor di `TBRequestDetailPage.tsx` al modello accumulativo:

- Drop dello status granulare come driver di vista, sostituito da `state` + sezioni per entità.
- Lista proposte con toggle `is_active` operativo, possibilità di aggiungere proposte in qualsiasi momento finché `state=open`.
- Quote per-proposal: una colonna/sezione per ogni proposta `interested`, con history versioni.
- UI volutamente minimale (sez. 6: rifiniremo dopo i learning).

---

## Step 5 — Dettaglio HR `/hr/team-building/:id` (`state = open`)

Riscrittura di `HRTBRequestDetailPage.tsx` + componenti correlati (`TBRequestStatusSection.tsx` deprecato).

- Layout a due colonne (Attio-like).
- Pannello sinistro: brief + "Modifica brief" (dialog/sheet) + "Annulla richiesta".
- Pannello destro a tab: Proposte (filtri, quick actions Mi interessa/Scarta, nudge alternative, sezione scartate collassata) e Quotazioni (una card per proposta `interested`, CTA per stato della quote). Default tab logic come §5.2.
- Tab `state=confirmed` (Evento/Partecipanti/Documenti): solo gli scheletri vuoti, contenuti rinviati alla sessione dedicata di sez. 3.5.
- Mobile fuori scope V1 (§5.3).

---

## Step 6 — Email refactor

- Nuovi hook su eventi atomici (lista §9): creazione request, modifica brief con diff, aggiunta proposta, scarto con richiesta alternativa, richiesta preventivo, invio preventivo, decisione cliente, conferma data, reminder, evento completato.
- Edge function `send-transactional-email` ricomposta sui nuovi trigger (DB triggers o chiamate dirette dalle nuove RPC).
- Vecchi trigger basati su `tb_requests.status` disattivati (non droppati) in coda allo step.

---

## Step 7 — Cleanup DB (solo dopo V1 in produzione e stabile)

- Conversione `tb_requests.state` da `GENERATED` a colonna regolare (`DROP` della `GENERATED` + `ADD COLUMN` + backfill + `NOT NULL`, in due migration: prima la nuova colonna `state_v2`, swap, poi drop della vecchia).
- `DROP COLUMN tb_requests.status`.
- `DROP TABLE tb_request_status_log`.
- `ALTER TABLE tb_quotes DROP COLUMN valid_until`.
- Drop RPC vecchie con chiave (`request_id`) e dei vincoli obsoleti.
- Pulizia `src/lib/tb-status.ts` (rimozione delle 15 union, sostituzione con i 4 state + helper per la pill).

---

## Cantiere parallelo (non blocca)

Sessione dedicata su entità di esecuzione (`tb_events`, `tb_event_participants`, `tb_contracts`, `tb_matching_decisions`) e sulle tab `state=confirmed`/`completed`. Da pianificare separatamente, può iniziare in parallelo allo Step 4.

---

## Regole trasversali (CLAUDE.md)

- Mai DROP+CREATE nello stesso step. Tutti gli step 1–6 sono additivi; lo step 7 è l'unico distruttivo, e arriva solo dopo conferma di stabilità.
- Tutte le RPC `SECURITY DEFINER` hanno `SET search_path = public, pg_temp`, `REVOKE ... FROM PUBLIC`, `GRANT TO authenticated`, e check di autorizzazione + ownership in cima al corpo.
- `REVOKE` column-level su margini ETS resta in vigore.

---

## Ordine consigliato di approvazione

Procediamo uno step alla volta. Approvando questo piano si conferma solo la rotta complessiva: ogni step viene aperto con un brief proprio (cosa cambia / perché / cosa NON cambia) prima di scrivere codice. Il primo da implementare è lo Step 1, perché abilita lo Step 2 senza toccare nulla del comportamento esistente.
