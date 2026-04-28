
# Piano: refactor pagine dettaglio TB sul pattern del volontariato (v2)

## Obiettivo

Estrarre un componente condiviso `TBFormatDetailContent` ("pure presentation") e ridurre `TBFormatDetailPage` (super-admin) e `HRTBProposalDetailPage` (HR) a wrapper sottili che si occupano solo di fetching e di passare la sidebar slot specifica del ruolo. Stesso pattern già adottato per il volontariato con `ExperienceDetailContent`.

---

## Regola architetturale: main vs sidebar

Una sola regola, applicata a entrambi i ruoli:

- **Main** = contenuto del format: cosa si fa, dove, con chi. È condiviso e identico per ruolo, le sezioni sono governate solo dalla presenza del dato.
- **Sidebar** = pannello operativo: azioni + metadati operativi specifici del ruolo. Non duplica nulla del main.

Risultato:

| Sezione | Main | Sidebar super-admin | Sidebar HR |
|---|---|---|---|
| Descrizione, tag, SDG, servizi inclusi/extra | sì | — | — |
| Città disponibili, associazioni erogabili | sì (super-admin) / no (HR) | — | — |
| Range prezzo, status, created_at | — | sì | — |
| CTA Modifica / Cambia status / Elimina | — | sì | — |
| CTA Mi interessa / Non mi interessa | — | — | sì |

Niente duplicazioni tra main e sidebar.

---

## File nuovi

### 1. `src/components/tb-format-detail/TBFormatDetailContent.tsx`

Pure presentation, nessun fetch, nessun conditional sul ruolo. Layout modellato su `ExperienceDetailContent`:

