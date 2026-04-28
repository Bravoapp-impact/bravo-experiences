## Diagnosi

Ho indagato il database e ho trovato perché **nessuna richiesta restituisce proposte**:

1. **Causa principale (bloccante)**: tutti i 70 `tb_formats` nel DB hanno `status = 'draft'`. La funzione di matching filtra solo i `published`, quindi non trova mai nulla. La tabella `tb_proposals` è infatti vuota (0 righe) nonostante 6 richieste inviate.
2. **Match per provincia troppo stretto**: la funzione richiede che la città del format abbia `province` esattamente uguale a uno dei `places` selezionati dall'HR. Se un format è collegato (in `tb_format_cities`) solo a città dentro una provincia, e nessuna città di quella provincia è registrata, non matcha.
3. **Nessun fallback**: se zero format passano il filtro città, l'HR vede una pagina vuota. Mancano i format `nationwide` come "rete di sicurezza".
4. **Inconsistenza storica**: alcune vecchie richieste salvavano `province` (stringa) invece di `places` (array). Le nuove dal wizard usano correttamente `places`, quindi non è un problema per il futuro.

## Cosa propongo di fare

### Fix 1 — Pubblicare automaticamente i format esistenti (data fix)

Migration una-tantum che porta tutti i 70 `tb_formats` da `draft` a `published`. Sono i format già caricati come catalogo iniziale, quindi è ragionevole pubblicarli in blocco. Il super admin potrà poi spegnerli singolarmente.

### Fix 2 — Rendere il matching più permissivo (modifica funzione)

Riscrivere `match_tb_formats_for_request` con questa logica:

- **Filtro città allargato**: un format matcha se è `nationwide = true` **OPPURE** ha almeno una città in `tb_format_cities` la cui `province` è tra i `places` richiesti.
- **Fallback automatico**: se dopo il filtro città restano zero format, ripiegare sui format `nationwide` (per non lasciare HR a mani vuote).
- **Logging**: aggiungere `RAISE LOG` con conteggi intermedi per facilitare debug futuro.

### Fix 3 — Re-trigger matching sulle richieste esistenti

Per le 6 richieste già esistenti, eseguire un loop nella migration che chiama il matching dopo aver applicato i fix, così l'HR vede subito le proposte (limitatamente a quelle con `places` valido).

### Fix 4 — Migliorare UX pagina dettaglio quando zero proposte

In `HRTBRequestDetailPage.tsx` aggiungere uno stato esplicito quando la richiesta è `submitted`/`proposals_ready` ma `tb_proposals` è vuota: messaggio del tipo "Stiamo ancora lavorando alla selezione, ti contatteremo a breve" + bottone per contattare il team. Evita la pagina che sembra "rotta".

## File coinvolti


| File                                     | Azione                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Migration SQL                            | Pubblicare format + riscrivere `match_tb_formats_for_request` + re-run sulle request esistenti |
| `src/pages/hr/HRTBRequestDetailPage.tsx` | Empty state migliore quando 0 proposte                                                         |


## Cosa NON cambiamo

- La struttura della funzione `get_tb_proposal_details` resta uguale (funziona già correttamente)
- Il wizard di submit resta uguale (salva già `places` correttamente)
- Le RLS restano invariate