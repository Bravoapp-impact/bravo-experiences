# Rimozione del riferimento "Categoria" da tutte le card

## Problema

La categoria è un attributo interno usato per raggruppare/filtrare il catalogo, ma su tutte le card (employee, HR, association, public profile, related) viene mostrata come badge sull'immagine o come pillola/meta sotto il titolo. È rumore visivo: l'utente non ha bisogno di leggere la categoria su una card.

## Cosa cambia

Rimuoviamo qualsiasi rendering visibile della categoria all'interno delle card di lista, su qualunque ruolo. La categoria continua a esistere come dato (filtri, raggruppamenti, dettaglio): cambia solo la presentazione delle card.

### File da modificare

1. **`src/components/experiences/ExperienceCardCompact.tsx`** (employee + correlate)
   - Eliminare il blocco `{experience.category && (<Badge ...>{experience.category}</Badge>)}` dentro `imageOverlay`.
   - Mantenere intatto il badge "Completo" su date piene.

2. **`src/components/experiences/ExperienceCardRich.tsx`**
   - Rimuovere la prop `badge` (badge categoria) passata a `BaseCardImage` e l'import non più usato di `Badge` se diventa orfano.

3. **`src/components/hr/HRExperienceCard.tsx`**
   - Rimuovere il `<Badge>` con icona `Tag` che mostra `experience.category.name` (righe ~107–112). Mantenere i badge "Associazione" e "Città".
   - Rimuovere import di `Tag` da `lucide-react` se diventa orfano.

4. **`src/components/association/AssociationPublicProfile.tsx`**
   - Nel render della card esperienza, rimuovere la prop `badge={exp.category ? ... : null}` (righe ~676–682).

5. **`src/pages/hr/HRExperiencesPage.tsx`**
   - Nelle due sezioni che costruiscono `metaItems` per le card del catalogo (righe ~469–472 e ~521–524), rimuovere il push di `categoryName` come `metaItem`. La variabile `categoryName` può essere eliminata se non più usata.

6. **`src/pages/association/AssociationExperiencesPage.tsx`**
   - Stessa modifica nei tre punti che fanno `metaItems.push({ text: categoryName })` (righe ~363–366, ~417–420, ~472–…). Eliminare anche le variabili `categoryName` se non più usate altrove nel blocco.

## Cosa NON cambia

- Il campo `category` / `category_id` resta nel data model e nelle query: serve a filtri (HR, Super Admin, Association) e raggruppamenti.
- I filtri "Categoria" nei pannelli HR e Super Admin restano invariati.
- La pagina di dettaglio esperienza (header con `categoryName`) non viene toccata: la categoria continua a comparire nel dettaglio, dove ha senso.
- Nessuna modifica a Super Admin tables/CRUD (in tabella ha senso vedere la categoria come colonna gestionale).
- Nessuna modifica al backend, alle RLS o agli edge functions.

## Verifica post-modifica

- `/app/experiences` (mobile + desktop): nessun badge categoria sulle card.
- Sezione "Esperienze correlate" nel dettaglio: nessun badge categoria.
- HR `/hr/esperienze` (entrambe le viste catalogo + statistiche): nessuna pillola categoria sotto il titolo.
- Association `/association/experiences`: nessuna pillola categoria nelle card di listing.
- Profilo pubblico associazione: card esperienza senza badge categoria.
- I filtri per categoria nei pannelli HR/Super Admin/Association continuano a funzionare correttamente.
