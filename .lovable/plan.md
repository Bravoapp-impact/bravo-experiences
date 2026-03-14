

# Piano: Semplificare flusso pubblicazione + Modifica/Elimina esperienze pubblicate

## Riepilogo cambiamenti

### 1. AssociationExperiencesPage.tsx — Pubblicazione diretta + azioni su published

**Rimuovere:**
- Stato `submitExperience`, `submitting`, funzione `handleSubmitForReview`
- Icona `Send` ("Richiedi pubblicazione") dalle azioni draft
- Import `Send`, `Clock`
- Intera sezione "PENDING REVIEW" (righe 250-281)
- AlertDialog "Submit for Review" (righe 437-460)
- `pending_review` dal `grouped` useMemo

**Aggiungere nelle azioni draft:**
- Bottone "Pubblica" (icona `CheckCircle2`, hover verde) che cambia direttamente status a `published` con conferma AlertDialog semplice
- Funzione `handlePublish` che fa `update({ status: "published" })`

**Aggiungere nelle azioni published:**
- Bottone "Modifica" (Pencil) → apre `setEditExperience(exp)`
- Bottone "Elimina" (Trash2) → visibile ma cliccabile solo se non ci sono date future o prenotazioni attive. Al click: fetch per verificare se ci sono `experience_dates` future o `bookings` con status `confirmed` su date di questa esperienza. Se ce ne sono, mostra toast di errore. Se no, apre `DeleteConfirmDialog`.

### 2. SuperAdminExperiencesPage.tsx — Rimuovere tab "Da approvare"

**Rimuovere:**
- Tab "Da approvare" (righe 538-546) e relativo `TabsContent` "pending" (righe 837-932)
- Stati `publishExperience`, `rejectExperience`, `rejectReason`, `publishing`, `rejecting`
- Funzioni `handlePublish`, `handleReject`
- Variabile `pendingExperiences`
- AlertDialog "Publish Confirmation" (righe 1206-1222)
- Dialog "Reject" (righe 1224-1258)
- Pulsanti Pubblica/Rifiuta nel Preview Dialog (righe 1304-1314)
- Import `Check`, `XCircle`
- Il `Tabs` wrapper diventa superfluo — rimuovere e tenere solo il contenuto di "all"

**Mantenere:** Il filtro "In revisione" nel dropdown stato resta (per eventuali dati storici), ma il tab dedicato sparisce.

### 3. Logica eliminazione esperienza (associazione)

Nuova funzione `handleDeletePublished(exp)`:
```typescript
const checkCanDelete = async (expId: string) => {
  // Check future dates
  const { count: futureDates } = await supabase
    .from("experience_dates")
    .select("id", { count: "exact", head: true })
    .eq("experience_id", expId)
    .gte("start_datetime", new Date().toISOString());
  
  if (futureDates && futureDates > 0) {
    toast.error("Non puoi eliminare un'esperienza con date future programmate");
    return false;
  }
  
  // Check active bookings
  const { data: dateIds } = await supabase
    .from("experience_dates")
    .select("id")
    .eq("experience_id", expId);
  
  if (dateIds && dateIds.length > 0) {
    const { count: activeBookings } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("experience_date_id", dateIds.map(d => d.id))
      .eq("status", "confirmed");
    
    if (activeBookings && activeBookings > 0) {
      toast.error("Non puoi eliminare un'esperienza con prenotazioni attive");
      return false;
    }
  }
  return true;
};
```

### File coinvolti

| File | Modifica |
|------|----------|
| `AssociationExperiencesPage.tsx` | Rimuovere flusso review, aggiungere pubblicazione diretta, modifica+elimina su published |
| `ExperiencesPage.tsx` (super-admin) | Rimuovere tab "Da approvare", dialoghi pubblica/rifiuta, semplificare a vista singola |

