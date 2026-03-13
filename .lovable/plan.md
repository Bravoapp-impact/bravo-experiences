

# Fix ManageDatesDialog: BaseModal + Calendar inline

## Problemi identificati

1. **Calendar Popover**: si apre verso l'alto e viene tagliato sui mesi con 6 settimane. Il Popover dentro un Dialog ha problemi di posizionamento cronici.
2. **Modale non usa BaseModal**: usa il `Dialog` ShadCN raw invece di `BaseModal`, quindi non ha il bottom-sheet mobile, il body scroll lock, e i bordi arrotondati corretti. Questo e' il motivo per cui i bordi si vedono male.

## Soluzione

### 1. Convertire a BaseModal
Sostituire `Dialog`/`DialogContent` con `BaseModal` — identico a tutte le altre modali dell'app. Questo risolve i bordi, il comportamento mobile, e garantisce coerenza futura.

### 2. Calendar inline (no Popover)
Invece di aprire il calendario in un Popover (che ha problemi di overflow/posizionamento dentro modali), renderizzarlo **inline** direttamente nel form. Quando l'utente non ha ancora selezionato una data, il calendario e' visibile. Quando seleziona, mostra la data selezionata con un pulsante per cambiarla. Questo elimina completamente i problemi di posizionamento.

## File modificato

| File | Modifica |
|------|----------|
| `ManageDatesDialog.tsx` | Sostituire Dialog con BaseModal, rimuovere Popover, calendario inline |

