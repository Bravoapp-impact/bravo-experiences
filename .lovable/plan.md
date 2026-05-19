## Rinomina "Suggerimenti" → "ETS Suggeriti"

Aggiornamento del nome user-facing e della route per la sezione HR dei suggerimenti ETS.

### Cambi route e label
- `src/components/layout/HRLayout.tsx` — voce sidebar: label `"Suggerimenti"` → `"ETS Suggeriti"`, href `/hr/suggerimenti` → `/hr/ets-suggeriti`.
- `src/App.tsx` — route `/hr/suggerimenti` → `/hr/ets-suggeriti`.

### Cambi nella pagina
- `src/pages/hr/HRSuggestionsPage.tsx`:
  - `PageHeader` title: `"Suggerimenti"` → `"ETS Suggeriti"`.
  - `PageSection` titolo tabella: `"Suggerimenti ricevuti"` → `"ETS suggeriti"`.

### Docs
- `docs/architettura.md` — riga route HR: aggiornare `/hr/suggerimenti` → `/hr/ets-suggeriti` e descrizione coerente.

### Cosa non cambia
- Nome file `HRSuggestionsPage.tsx`, nome componente `HRSuggestionsPage`, nome tabella DB `association_suggestions`, edge function `submit-association-suggestion`, route pubblica `/suggerisci-ets/:token`, hook in `src/hooks/queries/suggestions/`. Sono tutti identificatori tecnici interni, non user-facing.
- Entry di `docs/log.md` storiche (cronologia, non si riscrive).
- Copy interna alla pagina che parla genericamente di "suggerimenti" / "suggerimento" (parola comune italiana, non il nome della sezione) — resta naturale nel testo descrittivo, ad es. "ricevere suggerimenti di enti non-profit".
