## Modifica griglia proposte TB

In `src/pages/hr/HRTBRequestDetailPage.tsx`, sezione "Le tue proposte":

**Cambio classi grid** da:
```
grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4
```
a:
```
grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3
```

### Razionale
- 5 colonne su desktop (`lg`) → ogni card è ~20% più stretta, immagine quadrata di conseguenza più piccola.
- Mobile resta a 2 colonne (le card BravoCard sono già ottimizzate per quel breakpoint nel catalogo HR).
- `sm` resta a 3 per evitare card troppo strette su tablet.
- `gap-3` (12px) invece di `gap-4` (16px) per coerenza con la densità maggiore.

### Cosa NON cambia
- `BravoCard` resta invariato: l'`aspectRatio="square"` adatta automaticamente l'altezza dell'immagine alla nuova larghezza colonna.
- Nessun altro file toccato.
- Skeleton di caricamento resta a `sm:grid-cols-2 lg:grid-cols-3` (è un placeholder generico, non vale la pena allinearlo all'esatta colonnatura finale).

### Verifica
- Visual check su `/hr/team-building/:id` con almeno 5 proposte per vedere la riga piena.
- Verifica che meta items (categoria · durata · partecipanti) restino leggibili a larghezza ridotta — se overflow, valutare in implementazione se ridurre a 2 meta item per card (categoria + durata).