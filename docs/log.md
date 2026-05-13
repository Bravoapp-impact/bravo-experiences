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



**Contesto.** Mancava un punto unico dove tracciare le modifiche al sistema sessione per sessione. `architettura.md` descrive lo stato attuale, `principi.md` descrive il perché — ma il "cosa è cambiato e quando" era disperso tra commit e memoria.

**Cosa cambia.**
- Creato `docs/log.md` con header, regole d'uso, template e questa prima entry seed.
- Definito lo schema fisso di ogni entry (Contesto, Cosa cambia, Impatto, File toccati, Follow-up) e l'ordine cronologico inverso.

**Impatto.** `Docs`

**File / aree toccate.**
- `docs/log.md`

**Follow-up.** A regime, ogni sessione che tocca DB / RLS / RPC / edge function deve aggiornare anche `architettura.md` oltre al log.
