## Problema

Nel catalogo dipendenti, le esperienze legate ad associazioni recenti non mostrano più nome né logo. Le card che ancora funzionano (es. "La Taska Onlus") mostrano solo il valore del campo legacy `experiences.association_name` (testo), mentre le esperienze più recenti hanno solo `association_id` e quindi nessun nome visualizzato.

### Causa

`useEmployeeCatalog` esegue la join:

```ts
.select(`*, associations:association_id ( name, logo_url )`)
```

Le RLS sulla tabella `associations` però permettono `SELECT` **solo a super_admin** e ad association_admin sulla propria riga. I dipendenti (e gli HR) non hanno alcuna policy → la join restituisce `null` per tutte le associazioni e il codice ricade sul campo legacy `association_name` che, per le esperienze nuove, è vuoto.

In DB esiste già la view `associations_public` (creata appositamente come fix di sicurezza) che espone i dati pubblici delle associazioni in modo sicuro.

## Fix

**File:** `src/hooks/queries/experiences/useEmployeeCatalog.ts`

- Sostituire la join inline `associations:association_id (...)` con una **fetch separata** verso `associations_public`, batchata via `.in("id", associationIds)` sui soli `association_id` presenti tra le esperienze caricate.
- Costruire una `Map<associationId, {name, logo_url}>` e popolare `association_name` / `association_logo_url` da lì, mantenendo come fallback il legacy `exp.association_name` (per coerenza con altre esperienze ancora non migrate).

**Nessuna modifica** a RLS, schema, UI, hook HR, pagina dettaglio. Cambia solo il modo in cui il catalogo dipendente recupera nome+logo dell'associazione.

### Verifica post-fix

- Aprire `/app/experiences` come dipendente: tutte le card devono mostrare nome (e logo se presente) dell'associazione, incluse quelle legate a "Il Balzo ETS".
- Le card che già funzionavano continuano a funzionare (fallback legacy intatto).

### Note

- Non tocco `useRelatedExperiences` né altri consumer in questa task: se anche lì manca il nome associazione, lo sistemiamo separatamente con lo stesso pattern.
- Pattern allineato a `docs/data-fetching.md` (fetch separate + merge client-side, batch con `.in()`).