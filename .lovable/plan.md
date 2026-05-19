## Allineare layout di `HRSuggestionsPage` alle altre pagine HR

Due piccole modifiche a `src/pages/hr/HRSuggestionsPage.tsx`:

1. **Padding/altezza.** Sostituire il wrapper `<div className="p-6 space-y-6">` con `<div className="space-y-6">`. Il padding orizzontale/verticale è già fornito da `AdminLayout` (come fanno `HREmployeesPage`, `HRGalleryPage`, ecc.). Questo elimina il doppio padding che fa apparire la pagina "più stretta e più bassa" delle altre.

2. **Sottotitolo.** Rimuovere `description="Raccogli e gestisci i suggerimenti di ETS dai tuoi dipendenti"` dal `PageHeader`. Resta solo title + icona, coerente con le altre pagine HR.

Nessun'altra modifica: la struttura interna (link da condividere + tabella) resta invariata.
