## Obiettivo

Trasformare il feedback positivo da testo libero a un set di tag aggregabili (max 3 selezioni), mantenendo la textarea come "extra" opzionale. In parallelo, allineare il modale al componente `BaseModal` standard.

## Parte 1 — Migration database

Nuova migration con una sola istruzione:

```sql
ALTER TABLE public.experience_reviews
ADD COLUMN feedback_positive_tags text[] NOT NULL DEFAULT '{}';
```

- Nessuna modifica a `feedback_positive`, `feedback_improvement`, `rating`, `would_recommend`, alle policy RLS o ai trigger.
- Default `'{}'` così le righe esistenti restano valide e gli insert che non passano il campo continuano a funzionare.

## Parte 2 — Riscrittura `src/components/bookings/FeedbackModal.tsx`

### Struttura modale
- Sostituire l'attuale `motion.div` custom con `<BaseModal>` (`src/components/common/BaseModal.tsx`), passando:
  - `title="Com'è andata?"`
  - `subtitle={"{titolo esperienza} · {data formattata it}"}`
- Layout interno: contenuto scrollabile + footer fisso in fondo (`border-t`) col bottone "Invia feedback" (stesso stile attuale: `h-12 rounded-xl w-full`).

### Sezioni del form (dall'alto in basso)
1. **Stelle** — invariate, obbligatorie.
2. **Consiglieresti?** Sì/No — invariata, obbligatoria.
3. **"L'esperienza è stata bella perché…"** (opzionale):
   - Gruppo di 8 chip a selezione multipla, max 3 selezionabili.
   - Costante locale `POSITIVE_TAGS` (array di `{ slug, label }`) con gli 8 valori indicati.
   - Stato `selectedTags: string[]` (slug).
   - Comportamento chip:
     - Click su chip non selezionata → aggiunge lo slug (solo se `selectedTags.length < 3`).
     - Click su chip selezionata → rimuove lo slug.
     - Quando si raggiungono 3 selezioni, le chip non selezionate diventano `disabled` con stile attenuato.
   - Helper sotto la label che mostra `{n}/3 selezionate`.
   - Stile chip: button pill (`rounded-full px-3 py-1.5 text-sm border`), selezionata = `bg-primary/10 border-primary text-primary`, non selezionata = `border-border text-foreground hover:border-primary/50`, disabled = `opacity-40 cursor-not-allowed`. Layout `flex flex-wrap gap-2`.
4. **"Vuoi aggiungere altro?"** (opzionale):
   - Textarea identica all'attuale ma con nuovo label/placeholder.
   - Continua a salvare in `feedback_positive` (`null` se vuota dopo `trim()`).
5. **"Cosa poteva andare meglio?"** — textarea invariata, continua a salvare in `feedback_improvement`.

### Salvataggio
- Insert su `experience_reviews` aggiornato con il nuovo campo:
  ```ts
  feedback_positive_tags: selectedTags,        // array di slug, [] se nessuna selezione
  feedback_positive: feedbackPositive.trim() || null,
  feedback_improvement: feedbackImprovement.trim() || null,
  ```
- Nessun upsert / nessun branch di update: l'insert resta one-shot come oggi.
- `isValid = rating > 0 && wouldRecommend !== null` (chip e textarea restano opzionali).
- `resetForm()` aggiornato per azzerare anche `selectedTags`.

### Costante slug → label
```
legato_colleghi      → "Ho legato con i colleghi"
contributo_concreto  → "Ho dato un contributo concreto"
realta_territorio    → "Ho conosciuto una realtà del territorio"
ben_organizzata      → "Era organizzata bene"
ets_accogliente      → "L'associazione ci ha accolto benissimo"
imparato_qualcosa    → "Ho imparato qualcosa di nuovo"
pausa_diversa        → "Una pausa diversa dal solito"
energia_buonumore    → "Mi ha lasciato energia e buonumore"
```

## Fuori scope (confermato)
- Visualizzazione dei tag (card esperienze completate, profilo pubblico ETS).
- `MyBookings.tsx` e altre superfici che mostrano i feedback: nessuna modifica oltre a quanto già passa al modale (la prop `booking` non cambia forma).
- Tabelle, policy, trigger, edge functions: nessuna modifica.

## Verifica post-implementazione
- Build TypeScript pulita (i types Supabase si rigenerano dopo la migration e includeranno `feedback_positive_tags`).
- Aprire il modale da MyBookings su un'esperienza completata: stelle + Sì/No + chip (con limite a 3) + textarea opzionale + textarea improvement.
- Invio senza chip e senza testo → riga inserita con `feedback_positive_tags = '{}'` e gli altri campi null/valorizzati come oggi.
- Invio con 2 chip e testo extra → riga con array di 2 slug e `feedback_positive` valorizzato.
