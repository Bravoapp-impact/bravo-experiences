## Obiettivo

Aggiungere il flag "In tutta Italia" alle associazioni, allineando il pattern già usato per `tb_formats.nationwide`. Effetto limitato alla form super-admin (creazione/modifica associazione).

## Modifiche DB

Migration:
- `ALTER TABLE associations ADD COLUMN nationwide boolean NOT NULL DEFAULT false`

Nessuna modifica RLS necessaria (il campo eredita le policy esistenti).

## Modifiche UI — `src/pages/super-admin/AssociationsPage.tsx`

1. **State**: aggiungere `nationwide: boolean` in `formData` (default `false`).
2. **Fetch / edit**: caricare `nationwide` dall'associazione esistente quando si apre la modale di modifica.
3. **Form** (sezione "Città dove opera", riga 723):
   - Sopra la griglia di checkbox città, aggiungere un toggle/checkbox prominente "In tutta Italia" con descrizione breve ("L'associazione opera su tutto il territorio nazionale").
   - Quando attivo: la griglia delle città viene disabilitata visivamente (opacity ridotta + `pointer-events-none`) e mostra un hint "Selezione disabilitata: l'associazione opera ovunque".
   - Quando disattivo: comportamento attuale invariato.
4. **Submit (insert + update)**:
   - Salvare il flag `nationwide` su `associations`.
   - Se `nationwide = true`: svuotare `association_cities` per quell'associazione (nessuna riga). Niente snapshot di tutte le città — la verità è il flag.
   - Se `nationwide = false`: comportamento attuale (insert delle `city_ids` selezionate).
5. **Display in lista** (riga 471, colonna "Città"): se `nationwide` mostrare un badge "In tutta Italia" al posto dell'elenco città.

## Fuori scope (esplicito)

- Filtri lato employee/HR: non vengono toccati. Un'associazione `nationwide` continuerà ad apparire dove appare oggi (basata su `association_cities`, quindi su nessuna città fino a quando non si decide diversamente). Quando vorrai estendere il comportamento ai filtri pubblici, sarà una sessione successiva con scope dichiarato.
- Nessuna modifica a `tb_formats` o ad altre entità.

## File toccati

- Nuova migration SQL (1 colonna).
- `src/pages/super-admin/AssociationsPage.tsx` (form + lista + handler insert/update).
- `docs/log.md` + `docs/aperto.md` (debito noto: estendere `nationwide` ai filtri pubblici quando deciso) — secondo checklist post-sessione.
