## Obiettivo
Trasformare la CTA mobile "Vedi date disponibili" nel dettaglio esperienza da barra fissa con sfondo bianco e bordo, in un bottone "sospeso" galleggiante sopra il contenuto.

## File da modificare
`src/pages/ExperienceDetail.tsx` (righe 408–418)

## Modifiche
- Rimuovere il contenitore `fixed` con `bg-background/95 backdrop-blur-sm border-t border-border` che crea la barra bianca.
- Sostituirlo con un wrapper trasparente `fixed bottom-16 left-0 right-0 px-4 z-40 pointer-events-none` (così non blocca lo scroll del contenuto sotto).
- Il `Button` interno avrà `pointer-events-auto`, ombra elegante (`shadow-lg`), e manterrà larghezza piena entro il padding (`w-full h-12 rounded-xl`).
- Mantenere `bottom-16` per stare sopra la BottomNavigation.
- Aggiungere un po' di margine inferiore al contenuto già garantito da `pb-28` esistente (ok così).

Risultato: il bottone galleggia sopra il contenuto senza barra di sfondo, con ombra che lo stacca visivamente.