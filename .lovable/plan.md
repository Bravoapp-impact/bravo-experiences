## Rimozione testo "Annulla scelta" e semplificazione toggle bottoni

File: `src/pages/hr/HRTBProposalDetailPage.tsx`

### Problema
Il bottone "Non mi interessa" attualmente cambia testo in "Annulla scelta" quando `isDeclined`, creando confusione. L'utente vuole un comportamento più semplice: entrambi i bottoni rimangono sempre con il loro testo originale.

### Modifiche

**1. Rimuovere logica condizionale sul testo del bottone "Non mi interessa"**
- Sidebar: il testo torna sempre `<X className="h-4 w-4" /> Non mi interessa` (riga 186-191 attuale con il ternario)
- Mobile drawer: stesso trattamento (riga 213-218)
- Rimuovere il ternario `isDeclined ? "Annulla scelta" : <><X …/> Non mi interessa</>`

**2. Confermare logica toggle esistente**
- `onInterested()` e `onDeclined()` già fanno toggle su `pending` se ricliccati:
  - `isInterested ? "pending" : "interested"`
  - `isDeclined ? "pending" : "declined"`
- Se sei `interested` e clicchi "Non mi interessa" → diventa `declined` (la chiamata a `onDeclined()` è indipendente, fa il suo toggle)
- Se sei `declined` e clicchi "Non mi interessa" → torna `pending`
- Se sei `interested` e riclicchi "Mi interessa" → torna `pending`

**3. Nessuna modifica al colore/disabilitazione**
- La colorazione verde/rosso e il lock dopo `quote_requested` restano invariate.

### Cosa NON cambia
- `interestedBtnClass` / `declinedBtnClass` helper
- `actionsDisabled` e `isLocked`
- `updateStatus` mutation
- Routing back e headerExtras badge

### Verifica
- Stato iniziale: entrambi i bottoni outline neutri
- Click "Mi interessa" → diventa verde pieno
- Click di nuovo "Mi interessa" → torna outline neutro
- Click "Non mi interessa" da stato verde → diventa rosso pieno (la scelta passa da interested a declined)
- Click di nuovo "Non mi interessa" → torna outline neutro