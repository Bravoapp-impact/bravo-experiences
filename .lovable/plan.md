## Cosa registrare

Verificato il `log.md`: le entry 2026-05-19 coprono già **ICS in conferma**, **Suggerimenti ETS** (pubblico + sezione HR) e **Notifica responsabile** (backend + UI). L'unica feature non loggata è la #1 (foto esperienze passate lato dipendente). Il `Debito tecnico noto` in `aperto.md` ha già una voce "Galleria dipendente: visibilità parziale" parzialmente superata da questa feature, e una "Galleria HR: upload e filtri da rifinire" che va arricchita.

## Modifiche proposte

### 1. `docs/log.md` — nuova entry in cima a "Entries"

Inserire **prima** dell'entry `2026-05-20` (l'unica più recente), con data `2026-05-19`:

```markdown
### 2026-05-19 — Foto esperienze passate nel dettaglio esperienza dipendente

**Contesto.** Le foto della galleria aziendale (caricate/approvate dall'HR) non
erano esposte al dipendente in nessuna parte dell'app: visibilità parziale nota
in `aperto.md`. Mostrarle dentro la scheda esperienza è il punto naturale —
crea social proof prima della prenotazione e usa infrastruttura già pronta
(`gallery_photos`, signed URLs, lightbox, image dimensions hook).

**Cosa cambia.**
- Nuovo componente `ExperiencePhotosSection` nel dettaglio esperienza employee:
  album in righe (`react-photo-album`) + lightbox condivisa con la galleria HR.
- Nuovo hook `useExperiencePhotosForEmployee(experienceId, companyId)` che
  carica solo foto `status=approved` della company corrente per l'esperienza.
- Sezione che si auto-nasconde quando non ci sono foto approvate (esperienze
  attivate per la prima volta non mostrano stato vuoto).
- Riuso di `useSignedPhotoUrls` e `useImageDimensions` già esistenti.

**Impatto.** `UI` · `Dettaglio esperienza employee`

**File / aree toccate.**
- `src/components/experience-detail/ExperiencePhotosSection.tsx` (nuovo)
- `src/hooks/queries/gallery/useExperiencePhotosForEmployee.ts` (nuovo)
- `src/components/experience-detail/ExperienceDetailContent.tsx` (inserimento sezione)

**Follow-up.** Resta aperta la vista galleria aziendale completa (tutte le
esperienze in un'unica pagina) — vedi `aperto.md`.
```

### 2. `docs/aperto.md` — sezione "Debito tecnico noto"

**a)** Aggiornare la voce esistente **"Galleria dipendente: visibilità parziale"** per riflettere che le foto nel dettaglio esperienza sono ora coperte e resta aperta solo la vista aggregata:

```markdown
**Galleria dipendente: vista aggregata mancante.** Le foto della galleria
aziendale sono ora visibili al dipendente nel dettaglio della singola
esperienza (sezione "Foto delle esperienze passate"). Resta da decidere se e
dove esporre una vista aggregata cross-esperienza della galleria aziendale
(tab dedicato, pagina dedicata, sezione in `/app/impact`).
```

**b)** Aggiungere **tre nuove voci** in cima alla sezione (sono frizioni attuali, alta urgenza):

```markdown
**Galleria HR: caricamento pagina lento/instabile.** La pagina `/hr/galleria`
si carica male — tempi lunghi e/o stato intermedio confuso. Da profilare
(probabili N+1 su signed URL e/o moderazione, immagini non lazy-loaded,
fetch non paginato). Frizione reale percepita dall'HR.

**Galleria HR: upload e filtri da rifinire.** Upload diretto HR funzionante
ma migliorabile (drag-and-drop avanzato, batch più grandi, retry parziali,
naming intelligente, edit metadata in-line). Il **filtro per esperienza** è
oggi poco usabile e va ripensato (selezione multipla, ricerca rapida,
raggruppamento per associazione). Mancano filtro per associazione,
per uploader, per stato (`hidden` vs `approved`), per "featured", e ricerca
testuale su caption. *Sostituisce la voce precedente con stesso titolo.*

**Pagina "ETS suggeriti" HR: tabella e storico da rifinire.** La tabella
attuale (`HRSuggestionsPage`) funziona ma è da migliorare: gestione
dello **storico/archiviati** poco evidente (oggi gli archiviati restano
mescolati nella stessa tabella), manca un tab/segmento dedicato, manca
ordinamento per colonna e densità configurabile. Frizione reale appena
arriveranno più di una manciata di suggerimenti per company.
```

(La vecchia voce "Galleria HR: upload e filtri da rifinire" viene sostituita dalla nuova, più specifica.)

### 3. Nessuna modifica a `architettura.md`

La feature dipendente non introduce nuove tabelle, RLS, RPC o edge function — riusa l'infrastruttura `gallery_photos` già documentata. Nessun update necessario.

## Cosa NON cambia

- Nessuna modifica al codice applicativo
- Nessuna modifica a schema DB, RLS, edge function
- Le altre entry del log restano invariate
- Le altre voci di `aperto.md` restano invariate

Confermi e procedo con le scritture?