- Hero split-screen (immagine 55% / header 45% centrato verticalmente). Riusa `HeroImage` da `experience-detail/`.
- Two-column: main (flex-1) + `sidebarSlot?: ReactNode` sticky a 380px su `lg`.
- Sezioni del main avvolte in motion.div + Separator, **renderizzate solo se i dati arrivano**:
  - Descrizione → `WhatYouWillDo title="Cosa farete"`
  - `TagsSection` (riusato così com'è)
  - `SdgSection` (riusato così com'è)
  - "Servizi inclusi" (CheckCircle list) — renderizzata se `services.length > 0`
  - "Servizi extra" (PlusCircle list) — renderizzata se `extraServices?.length > 0`
  - "Città disponibili" (badge list, oppure "Disponibile in tutta Italia") — renderizzata se `cities` o `nationwide` valorizzati
  - "Associazioni erogabili" (grid loghi) — renderizzata se `associations?.length > 0`

Props:
```ts
interface TBFormatDetailContentProps {
  format: {
    id; title; description; image_url;
    category_name; location_type;
    duration_hours; participants_min; participants_max;
    sdgs; secondary_tags;
  };
  services?: string[];
  extraServices?: string[];
  cities?: { id; name }[];
  nationwide?: boolean;
  associations?: { id; name; logo_url }[];
  headerExtras?: ReactNode;       // slot inline nel header (es. badge status super-admin)
  sidebarSlot?: ReactNode;        // sidebar destra desktop
  mobileDrawerSlot?: ReactNode;   // sticky bottom mobile
}
```

Il content **non sa nulla del ruolo**. Decide solo "se ho il dato lo mostro".

### 2. `src/components/tb-format-detail/TBFormatHeader.tsx`

Modellato su `ExperienceHeader`. Mostra titolo, descrizione breve troncata (~180 char), meta inline (categoria · partecipanti · durata · location_type). Niente rating/recensioni (i format non ne hanno).

Props (allineate al naming del content):
```ts
interface TBFormatHeaderProps {
  title; categoryName; description;
  locationType; durationHours;
  participantsMin; participantsMax;
  headerExtras?: ReactNode;   // stesso nome usato dal parent
}
```

Il super-admin passa qui i badge "Pubblicato/Bozza/Archiviato" + data creazione. L'HR passa nulla.

---

## File modificati

### 3. `src/components/experience-detail/WhatYouWillDo.tsx`

Aggiunta prop opzionale `title?: string` con default `"Cosa farai"`. Logica di troncamento "mostra altro" invariata. Tutti i call site attuali continuano a funzionare senza modifiche (passano implicitamente il default). I format TB lo invocano con `title="Cosa farete"`.

### 4. `src/pages/super-admin/TBFormatDetailPage.tsx` — refactor a wrapper

- Mantiene **identico** il fetching attuale (`fetchAll` con tutte le Promise.all su `tb_formats`, `categories`, `cities`, `associations`, `tb_format_cities`, `tb_format_associations`).
- Mantiene **identica** tutta la mutation logic: `handleStatusChange` con `validateFormatPublish`, `handleDelete` (con cleanup junction tables), `TBFormatEditDialog` con `onSuccess → fetchAll()`, `AlertDialog` di delete.
- Renderizza `<TBFormatDetailContent>` passando: `format`, `services`, `extraServices`, `cities`, `nationwide`, `associations`, `headerExtras` (badge status + `Creato il …`), `sidebarSlot` (vedi sotto), `mobileDrawerSlot` (vedi sotto).
- **Sidebar slot desktop** (Card sticky 380px): `MetricRow` con range prezzo · status · created_at, poi i CTA "Modifica" (default), cambio status condizionato su `formatData.status` (Pubblica / Archivia / Riporta in bozza, variant outline), "Elimina" (variant destructive ghost).
- **Mobile drawer slot** (sticky bottom, backdrop-blur, safe-area-inset-bottom):
  - CTA primario full-width: "Modifica" (apre `TBFormatEditDialog`)
  - Pulsante kebab a destra che apre un `DropdownMenu` con: voce di cambio status corrente (es. "Pubblica"), "Elimina" (variant destructive)
- I dialog (`TBFormatEditDialog`, `AlertDialog` delete) restano montati nel wrapper, fuori dal content.

### 5. `src/pages/hr/HRTBProposalDetailPage.tsx` — refactor a wrapper

- Mantiene **identico** il fetch via `get_tb_proposal_details` e la mutation `updateStatus` su `tb_proposals` (con `client_decision_at` e invalidate query).
- Renderizza `<TBFormatDetailContent>` passando **solo**: `format` + `services`. Niente `cities`, niente `associations`, niente `extraServices`, niente `headerExtras`. Le rispettive sezioni semplicemente non si renderizzano (difesa in profondità: i dati sensibili non arrivano nemmeno al componente, perché la RPC non li espone).
- Categoria già nella meta inline (è un campo della RPC).
- Back button "Torna alle proposte" in alto a sinistra → `/hr/team-building/{requestId}`.
- **Sidebar slot desktop** (Card sticky 380px "Cosa ne pensi?"):
  - Microcopy breve.
  - CTA "Mi interessa": `variant="default"` se `isInterested`, altrimenti `outline`. Toggle: clic quando già interested → torna a `pending`.
  - CTA "Non interessato": `variant="ghost"`. Quando già `declined`, diventa "Annulla scelta".
  - Link testuale in fondo "Torna alle proposte" → `/hr/team-building/{requestId}`.
- **Mobile drawer slot** (sticky bottom, backdrop-blur, safe-area-inset-bottom):
  - **Due bottoni impilati**, full-width entrambi.
  - Sopra: "Mi interessa" (`variant="default"` se interested, altrimenti `outline`, full-width, h-12).
  - Sotto: "Non mi interessa" (`variant="ghost"`, full-width). Quando `declined`, diventa "Annulla scelta".
  - Niente affiancamento: a 380px il testo "Non interessato" + icona si schiacciano. Impilati = leggibili e touch-friendly.

---

## Sotto-componenti riusati così come sono (da `experience-detail/`)

- `HeroImage` — usato nello split-hero del nuovo content
- `TagsSection` — invariato
- `SdgSection` — invariato
- `WhatYouWillDo` — riusato, con la nuova prop `title` opzionale (retrocompatibile)

**Nessun duplicato** sotto `tb-format-detail/`. Non riusiamo `ExperienceHeader` perché i format TB hanno meta diverse (no rating, sì range partecipanti) → giustifica il nuovo `TBFormatHeader`.

---

## Naming delle prop (allineato)

Una sola convenzione, end-to-end:

- `headerExtras` su `TBFormatDetailContent` (passato al child header)
- `headerExtras` su `TBFormatHeader` (slot inline accanto al titolo/meta)
- `sidebarSlot` su `TBFormatDetailContent` (desktop sticky)
- `mobileDrawerSlot` su `TBFormatDetailContent` (mobile sticky bottom)

Lo stesso identico naming di `ExperienceDetailContent` per `sidebarSlot` / `mobileDrawerSlot`. Niente alias, niente "extras" da una parte e "headerExtras" dall'altra.

---

## Strategia super-admin vs HR

Approccio scelto: **passaggio condizionato dei dati a monte**, niente flag booleani sulle sezioni.

Motivazione:
- Coerente col pattern di `ExperienceDetailContent` (slot opzionali, rendering data-driven).
- Mantiene il content davvero "pure presentation": non sa nulla del ruolo.
- Difesa in profondità: in HR i dati sensibili (prezzi, associazioni, città) non arrivano nemmeno al componente perché la RPC `get_tb_proposal_details` non li espone.
- Il super-admin passa tutto perché il fetch diretto sulle tabelle li ha disponibili.

---

## Cosa rischia di rompersi nel refactor di TBFormatDetailPage

Pagina già funzionante. Punti di attenzione:

1. **Pubblicazione con validazione** (`validateFormatPublish` su `linkedCityIds.length` / `linkedAssociationIds.length`): resta nel wrapper, non si sposta nel content. Test manuale: pubblicare format con campi mancanti → toast con elenco campi.
2. **Cambio status** (draft ↔ published ↔ archived): i 3 bottoni condizionati su `formatData.status` vivono nella sidebar slot del wrapper.
3. **Edit dialog**: resta montato nel wrapper, fuori dal content. `onSuccess → fetchAll()` per ri-render con dati nuovi.
4. **Delete dialog**: cleanup `tb_format_cities` e `tb_format_associations` prima del delete del format. Logica invariata.
5. **Loading e NotFound**: restano nel wrapper, prima di renderizzare il content.
6. **Back navigation**: `/super-admin/team-building/formats` invariato.
7. **Layout hero**: cambia da `aspect-[16/10]` a `aspect-[4/3] lg:aspect-square` per allinearsi a `HeroImage` del volontariato. Cambio visivo voluto ed esplicitamente richiesto ("stesso layout hero del volontariato"). Da segnalare nel changelog.
8. **Posizione del prezzo**: oggi nella riga meta del header, dopo il refactor sta nella sidebar. Voluto, ma da menzionare per evitare che sembri una regressione.

Il fetching, le mutation e le validazioni **non vengono toccati**. Solo la presentazione viene riorganizzata.

---

## Riepilogo file

| File | Tipo | Note |
|---|---|---|
| `src/components/tb-format-detail/TBFormatDetailContent.tsx` | nuovo | Pure presentation, slot-based, no role logic |
| `src/components/tb-format-detail/TBFormatHeader.tsx` | nuovo | Header senza rating, con range partecipanti, slot `headerExtras` |
| `src/components/experience-detail/WhatYouWillDo.tsx` | modificato | Prop `title` opzionale, retrocompatibile |
| `src/pages/super-admin/TBFormatDetailPage.tsx` | refactor | Wrapper sottile + sidebar/drawer admin (Modifica + kebab) |
| `src/pages/hr/HRTBProposalDetailPage.tsx` | refactor | Wrapper sottile + sidebar/drawer HR (2 bottoni impilati su mobile) |

Nessuna modifica a: `ExperienceDetailContent`, `ExperienceHeader`, `HRExperienceDetail`, `ExperienceDetail`, RPC, RLS, schema DB.
