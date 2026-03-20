# Piano: Interfaccia AI conversazionale stile Attio (non funzionale)

Sostituire il placeholder "Coming Soon" con un'interfaccia che sembra un vero assistente AI conversazionale, ispirata allo screenshot di Attio: textarea grande con placeholder "Descrivi il progetto che vuoi proporre alle aziende...", bottone invio, e chip di suggerimenti sotto. Quando l'utente prova a scrivere e inviare, mostra un toast che dice che la funzionalità è in arrivo.

## File: `src/pages/association/AssociationHome.tsx`

**Sostituire il blocco AI Placeholder (righe 169-189) con:**

- Textarea con placeholder "Descrivi il progetto che vuoi proporre alle aziende..." dentro un contenitore con bordo sottile arrotondato (stile Attio: bordo grigio chiaro, focus con bordo primary leggero)
- In basso a destra nella textarea: bottone invio circolare (icona `ArrowUp`, bg primary, disabilitato/muted quando vuoto)
- Sotto la textarea: 2-3 chip suggerimenti cliccabili in riga (es. "Riepilogo prenotazioni", "Prossimi eventi"), con icone piccole, bordo sottile, hover leggero
- Sopra la textarea: riga muted piccola "Assistente AI Bravo!" con icona Sparkles (come "Recent chat" in Attio)

**Comportamento:**

- La textarea è scrivibile (stato locale `aiInput`)
- Click su invio o Enter → toast "L'assistente AI Bravo! sarà disponibile a breve" e resetta l'input
- Click su un chip → popola la textarea con quel testo (ma non invia)
- Nessuna chiamata API, nessun edge function

**Stile:** bordi solidi leggeri (non tratteggiati), sfondo card, angoli arrotondati generosi (rounded-xl), transizioni smooth