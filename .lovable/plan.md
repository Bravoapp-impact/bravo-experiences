# Creare `docs/log.md`

Documento append-on-top che raccoglie ogni sessione di lavoro non banale, con schema fisso per garantire consistenza nel tempo.

## Struttura del file

1. **Header** — scopo del documento, regole d'uso (quando si scrive una entry, cosa entra/cosa no, ordine cronologico inverso, riferimento a `principi.md` e `architettura.md`).
2. **Template entry** — blocco copia-incolla con i campi vuoti, sempre in cima alle istruzioni.
3. **Entries** — la più recente in alto. Separatore `---` tra entry.

## Schema di ogni entry (per sessione di lavoro)

Campi fissi, sempre nell'ordine:

- **Data** — `YYYY-MM-DD`
- **Titolo** — una riga, descrittivo (es. "TB: short_description su format card")
- **Contesto / perché** — 1-3 righe sul bisogno o problema che ha generato la modifica
- **Cosa cambia** — bullet list delle modifiche concrete
- **Impatto** — tag tra: `DB schema`, `RLS`, `RPC`, `Edge function`, `UI`, `Email`, `Auth`, `Docs`. Più tag se rilevanti
- **File / aree toccate** — elenco sintetico (path o area logica)
- **Follow-up** — cose lasciate aperte o da rifinire (vuoto se nessuno)

## Scope

Entrano nel log: modifiche a schema DB, RLS, RPC, edge function, nuove feature UI rilevanti, copy importanti, modifiche al design system, refactor non banali, fix di sicurezza.
Non entrano: typo, rename file, fix UI minori senza impatto funzionale.

## Scope di questa task

- Creare il solo file `docs/log.md` con header, regole, template e una prima entry seed che documenta la creazione del log stesso (così il template è già dimostrato in pratica).
- Non modificare altri file. Le entry storiche delle sessioni passate non vengono ricostruite retroattivamente: il log parte da oggi.
