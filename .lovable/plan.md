## Riflettere selezione nel bottone della card proposta

File: `src/pages/hr/HRTBRequestDetailPage.tsx`

### Problema
Nella griglia "Le tue proposte" (sezione `/hr/team-building/:id`), il bottone della card è sempre "Scopri di più", quindi non si capisce quali proposte sono state marcate come interessate o scartate dal dettaglio.

### Modifica
Rendere il testo e lo stile del bottone dinamici in base a `p.client_status`:

- `client_status === "interested"` → label `Mi interessa` con icona `Heart` (filled), stile verde pieno (stessi token `bg-success` / `text-success-foreground` / `border-success` già usati in `HRTBProposalDetailPage`).
- `client_status === "declined"` → label `Non mi interessa` con icona `X`, stile rosso pieno (`bg-destructive` / `text-destructive-foreground` / `border-destructive`).
- Altrimenti (pending / null) → resta `Scopri di più` outline come ora.

Il click continua a fare `navigate` al dettaglio della proposta — non cambia la business logic, solo presentazione.

### Dettagli implementativi
- Importare `Heart`, `X` da `lucide-react` (oltre agli esistenti) e `cn` da `@/lib/utils`.
- Definire due piccoli helper locali (o inline) `interestedBtnClass` / `declinedBtnClass` analoghi a quelli in `HRTBProposalDetailPage.tsx`, applicati con `size="sm"` e `h-7 text-xs mt-1.5` per mantenere la metrica della griglia.
- Mantenere `variant="outline"` per lo stato neutro; per gli stati interested/declined usare le classi piene.
- Nessuna modifica a `BravoCard`, alle query, né alle mutation.

### Cosa NON cambia
- `dimmed` per le declined resta come ora (nel mapping di `BravoCard`).
- Nessun cambio in `HRTBProposalDetailPage.tsx`, `TBRequestStatusSection`, `HRTBQuoteView`.
- Nessuna modifica DB / RPC.

### Verifica
- Stato pending → bottone outline "Scopri di più".
- Marcata "Mi interessa" nel dettaglio → tornando alla lista, bottone verde "Mi interessa" con cuore pieno.
- Marcata "Non mi interessa" → bottone rosso "Non mi interessa" con X (card resta dimmed).
- Toggle a pending nel dettaglio → bottone torna "Scopri di più".
