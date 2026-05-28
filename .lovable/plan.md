## Obiettivo

Nella pagina HR → Impostazioni → Membri e accessi, rimuovere il bottone "Invita dipendente" e mostrare invece un campo con il link alla pagina di registrazione, copiabile con un click — stesso pattern usato in "ETS suggeriti".

## Modifiche

**File:** `src/pages/hr/settings/SettingsMembers.tsx`

1. Rimuovere il bottone "Invita dipendente" (riga 106) e il wrapper `flex` che lo conteneva.
2. Aggiungere una nuova `SettingsSection` (o un blocco prima della sezione "Dipendenti registrati") intitolata es. "Link di registrazione" con descrizione tipo: "Condividi questo link con i tuoi colleghi per invitarli a registrarsi su Bravo!".
3. All'interno: un `Input` readOnly che mostra l'URL di registrazione + un `Button` "Copia link" con icona `Copy` (lucide-react) che usa `navigator.clipboard.writeText` e mostra un toast (`sonner`) di conferma — stesso pattern del file `src/pages/hr/HRSuggestionsPage.tsx`.
4. URL: `${window.location.origin}/register` (la pagina esiste già — `src/pages/Register.tsx`). Calcolato in `useMemo`.
5. Layout responsive identico a HRSuggestionsPage: `flex flex-col sm:flex-row gap-2`, Input `flex-1` con `font-mono text-xs`, `onFocus` che seleziona tutto.

## Note

- Nessuna modifica al DB o alla logica di registrazione: la pagina `/register` è già pubblica e gestisce l'auto-assegnazione all'azienda tramite il dominio email aziendale (già spiegato nella sezione "Dominio aziendale" sopra).
- Nessun token o link personalizzato — è un link statico generico alla registrazione.
