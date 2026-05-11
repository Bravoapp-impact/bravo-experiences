## Problema

Nelle proposte TB mostrate all'HR, sotto il titolo dell'esperienza viene visualizzata la descrizione **lunga** (`description`) invece della **descrizione breve** (`short_description`) che il super admin compila apposta come sottotitolo. Lo stesso testo lungo viene poi giustamente riusato nella sezione "Cosa farete", risultando duplicato e troppo prolisso nell'header.

Riguarda due punti:
- `src/pages/hr/HRTBRequestDetailPage.tsx` — card di anteprima nella lista proposte.
- `src/pages/hr/HRTBProposalDetailPage.tsx` — pagina di dettaglio della singola proposta (header sotto il titolo).

La pagina pubblica `TBFormatDetailContent` invece distingue già correttamente `short_description` (sottotitolo) e `description` ("Cosa farete").

## Causa

La RPC `get_tb_proposal_details` (migration `20260423172656_…`) restituisce solo `f.description AS format_description` e non `f.short_description`. I componenti HR usano quindi la descrizione lunga sia come sottotitolo che come corpo.

## Modifiche

### 1. Migrazione DB
Aggiornare la funzione `public.get_tb_proposal_details(p_request_id uuid)` aggiungendo nella `RETURNS TABLE` il campo `format_short_description text` e nella `SELECT` la colonna `f.short_description AS format_short_description`. Nessun'altra logica cambia.

### 2. `HRTBRequestDetailPage.tsx`
- Estendere l'interfaccia locale `ProposalDetail` con `format_short_description: string | null`.
- Nel componente `ProposalCard`, sostituire il testo sotto il titolo (`{proposal.format_description && …}`) con `proposal.format_short_description ?? proposal.format_description` come fallback, così le proposte già esistenti senza short_description non rimangono vuote.

### 3. `HRTBProposalDetailPage.tsx`
- Aggiungere `format_short_description` al tipo restituito dalla RPC.
- Nel passaggio a `TBFormatDetailContent` (riga ~136), mappare:
  - `short_description: proposal.format_short_description`
  - `description: proposal.format_description` (rimane invariato per "Cosa farete").

## Cosa NON cambia

- Logica di matching, scoring e creazione delle proposte.
- RLS, schema delle tabelle `tb_formats` / `tb_proposals`.
- Pagina pubblica `TBFormatDetailContent` e tutti gli altri consumer.
- UI/styling delle card e del dettaglio.

## Verifica post-implementazione

1. Aprire una richiesta TB come HR (`/hr/team-building/:id`): sotto ogni titolo nella lista proposte deve comparire la `short_description` del format, non il testo lungo.
2. Aprire il dettaglio proposta (`/hr/team-building/:id/proposte/:pid`): l'header deve mostrare la `short_description` come sottotitolo, mentre la sezione "Cosa farete" continua a mostrare la `description` completa.
3. Per format senza `short_description`, viene mostrato il fallback alla `description` (comportamento attuale).