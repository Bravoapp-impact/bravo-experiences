## Obiettivo
Permettere ai titoli delle card esperienza di andare fino a 3 righe invece di troncare a 2, come fa Airbnb.

## Modifica
Un solo file: `src/components/common/BravoCard.tsx` (componente condiviso usato da catalog esperienze, prenotazioni, HR, ecc.).

Cambiare la classe del titolo da `line-clamp-2` a `line-clamp-3`. Il resto del layout (immagine, sottotitolo, meta) resta invariato — la card si estende solo in verticale quando il titolo è lungo, esattamente come nella reference Airbnb.

## Note
- Cambio puramente visivo, nessun impatto su business logic, dati o altri componenti.
- Si applica automaticamente ovunque sia usato `BravoCard`: catalogo dipendenti, "Le mie prenotazioni", HR catalog. Comportamento uniforme.
- Le card in una stessa riga del grid resteranno allineate in alto (l'immagine ha aspect ratio fisso); le card con titolo più corto avranno semplicemente meno testo sotto, come su Airbnb.

Nessun altro cambiamento richiesto.