## Semplificazione card proposte TB

In `src/pages/hr/HRTBRequestDetailPage.tsx`:

### 1. Rimuovere il blocco azioni doppio Heart/X
Eliminare completamente la funzione locale `renderProposalActions(p)` e il prop `actions={renderProposalActions(p)}` passato a `<BravoCard>`.

### 2. Sostituire con singolo CTA "Scopri di più"
Aggiungere al `BravoCard` un `actions` semplificato: un `Button` full-width, `variant="outline"`, `size="sm"`, `h-7`, `text-xs`, che chiama lo stesso `navigate(...)` già usato in `onOpen`.

```tsx
actions={
  <Button
    size="sm"
    variant="outline"
    className="w-full text-xs h-7 mt-1.5"
    onClick={() =>
      navigate(`/hr/team-building/${id}/proposte/${p.proposal_id}`)
    }
  >
    Scopri di più
  </Button>
}
```

### 3. Cleanup import inutilizzati
Rimuovere da lucide-react gli import `Heart` e `X` (non più usati).
Rimuovere l'import `cn` se non più usato altrove nel file (verifico in implementazione).
Rimuovere import `Tooltip*` (non più usati).
Rimuovere `isReadOnly` se non più riferito dopo il cleanup (ma `READ_ONLY_STATUSES` resta perché potrebbe servire altrove — verifico: oggi è solo passato a `renderProposalActions`; quindi posso rimuovere anche la const e il calcolo).

### Cosa NON cambia
- L'`onOpen` di `BravoCard` resta: tap sull'immagine/titolo continua a navigare al dettaglio.
- `updateProposalStatus` mutation resta nel file solo se ancora referenziata — verifica: dopo la rimozione di `renderProposalActions` non è più usata. La rimuovo per non lasciare codice morto.
- La logica interesse/declinato resta intatta in `HRTBProposalDetailPage.tsx` (già presente, già funzionante).
- `dimmed={p.client_status === "declined"}` resta: utile per vedere a colpo d'occhio nella griglia quali sono state scartate dal dettaglio.
- `interestedCount` e tutta la sezione `TBRequestStatusSection` con CTA "Richiedi preventivo" restano invariati.

### Razionale
- Il bottone "X" non funzionava (probabilmente per stopPropagation del click che si propagava al wrapper button del BravoCard, ma comunque la spec ora è semplificare).
- Un'unica azione per card riduce rumore visivo, coerente con UX del catalogo volontariato HR.
- Il dettaglio proposta è il luogo naturale per la decisione: lì l'HR vede tutte le info e può scegliere consapevolmente.