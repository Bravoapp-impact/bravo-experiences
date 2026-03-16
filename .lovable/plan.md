

# Piano: Ristrutturazione AssociationProfilePage in stile Airbnb Host

## File coinvolti

| File | Azione |
|------|--------|
| `src/components/association/AssociationPublicProfile.tsx` | **Nuovo** — componente principale con tutta la logica |
| `src/pages/association/AssociationProfilePage.tsx` | **Riscrittura** — wrapper sottile |
| `src/components/layout/AssociationLayout.tsx` | **Modifica** — rinomina sidebar item |

---

## 1. `AssociationLayout.tsx`
Rinomina `"Pagina Host"` → `"Profilo Pubblico"`.

## 2. `AssociationProfilePage.tsx`
Diventa wrapper minimale: legge `profile?.association_id` da `useAuth()`, renderizza `<AssociationLayout>` con dentro `<AssociationPublicProfile associationId={id} canEdit={true} />`. Se `association_id` è null, mostra loader.

## 3. `AssociationPublicProfile.tsx` — Componente principale

Props: `{ associationId: string; canEdit: boolean }`

### Data fetching (tutto in `useEffect` all'init):
1. **Association**: `supabase.from('associations').select('*').eq('id', associationId).single()`
2. **Città operative**: `supabase.from('association_cities').select('city_id, cities(name)').eq('association_id', associationId)`
3. **Esperienze pubblicate**: `supabase.from('experiences').select('id, title, description, image_url, city, category, status, experience_dates(id, start_datetime, end_datetime, max_participants)').eq('association_id', associationId).eq('status', 'published').order('created_at', { ascending: false })`
4. **Recensioni** (strategia multi-step per evitare problemi con filtri nested):
   - Fetch IDs esperienze dall'associazione
   - Fetch IDs date per quelle esperienze via `.in('experience_id', expIds)`
   - Fetch booking IDs per quelle date via `.in('experience_date_id', dateIds)`
   - Fetch reviews per quei booking IDs: `.in('booking_id', bookingIds)` con select che include `bookings(user_id, profiles:user_id(first_name, avatar_url))`
   - Stats (count + media rating) calcolate in frontend dai dati

### Stato inline editing
Per ogni campo editabile (`description`, `contact_name`, `contact_email`, `contact_phone`, `website`, `address`):
- `editingField: string | null` — quale campo è in edit mode
- `editValue: string` — valore corrente nell'input
- Click su Pencil → setta `editingField` e `editValue`
- Salva → update singolo campo su `associations`, aggiorna state locale, toast conferma
- Annulla → resetta `editingField` a null

### Sezioni UI

**Sezione 1 — Header (grid 2 colonne desktop, stacked mobile)**

Colonna sinistra — Card profilo:
- Avatar 96px cerchio con logo o iniziali su bg-muted
- Se `canEdit`, overlay camera al hover → usa `LogoUpload` con bucket `association-logos`, salva direttamente su DB
- Nome associazione (h2 font-bold)
- 3 stats in riga: N recensioni, X.X ★ valutazione, N anni su Bravo! (da `partnership_start_date`, `differenceInYears` di date-fns; se null → "Nuovo")
- Badge "Identità verificata" con CheckCircle verde

Colonna destra — Info:
- Titolo "Informazioni su [Nome]"
- Descrizione con Pencil inline se canEdit → Textarea editabile
- Lista campi (MapPin/address, Globe/website come link, Mail/email, Phone/telefono, User/referente) con Pencil inline
- Campi vuoti + canEdit → placeholder "+ Aggiungi [campo]" in muted, cliccabile
- Badge città operative in riga (read-only)

**Sezione 2 — Recensioni**
- Titolo "Recensioni su [Nome] (N)"
- Grid 3 col desktop / 1 mobile, max 6 recensioni
- Card: avatar/primo nome, stelline (Star da lucide, fill per piene, text-amber-500), data relativa (`formatDistanceToNow` con locale `it`), testo `feedback_positive` troncato a 3 righe
- Se >6 reviews, bottone "Mostra altre recensioni" (incrementa limit)
- Se 0 reviews, messaggio muted
- Sempre read-only anche con canEdit

**Sezione 3 — Esperienze**
- Titolo "Esperienze di [Nome] (N)"
- Grid 3/2/1 colonne
- Card: immagine (BaseCardImage), titolo, descrizione 2 righe, badge categoria, prossima data, icona città
- Solo `status = 'published'`
- Se 0 e canEdit, link "Crea la tua prima esperienza →" verso `/association/experiences`

### Dettagli tecnici
- Loading: Skeleton per card profilo e sezioni
- Stelline: componente inline con 5 Star icons, fill basato su rating, colore `text-amber-500`
- Date relative: `formatDistanceToNow` da `date-fns` con locale `it`
- Hover card: `hover:shadow-md transition-shadow`
- Edit buttons: `variant="ghost" size="icon"`, visibili solo se `canEdit`
- Imports: date-fns (`differenceInYears`, `formatDistanceToNow`, `format`), locale `it`, lucide icons, Skeleton, LogoUpload, BaseCardImage

