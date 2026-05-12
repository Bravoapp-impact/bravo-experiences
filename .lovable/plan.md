## Causa

In `QuoteEditor.tsx`, quando il preventivo viene aperto in stato "nessuna bozza esistente" (es. dopo che lo status è passato a `quote_in_composition` ma senza draft), il parent `TBRequestDetailPage.tsx` passa `quoteId={null}`.

Cosa succede oggi:

1. L'utente clicca **Salva bozza** → `buildPayload` usa la prop `quoteId` (null) → la RPC fa INSERT e crea correttamente la bozza, ritornando il nuovo id.
2. `onSuccess` invalida la query del parent, ma la prop `quoteId` di `QuoteEditor` resta `null` finché il parent non ricarica i dati e ri-renderizza con il nuovo id (ed eventualmente smonta/rimonta).
3. L'utente clicca subito **Invia al cliente** → `sendMutation` richiama di nuovo `buildPayload` con `p_quote_id = null` → la RPC tenta un altro INSERT → vincolo unique → `quote_already_exists`.

In sostanza: il componente non "ricorda" l'id appena creato dalla prima save, quindi ogni azione successiva continua a comportarsi come se stesse creando una bozza nuova.

## Fix

Far sì che `QuoteEditor` tenga traccia internamente dell'id del quote appena creato/salvato, e lo usi come fallback alla prop.

### Modifiche (un solo file)

**`src/components/super-admin/tb-quote-editor/QuoteEditor.tsx`**

1. Aggiungere uno state locale:
   ```ts
   const [localQuoteId, setLocalQuoteId] = useState<string | null>(quoteId);
   ```
   Mantenerlo sincronizzato quando la prop cambia con un `useEffect` (`if (quoteId) setLocalQuoteId(quoteId)`).

2. In `buildPayload`, usare `localQuoteId` al posto di `quoteId`:
   ```ts
   p_quote_id: localQuoteId,
   ```

3. In `saveDraftMutation.onSuccess(newQuoteId)` chiamare `setLocalQuoteId(newQuoteId)` **prima** delle invalidate. Stessa cosa in `sendMutation` dopo il primo `admin_save_tb_quote_draft` (fra step 1 e step 2): usare l'id ritornato per aggiornare `localQuoteId` così, anche se un `admin_send_tb_quote` dovesse fallire e l'utente riprovasse, il successivo save/send userebbe l'UPDATE branch della RPC.

4. Anche l'header card che mostra "Nuovo preventivo" / "Preventivo v…" può usare `localQuoteId ?? quoteId` per coerenza (cosmetico, non bloccante).

### Cosa NON cambia

- Nessuna modifica alle RPC (`admin_save_tb_quote_draft`, `admin_send_tb_quote`).
- Nessuna modifica al parent `TBRequestDetailPage.tsx` o ad altri componenti.
- La logica HR (`HRTBQuoteView`) resta intatta.
- La logica decisione `hr_decide_on_quote` resta intatta.

### Validazione

- Caso A: `quoteId=null` → Save bozza → Save bozza di nuovo → deve fare UPDATE (non INSERT).
- Caso B: `quoteId=null` → Save bozza → Invia al cliente → deve riusare la stessa bozza, status passa a `sent`.
- Caso C: `quoteId` valido in ingresso → comportamento invariato.
- Caso D: nuova versione (supersede) — il parent monta un nuovo `QuoteEditor` con il nuovo `quoteId` valido, quindi non interessato.