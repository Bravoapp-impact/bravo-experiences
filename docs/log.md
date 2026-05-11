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

### 2026-05-11 — Introdotto `docs/log.md`

**Contesto.** Mancava un punto unico dove tracciare le modifiche al sistema sessione per sessione. `architettura.md` descrive lo stato attuale, `principi.md` descrive il perché — ma il "cosa è cambiato e quando" era disperso tra commit e memoria.

**Cosa cambia.**
- Creato `docs/log.md` con header, regole d'uso, template e questa prima entry seed.
- Definito lo schema fisso di ogni entry (Contesto, Cosa cambia, Impatto, File toccati, Follow-up) e l'ordine cronologico inverso.

**Impatto.** `Docs`

**File / aree toccate.**
- `docs/log.md`

**Follow-up.** A regime, ogni sessione che tocca DB / RLS / RPC / edge function deve aggiornare anche `architettura.md` oltre al log.
