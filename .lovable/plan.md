## Contesto

Il componente condiviso `ExperienceDetailContent` **non contiene** né il pulsante back né la CTA mobile: quegli elementi vivono nelle pagine wrapper. Esistono tre wrapper con pattern simili:

- `src/pages/ExperienceDetail.tsx` (employee) — già aggiornato oggi: freccia tonda + CTA "Vedi date disponibili" flottante con shadow, senza barra bianca.
- `src/pages/hr/HRExperienceDetail.tsx` — back come link testuale "← Torna al volontariato", nessuna CTA mobile.
- `src/pages/association/AssociationExperienceDetail.tsx` — back come link testuale "← Torna alle esperienze" + CTA mobile "Modifica esperienza" ancora con barra bianca fissa (`bg-background/95 backdrop-blur-sm border-t`).

Quindi **non** modifichiamo `ExperienceDetailContent`; armonizziamo i due wrapper rimanenti e poi aggiorniamo i documenti.

## Modifiche al codice

### 1. `src/pages/hr/HRExperienceDetail.tsx`
Sostituire il back-link testuale (~righe 261-267) con il pulsante tondo icon-only:
```tsx
<button
  onClick={goBack}
  aria-label="Indietro"
  className="flex items-center justify-center h-10 w-10 rounded-full bg-muted hover:bg-muted/70 transition-colors mb-6"
>
  <ArrowLeft className="h-5 w-5 text-foreground" />
</button>
```
Nessuna CTA mobile da aggiungere (pagina HR read-only).

### 2. `src/pages/association/AssociationExperienceDetail.tsx`
- Sostituire il back-link testuale (~righe 286-292) con lo stesso pulsante tondo. Il `Badge` di status resta a destra nel flex header.
- Sostituire la CTA mobile (~righe 327-335) con il pattern flottante:
```tsx
<div className="fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none">
  <Button
    onClick={() => setDrawerOpen(true)}
    className="pointer-events-auto w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-primary/25"
  >
    <Pencil className="h-4 w-4 mr-2" />
    Modifica esperienza
  </Button>
</div>
```

## Modifiche alla documentazione

### 3. `docs/log.md` — nuova entry in cima
Entry datata oggi che riassume la sessione:
- Allineato `CompletedExperiences` allo stile pagina Impostazioni (freccia tonda + titolo unificato, rimosso sottotitolo).
- Ridotto padding laterale `/app/experiences/:id` per allinearlo alle altre pagine.
- Convertita CTA mobile "Vedi date disponibili" da barra fissa bianca a bottone largo sospeso con shadow.
- Sostituita freccia "Torna al catalogo" con pulsante tondo icon-only.
- Armonizzati `HRExperienceDetail` e `AssociationExperienceDetail` agli stessi pattern (freccia tonda + CTA flottante dove presente).
- Impatto: `UI` · `Docs`.

### 4. `docs/design-system.md` — nuova sotto-sezione
Aggiungere una breve sezione "Pattern pagine di dettaglio" che documenti:
- **Back button standard**: pulsante tondo `h-10 w-10 rounded-full bg-muted`, solo `ArrowLeft`, `aria-label="Indietro"`, `mb-6`. Adottato da Settings sub-pages, `CompletedExperiences`, e tutti i wrapper di dettaglio esperienza (employee/HR/association).
- **Mobile sticky CTA — "bottone largo sospeso"**: wrapper `fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none`, button `pointer-events-auto w-full h-12 rounded-xl shadow-lg shadow-primary/25`. **Niente** barra bianca/blur/border-top sopra. Il `bottom-20` tiene il bottone sopra la `BottomNavigation`.

### 5. Memoria progetto
Creare `mem://style/detail-page-patterns` con lo stesso contenuto sintetico dei due pattern sopra, e aggiungere la reference in fondo alla sezione "## Memories" di `mem://index.md` (preservando tutte le voci esistenti).

## Out of scope
- `ExperienceDetailContent` non viene toccato.
- Nessuna modifica logica/dati.
- Nessun aggiornamento ad `architettura.md`/`principi.md` (cambi solo UI, niente DB/RLS/RPC/edge).
