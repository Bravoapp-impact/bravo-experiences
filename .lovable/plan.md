## Problema individuato

Il fix precedente salva un `localQuoteId` solo dopo un salvataggio riuscito, ma nel caso attuale la pagina ha già una bozza esistente nello storico (`b5a5197f...`) mentre l’editor viene montato dal branch `quote_requested` con `quoteId={null}`.

Di conseguenza `QuoteEditor` continua a inviare `p_quote_id: null` e la RPC prova a creare un nuovo preventivo, fallendo con `quote_already_exists`. Per questo ora non permette né sovrascrivere la bozza né inviarla.

## Piano di fix

1. **Aggiornare solo `src/pages/super-admin/TBRequestDetailPage.tsx`**
   - Nel branch `quote_requested`, quando l’utente clicca “Avvia composizione”, controllare se `quoteHistory` contiene già una quote `draft`.
   - Se esiste, passare `quoteId={draftQuote.id}` a `QuoteEditor` invece di `null`.
   - Se non esiste, mantenere il comportamento attuale: `quoteId={null}` e precompilazione da proposte interessate.

2. **Evitare il blocco “Bozza non trovata” se la query è ancora in caricamento/refetch**
   - Se necessario, rendere il branch `quote_in_composition` più tollerante usando lo storico disponibile e non forzando reload quando la bozza può arrivare da refetch.

3. **Mantenere invariato tutto il resto**
   - Nessuna modifica alle RPC.
   - Nessuna scrittura diretta su `tb_quotes` dal client.
   - Nessuna modifica a `QuoteReadOnlyView` o alla vista HR.

## Validazione prevista

- Per una richiesta in `quote_requested` con bozza già presente, “Avvia composizione” deve aprire l’editor in modalità modifica bozza.
- I successivi “Salva bozza” e “Invia al cliente” devono chiamare `admin_save_tb_quote_draft` con `p_quote_id` valorizzato, quindi usare il ramo UPDATE della RPC invece dell’INSERT.
- L’errore `quote_already_exists` non deve più comparire in questo scenario.