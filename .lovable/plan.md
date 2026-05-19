# Foto fantasma in galleria — diagnosi e fix

## Cosa è successo

Le due foto grigie ("Approvata" senza immagine) per *Giochi e attività manuali con minori fragili* del 13 maggio 2026 sono **righe orfane** in `gallery_photos`:

- DB: 2 righe ancora presenti (`status = 'approved'`), id `33ccf812-…407e` e `adae9e5d-…155fd`, `uploaded_by` = utente HR.
- Storage bucket `gallery-photos`: **0 file** sotto il prefisso della data. I file binari sono stati rimossi in un bulk-delete precedente, ma le righe DB no.

Si vedono in `/app/gallery` perché l'utente è loggato come employee con lo stesso `uploaded_by` (la galleria dipendente oggi mostra solo le foto caricate da sé — vedi `aperto.md`).

## Causa radice — RLS

`gallery_photos` ha una **sola** policy DELETE:

```
Employees delete own pending photos:
  role = 'employee' AND uploaded_by = auth.uid() AND status = 'pending'
```

**Nessuna policy DELETE per `hr_admin` o `super_admin`.** Il bulk delete HR (`useBulkDeletePhotos`) fa:

1. `storage.remove([paths])` → riesce (i permessi storage ci sono) → i file binari scompaiono.
2. `.from("gallery_photos").delete().in("id", ids)` → RLS nega silenziosamente, 0 righe affette, **nessun errore**.

Risultato: file via, riga DB resta, "Approvata" su placeholder grigio.

## Fix

### 1. Migration — aggiungere DELETE policies mancanti su `gallery_photos`

- HR può cancellare foto della propria company (qualsiasi stato):
  ```
  USING (
    get_user_role(auth.uid()) = 'hr_admin'
    AND company_id = get_user_company_id(auth.uid())
  )
  ```
- Super admin può cancellare tutto:
  ```
  USING (is_super_admin(auth.uid()))
  ```

Mantengo la policy esistente per employee (cancella solo proprie pending).

### 2. Migration — pulire le 2 righe orfane

`DELETE FROM gallery_photos WHERE id IN ('33ccf812-922e-44e2-8989-6d957859407e', 'adae9e5d-faaa-4c28-851a-2fdee1c155fd');`

(Una scan generale ha confermato che sono **le uniche** righe orfane in tutto il bucket.)

### 3. `useBulkDeletePhotos.ts` — diagnostica difensiva

Aggiungere `.select("id")` alla DELETE e controllare che `data.length === ids.length`; se diverso, `throw` con messaggio chiaro ("Nessuna foto cancellata: permessi insufficienti"). Evita che lo stesso silent-fail si ripresenti in futuro.

### 4. Aggiornare doc

- `docs/log.md`: nuova entry "2026-05-19 — Fix: bulk delete galleria HR non rimuoveva righe DB (RLS mancante)". Estende l'entry odierna.
- `docs/aperto.md`: chiudere implicitamente il sotto-punto rilevante della voce "Galleria HR: upload e filtri da rifinire" (non era esplicito ma è dello stesso filone).

## Out of scope

- Audit completo delle RLS sulle altre tabelle (è un debito separato in `aperto.md`).
- Vista galleria aziendale completa per dipendenti (resta a follow-up).
- Cambi al filtro `/app/gallery` lato employee.
