

# Piano combinato: Deprecare company_id dalle date + Gestione eventi privati

Due interventi collegati che allineano il pannello Super Admin al modello marketplace.

---

## 1. Rimuovere company_id da ExperienceDateDialog

Le date sono condivise nel marketplace. Il campo `company_id` su `experience_dates` è deprecato (resta nel DB come nullable, nessuna migrazione).

### File: `src/components/super-admin/ExperienceDateDialog.tsx`
- Rimuovere l'interfaccia `Company` e la prop `companies`
- Rimuovere `company_id` da `formData`, dal `useEffect` di inizializzazione, dalla validazione e dal payload di salvataggio
- Rimuovere il blocco UI `Select` "Azienda *"
- Rimuovere gli import di `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`

### File: `src/pages/super-admin/ExperiencesPage.tsx`
- Rimuovere `companies={companies}` dal JSX di `<ExperienceDateDialog>`
- Verificare se `companies` è usato altrove nella pagina (probabilmente sì per il form esperienze) — in tal caso mantenere il fetch ma rimuovere solo il passaggio al dialog date

---

## 2. Aggiungere gestione visibilità/eventi privati

Per il caso limite di eventi privati richiesti da un'azienda, il super admin potrà controllare `visibility` e `experience_companies` direttamente dalla pagina Esperienze, senza passare dalla pagina Assegnamenti.

### File: `src/pages/super-admin/ExperiencesPage.tsx`

**Nuovo bottone nella riga azioni di ogni esperienza:**
- Icona `Lock` (se `visibility = 'private'`) o `Globe` (se `public`)
- Tooltip: "Gestisci visibilità"
- Al click apre un dialog inline

**Nuovo dialog "Gestisci visibilità":**
- Switch per toggle `public` ↔ `private`
- Quando `private` è attivo, mostra lista checkbox delle aziende (fetch da `companies`)
- Pre-selezionate le aziende già presenti in `experience_companies` per quell'esperienza
- Bottone "Salva" che:
  1. `UPDATE experiences SET visibility = '...' WHERE id = ...`
  2. Sincronizza `experience_companies`: cancella le righe rimosse, inserisce le nuove

**Stato aggiuntivo necessario:**
- `visibilityDialogExp` — esperienza selezionata per il dialog
- `visibilityPrivate` — stato switch
- `selectedCompanyIds` — set di company_id selezionati
- `currentAssignments` — assegnamenti attuali caricati all'apertura del dialog

**Fetch all'apertura del dialog:**
```typescript
const { data } = await supabase
  .from("experience_companies")
  .select("company_id")
  .eq("experience_id", exp.id);
```

**Salvataggio:**
```typescript
// 1. Update visibility
await supabase.from("experiences")
  .update({ visibility: isPrivate ? 'private' : 'public' })
  .eq("id", expId);

// 2. Delete removed assignments
await supabase.from("experience_companies")
  .delete()
  .eq("experience_id", expId)
  .not("company_id", "in", `(${selectedIds.join(",")})`);

// 3. Upsert new assignments
await supabase.from("experience_companies")
  .upsert(selectedIds.map(cid => ({ experience_id: expId, company_id: cid })));
```

**Indicatore visivo nella tabella:**
- Badge `Privata` accanto allo status dell'esperienza quando `visibility = 'private'`

---

## File coinvolti

| File | Modifica |
|------|----------|
| `ExperienceDateDialog.tsx` | Rimuovere company_id, Select, prop companies |
| `ExperiencesPage.tsx` (super-admin) | Rimuovere `companies` prop dal dialog date; aggiungere bottone Lock + dialog visibilità + badge |

Nessuna migrazione DB. Nessuna modifica RLS.

