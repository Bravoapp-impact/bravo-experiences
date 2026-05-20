# Log

Il diario delle modifiche al sistema. Una entry per **sessione di lavoro** non banale, in **ordine cronologico inverso** (la più recente in alto).

Serve per ricostruire il "perché" di una scelta a mesi di distanza, e per tenere allineati `architettura.md` e `principi.md` con quello che è realmente in produzione.

---

## Quando si scrive una entry

**Sì:** modifiche a schema DB, RLS, RPC, edge function, nuove feature UI rilevanti, copy importanti, modifiche al design system, refactor non banali, fix di sicurezza, decisioni di prodotto applicate al codice.

**No:** typo, rename file, fix UI minori senza impatto funzionale, riformattazioni.

Una entry copre **una sessione di lavoro** — anche se contiene più modifiche correlate, restano in un'unica voce.

## Come si scrive una entry

Si copia il template, lo si compila in cima alla sezione "Entries", si separa dalla precedente con `---`. Tutti i campi sono obbligatori: se un campo non si applica, si scrive esplicitamente `—` (così è chiaro che è stato considerato).

Se la sessione tocca DB, RLS, RPC o edge function, ricordarsi di aggiornare anche `architettura.md`.

## Template entry

```markdown
### YYYY-MM-DD — Titolo sintetico

**Contesto.** Perché questa modifica. 1-3 righe sul bisogno o problema.

**Cosa cambia.**
- Bullet 1
- Bullet 2

**Impatto.** `DB schema` · `RLS` · `RPC` · `Edge function` · `UI` · `Email` · `Auth` · `Docs`

**File / aree toccate.**
- path/o/area

**Follow-up.** Cose lasciate aperte, oppure `—`.
```

---

## Entries

### 2026-05-20 — Migrazione dialog super-admin al componente `ExperienceFormFields` unificato — Passo 3 di 3

**Contesto.** Chiusura del refactor in 3 passi: Step 1 ha creato il componente unificato, Step 2 ha migrato il form ETS, questo step migra il dialog inline del super-admin. Risultato: i campi di un'esperienza vivono **in un solo posto** (`ExperienceFormFields`), con due wrapper sottili (ETS / super-admin). Niente più drift fra i due form.

**Cosa cambia.**
- `src/pages/super-admin/ExperiencesPage.tsx`: rimosso tutto il dialog inline (state `formData`, `suggestedSdgs`, handler `handleSDGToggle`/`handleTagToggle`/`handleCategoryChange`/vecchio `handleSave`, ~270 righe di JSX duplicato). Sostituito con `<SuperAdminExperienceFormBody>`, sub-component locale che istanzia `useForm` con `superAdminExperienceSchema` (estensione di `experienceSchema` con `association_id` e `location_type` obbligatori) e delega i campi a `<ExperienceFormFields mode="super_admin" form={form} />`.
- Lo `status` resta gestito in state locale del wrapper (è metadata di pubblicazione, non un campo descrittivo dell'esperienza).
- Il payload super-admin ora include anche `default_hours` (1–24, intero) e `short_description`, prima assenti dal dialog super-admin.
- **Upload immagine ora coerente.** Il dialog super-admin prima passava `entityId={selectedExperience?.id}` a `LogoUpload`: in fase di creazione (id ancora `undefined`) l'upload era di fatto rotto. Il nuovo componente unificato chiama `LogoUpload` senza `entityId` (bucket `experience-images`), allineando il comportamento a quello dell'ETS e sbloccando l'upload anche da super-admin in creazione.
- Rimosso il riquadro "SDGs suggeriti per questa categoria" (basato su `categories.default_sdgs`): non era previsto nel componente unificato. Se decideremo che è una feature da preservare, andrà aggiunta in `ExperienceFormFields` e quindi disponibile anche per l'ETS.

**Esplicitamente fuori scope.** Nessuna modifica a `ExperienceFormFields.tsx`, nessuna modifica al form ETS, nessuna modifica DB. Resta in piedi il debito noto già tracciato in `docs/aperto.md`: la colonna `experiences.max_participants` va droppata con una migration dedicata ora che entrambi i form non la scrivono più.

**Nota su `short_description`.** Il payload include `short_description` come fa già il form ETS dallo Step 2. La colonna corrispondente in `public.experiences` non è ancora presente in DB: è un'incoerenza nota che impatta entrambi i form allo stesso modo e va risolta con una migration `ALTER TABLE experiences ADD COLUMN short_description TEXT;` (voce da aggiungere in `docs/aperto.md` se non già presente). Questo step si limita a non aumentare il drift.

**File toccati.**
- `src/pages/super-admin/ExperiencesPage.tsx`
- `docs/log.md`

**Verifica.** `tsc --noEmit` pulito. Smoke test manuale super-admin: creare nuova esperienza con tutti i campi (inclusi SDG/secondary_tags/location_type), modificarne una esistente, verificare upload immagine in creazione.

---

### 2026-05-20 — Migrazione form ETS al componente `ExperienceFormFields` unificato — Passo 2 di 3

**Contesto.** Step 1 ha creato il componente unificato `ExperienceFormFields` (vedi entry sotto). Questo step migra il form ETS reale (`src/components/association/ExperienceForm.tsx`) a wrappare quel componente, e pulisce tutti i lettori frontend di `experiences.max_participants` (che ora vive solo su `experience_dates`).

**Cosa cambia.**
- `ExperienceForm.tsx` riscritto da zero come wrapper sottile: istanzia `useForm` con `experienceSchema` + `zodResolver`, delega i campi a `<ExperienceFormFields mode="association" form={form} />`, gestisce solo submit + reset + bottone footer. Rimosso tutto il vecchio `useState` per singoli campi, validation custom, gestione upload immagine fai-da-te.
- `CreateExperienceDialog.tsx` aggiornato per ricevere il nuovo shape `ExperienceFormData` (snake_case), risolve i nomi legacy `category`/`city` con lookup-by-id su categories/cities, **non scrive più `max_participants`** né in insert né in update, scrive ora `short_description` e `default_hours`.
- `AssociationExperiencesPage.tsx`: `handleDuplicate` non copia più `max_participants`; rimosso campo dall'interfaccia `Experience` locale.
- `AssociationExperienceDetail.tsx`: rimosso `max_participants` da `ExperienceWithStatus` e dal payload passato a `CreateExperienceDialog`; aggiunto `short_description`. A `ManageDatesDialog` ora viene passato `defaultMaxParticipants={null}` (il dialog usa `|| 10` come fallback).
- `AssociationPublicProfile.tsx`: rimosso `max_participants` da query, mapping, interfaccia `ExperienceData` e card; rimosso l'icona `Users` (non più usata).

**Nuovi campi esposti all'ETS.** `short_description` (max 150) e `default_hours` (1–24, intero), entrambi mancanti nel vecchio form.

**Decisione su `experiences.max_participants`.** Lo schema DB resta invariato. La colonna verrà droppata con una migration dedicata **dopo** lo Step 3 (migrazione del dialog super-admin), una volta verificato in produzione che nessuno la legga né la scriva più. Voce aggiunta in `docs/aperto.md` → "Debito tecnico noto".

**Esplicitamente fuori scope.** Non toccato il dialog inline super-admin (`ExperiencesPage.tsx`) — è lo Step 3. Non toccato `experience_dates.max_participants` né i suoi lettori (`ManageDatesDialog`, `HRCalendarPage`, `ExperienceCardRich`, calendari): è un altro campo, su altra tabella, e resta.

**File toccati.**
- `src/components/association/ExperienceForm.tsx` (riscritto)
- `src/components/association/CreateExperienceDialog.tsx`
- `src/pages/association/AssociationExperiencesPage.tsx`
- `src/pages/association/AssociationExperienceDetail.tsx`
- `src/components/association/AssociationPublicProfile.tsx`
- `docs/log.md`, `docs/aperto.md`

**Verifica.** Build TypeScript pulita. Smoke test manuale ETS: creare nuova esperienza, modificarne una esistente, verificare salvataggio di `short_description` e `default_hours`, verificare che la card del profilo pubblico ETS non mostri più il numero max partecipanti.

---


### 2026-05-20 — Componente unificato `ExperienceFormFields` (step 1/3)

**Contesto.** Oggi i campi di un'esperienza di volontariato vivono duplicati in due form divergenti: `src/components/association/ExperienceForm.tsx` (ETS, ha `max_participants` e upload immagine fai-da-te) e il dialog inline in `src/pages/super-admin/ExperiencesPage.tsx` (super-admin, ha `sdgs`, `secondary_tags`, `location_type`, `association_id`). Inoltre la colonna `experiences.short_description` esiste in DB ma nessuno dei due form la espone. Ogni volta che si aggiunge un campo c'è il rischio di toccare un form e dimenticare l'altro.

**Cosa cambia.** Creato `src/components/experiences/ExperienceFormFields.tsx`: componente "controllato dall'esterno" che rappresenta il **superset** dei campi esperienza. Usa `react-hook-form` + `zod` (schema unico esportato come `experienceSchema`) e una prop `mode: "association" | "super_admin"` per filtrare i campi solo super-admin (`association_id`, `sdgs`, `secondary_tags`, `location_type`). I campi comuni includono finalmente `short_description` (max 150) e `default_hours` (1–24, intero). Carica autonomamente categorie/città/associazioni via `useQuery` con key `[entity, "list"]` e `staleTime` 10min. Per l'upload immagine riusa `LogoUpload` con bucket `experience-images`. Per i toggle SDG/tag riusa il pattern badge già adottato in `TBFormatEditDialog`. **Non è integrato in nessuna pagina**: in questo step ci limitiamo a far compilare il file e a tenere il componente come "API stabile" per gli step successivi.

**Esplicitamente fuori scope.** Nessuna modifica a `ExperienceForm.tsx`, nessuna modifica al dialog super-admin, nessuna modifica DB. Il campo `max_participants` è volutamente **assente** dal nuovo componente: nel nuovo modello vive solo su `experience_dates.max_participants`. La colonna `experiences.max_participants` resta in vita finché entrambi i form non sono migrati.

**Piano di migrazione in 3 step.**
- **Step 1 (fatto):** creato `ExperienceFormFields` isolato.
- **Step 2 (prossimo):** migrare `ExperienceForm.tsx` (ETS) a wrappare `ExperienceFormFields` con `mode="association"`. Il wrapper conserva submit/upload/refresh lista.
- **Step 3 (successivo):** migrare il dialog inline in `ExperiencesPage.tsx` (super-admin) con `mode="super_admin"`. Dopo lo step 3 si può droppare `experiences.max_participants`.

**Verifica.** Build/typecheck sul nuovo file, nessuna integrazione runtime in questo step.

**File toccati.** `src/components/experiences/ExperienceFormFields.tsx` (nuovo).

---

### 2026-05-20 — Fix ricorsione RLS su profiles, sblocco update self-service

**Contesto.** Salvataggio `manager_email` dal profilo dipendente falliva con "Errore durante il salvataggio". I log Postgres mostravano `infinite recursion detected in policy for relation "profiles"`. Causa: la policy `Users can update own profile (no role/tenancy)` aveva tre subquery `SELECT ... FROM profiles WHERE id = auth.uid()` nella `WITH CHECK` per impedire al dipendente di modificare il proprio `role`/`company_id`/`association_id`. Ogni subquery riattivava la stessa policy. Tutti gli update self-service su `profiles` erano rotti dall'introduzione di quella policy, non solo `manager_email`: anche modifica nome (`ProfileEditForm`, `ProfileSettingsContent`, `SettingsProfile`) e avatar (`ProfileAvatarUpload`, idem) fallivano in silenzio per employee/HR/association_admin. Funzionavano solo gli update fatti dal super admin tramite la policy parallela `Super admins can update any profile`.

**Cosa cambia.**
- Nuova funzione `prevent_profile_self_tenancy_change()` SECURITY DEFINER, `SET search_path = public, pg_temp`, `REVOKE EXECUTE ... FROM PUBLIC`. Logica: se `auth.uid() = NEW.id` e l'utente non è super_admin, blocca con exception qualunque variazione di `role`, `company_id`, `association_id` (confronto `IS DISTINCT FROM`).
- Nuovo trigger `prevent_profile_self_tenancy_change_trg` BEFORE UPDATE ON `profiles` FOR EACH ROW.
- Nuova policy `Users can update own profile v2` con `USING (auth.uid() = id)` e `WITH CHECK (auth.uid() = id)` — niente subquery, niente ricorsione. L'invariante sui campi sensibili è garantita dal trigger.
- Rimossa la policy ricorsiva `Users can update own profile (no role/tenancy)`. Sequenza rispettata: trigger → nuova policy → drop vecchia.

**Impatto.** `DB` · `RLS` · `Profilo dipendente` · `Impostazioni HR/Association`

**File / aree toccate.**
- Migration: nuova funzione `prevent_profile_self_tenancy_change`, trigger `prevent_profile_self_tenancy_change_trg`, policy `Users can update own profile v2`, drop policy ricorsiva
- `docs/architettura.md` (riferimento al pattern trigger-per-invariante)

**Follow-up.** —

---



### 2026-05-19 — Foto esperienze passate nel dettaglio esperienza dipendente

**Contesto.** Le foto della galleria aziendale (caricate/approvate dall'HR) non erano esposte al dipendente in nessuna parte dell'app: visibilità parziale nota in `aperto.md`. Mostrarle dentro la scheda esperienza è il punto naturale — crea social proof prima della prenotazione e usa infrastruttura già pronta (`gallery_photos`, signed URLs, lightbox, image dimensions hook).

**Cosa cambia.**
- Nuovo componente `ExperiencePhotosSection` nel dettaglio esperienza employee: album in righe (`react-photo-album`) + lightbox condivisa con la galleria HR.
- Nuovo hook `useExperiencePhotosForEmployee(experienceId, companyId)` che carica solo foto `status=approved` della company corrente per l'esperienza.
- Sezione che si auto-nasconde quando non ci sono foto approvate (esperienze attivate per la prima volta non mostrano stato vuoto).
- Riuso di `useSignedPhotoUrls` e `useImageDimensions` già esistenti.

**Impatto.** `UI` · `Dettaglio esperienza employee`

**File / aree toccate.**
- `src/components/experience-detail/ExperiencePhotosSection.tsx` (nuovo)
- `src/hooks/queries/gallery/useExperiencePhotosForEmployee.ts` (nuovo)
- `src/components/experience-detail/ExperienceDetailContent.tsx` (inserimento sezione)

**Follow-up.** Resta aperta la vista galleria aziendale completa cross-esperienza — vedi `aperto.md`.

---

### 2026-05-19 — Notifica responsabile via email — UI

**Contesto.** Completata la feature backend del prompt precedente con i due punti di interazione UI: il dipendente popola `manager_email` nel proprio profilo, l'HR configura `manager_notification_advance_days` per tutta l'azienda dalle impostazioni di volontariato.

**Cosa cambia.**
- Nuovo componente `src/components/profile/ManagerEmailCard.tsx`: Card autonoma su `/app/profile` con campo email facoltativo, validazione zod (email valida o stringa vuota = NULL), bottone Salva visibile solo quando c'è una modifica. Aggiorna `profiles.manager_email` direttamente (RLS già permette al dipendente di modificare le proprie colonne non-sensibili).
- `src/pages/Profile.tsx`: aggiunta la card tra `ProfileEditForm` e `ChangePasswordCard`.
- `src/hooks/useAuth.tsx`: aggiunto `manager_email` all'interfaccia `Profile`.
- `src/pages/hr/settings/SettingsVolunteering.tsx`: nuova `SettingsSection` finale "Notifiche ai responsabili dei dipendenti" con input numerico 1–30 che salva via RPC `set_manager_notification_advance_days`. Spostato `separator={false}` dalla sezione "Configurazione" a quella nuova.

**Impatto.** `UI` · `Profilo dipendente` · `Impostazioni HR`

**File / aree toccate.**
- `src/components/profile/ManagerEmailCard.tsx`
- `src/pages/Profile.tsx`
- `src/hooks/useAuth.tsx`
- `src/pages/hr/settings/SettingsVolunteering.tsx`

**Follow-up.** Estensione opzionale del campo `manager_email` anche ai profili HR/super-admin/association_admin (oggi solo profilo dipendente).

---


### 2026-05-19 — Notifica responsabile via email — backend

**Contesto.** Le aziende chiedono di ridurre la frizione "il dipendente prenota volontariato ma il suo team non lo sa". Il dipendente può indicare un'email del responsabile nel proprio profilo; N giorni prima dell'evento (default 7, configurabile per company) parte una notifica neutra e minimal.

**Cosa cambia.**
- DB: `profiles.manager_email` (TEXT NULL, validazione formato solo lato app). `companies.manager_notification_advance_days` (INTEGER, default 7, CHECK 1–30). Esteso check su `email_logs.email_type` per accettare `manager_absence_notification`. Aggiornato trigger `protect_companies_hr_update` per proteggere il nuovo campo company (HR aggiorna solo via RPC).
- RPC: `set_manager_notification_advance_days(p_days)` SECURITY DEFINER, solo `hr_admin`, range 1–30.
- Template email: `manager-absence-notification.tsx` registrato nel registry. Copy neutra: chi, quando, in che orario, perché tipo di attività. Niente nome esperienza, niente ETS, niente luogo.
- Edge function: `send-manager-absence-notifications` (verify_jwt = false, auth dual-mode service-role/super_admin). Carica i booking confermati dei prossimi 30 giorni con una query sola e filtra client-side per finestra di advance days specifica della company. Gate: `manager_email` valorizzato, `status='confirmed'`, anti-duplicazione su `email_logs`, suppression pre-check.
- Cron: `send-manager-absence-notifications-daily` ogni giorno alle 08:00 UTC, stesso pattern degli altri job (auth via `email_queue_service_role_key` da vault).

**Impatto.** `DB schema` · `RPC` · `Edge function` · `Email` · `Docs`

**File / aree toccate.**
- `supabase/functions/_shared/transactional-email-templates/manager-absence-notification.tsx`
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- `supabase/functions/send-manager-absence-notifications/index.ts`
- `supabase/config.toml`
- `docs/architettura.md` §2.1 e §5
- `docs/transactional-emails.md`

**Follow-up.** UI per popolare `manager_email` nel profilo dipendente e `manager_notification_advance_days` nelle impostazioni HR — prossimo prompt.

### 2026-05-19 — Suggerimenti ETS — sezione HR

**Contesto.** Completata la feature suggerimenti ETS lato HR: ora l'HR può copiare/rigenerare il link pubblico e gestire i suggerimenti ricevuti dai dipendenti.

**Cosa cambia.**
- Nuova voce sidebar HR "Suggerimenti" (icona `Lightbulb`, sezione "Gestione" tra Galleria e Comunicazione).
- Nuova route `/hr/suggerimenti` → `HRSuggestionsPage`.
- Sezione "Link da condividere": input read-only con URL pubblico, bottoni "Copia link" (clipboard + toast) e "Rigenera" (AlertDialog di conferma → RPC `regenerate_suggestion_token`).
- Tabella suggerimenti ordinata `created_at DESC`, colonne: ETS (nome + città), suggeritore (nome + email `mailto:`), motivazione (troncata 80c con Tooltip), data, badge stato (`Nuovo`/`Visto`/`Archiviato`), azioni inline (Archive/ArchiveRestore).
- Click sul nome ETS di una riga `new` → mutation ottimistica `status='seen'`. Archivia/ripristina senza conferma (azioni reversibili).
- Hook query nuovi in `src/hooks/queries/suggestions/`: `useSuggestionsList`, `useCompanySuggestionToken`, `useUpdateSuggestionStatus` (con optimistic update), `useRegenerateSuggestionToken`.
- Layout flat (no Card wrapper), pattern `PageSection` + tabella shadcn con `bg-muted/50` sull'header.

**Impatto.** `UI` · `Docs` (nessuna nuova migration: schema, RLS e RPC già pronti dal prompt precedente).

**File / aree toccate.**
- `src/pages/hr/HRSuggestionsPage.tsx` (nuovo)
- `src/hooks/queries/suggestions/*` (nuovo)
- `src/components/layout/HRLayout.tsx`
- `src/App.tsx`
- `docs/architettura.md` (route `/hr/suggerimenti`)

**Follow-up.** In base al volume osservato in produzione, valutare: notifica email all'HR su nuovo suggerimento (digest settimanale se >10/sett), filtri/segmenti se la lista cresce.

---

### 2026-05-19 — Suggerimenti ETS dai dipendenti — endpoint pubblico

**Contesto.** Le aziende cercano modi strutturati per coinvolgere i dipendenti nella scelta degli ETS partner. Bravo! offre l'infrastruttura: un link che l'HR distribuisce internamente, e una bacheca suggerimenti che alimenterà i discovery call con il referente Bravo!.

**Cosa cambia.**
- Nuova tabella `association_suggestions` (suggested_name/city, suggester_name/email, reason, status `new`/`seen`/`archived`) con indice `(company_id, status, created_at DESC)`. RLS: super-admin full; HR SELECT/UPDATE solo della propria company; INSERT solo via service-role (edge function); niente DELETE. Trigger `protect_association_suggestions_columns` blocca l'HR a modificare solo `status`/`reviewed_at`/`reviewed_by`.
- `companies.suggestion_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid()`: backfill automatico delle righe esistenti via DEFAULT.
- Nuova policy UPDATE su `companies` per HR + trigger `protect_companies_hr_update` che vieta all'HR cambi diretti su qualsiasi colonna (suggestion_token incluso); l'unica via è la RPC `regenerate_suggestion_token` (SECURITY DEFINER, bypassa il trigger). RPC creata ma non esposta in UI in questo step.
- Nuova edge function `submit-association-suggestion` (`verify_jwt = false`, CORS aperto, rate limit 3/15min/IP). `GET ?token=` → `{ company_name }` o 404 neutro; `POST ?token=` con body validato (max length, regex email) → inserisce con service-role. Pattern copiato da `submit-access-request`.
- Nuova pagina pubblica `/suggerisci-ets/:token` (`PublicAssociationSuggestion.tsx`), standalone (fuori `ProtectedRoute`), mobile-first. Stati: loading / token invalido (messaggio neutro, no indizi sul motivo) / form / thank-you con CTA "Invia un altro suggerimento".

**Impatto.** `DB schema` · `RLS` · `RPC` · `Edge function` · `UI` · `Docs`

**File / aree toccate.**
- Migration: tabella `association_suggestions`, colonna `companies.suggestion_token`, policy `HR can update own company`, trigger `protect_*`, RPC `regenerate_suggestion_token`.
- `supabase/functions/submit-association-suggestion/index.ts` (nuovo), `supabase/config.toml`.
- `src/pages/PublicAssociationSuggestion.tsx` (nuovo), `src/App.tsx` (route pubblica).
- `docs/architettura.md` §2.5/§5/§6.

**Follow-up.**
- Prompt successivo: UI HR per visualizzare/archiviare i suggerimenti + bottone "rigenera link" che invoca `regenerate_suggestion_token`.
- Email/notifiche all'HR all'arrivo di un nuovo suggerimento: decidere dopo aver visto il volume reale.

---

### 2026-05-19 — Calendario nella conferma prenotazione

**Contesto.** L'email di conferma prenotazione non offriva nessun modo per portarsi l'evento sul calendario personale. Verificato che `sendLovableEmail` non accetta allegati binari (nessun campo `attachments` in `EmailSendRequest`, non in roadmap), quindi un `.ics` allegato è fuori discussione: serve servirlo da un endpoint pubblico e linkarlo.

**Cosa cambia.**
- Nuova edge function `booking-ics` (`verify_jwt = false`): legge `?booking_id=<uuid>`, valida UUID v4, carica booking + date + experience con service-role, restituisce un `.ics` minimal RFC 5545 (`SUMMARY`, `LOCATION`, `DTSTART`/`DTEND` UTC; niente `DESCRIPTION` né `VALARM` per non duplicare i reminder gestiti da `send-booking-reminders`). 404 neutro se booking non esiste, non è `confirmed`, o è già passato. Non-enumerazione affidata all'UUID v4 random (stesso pattern dell'unsubscribe-token).
- `send-booking-confirmation` aggiunge due campi al `templateData`: `googleCalendarUrl` (deep-link `calendar.google.com/calendar/render?action=TEMPLATE&...`) e `icsDownloadUrl` (`${SUPABASE_URL}/functions/v1/booking-ics?booking_id=...`).
- Template `booking-confirmation.tsx` mostra un nuovo blocco "Aggiungi al tuo calendario" subito dopo data+orario con i due link; `previewData` aggiornata di conseguenza.

**Impatto.** `Edge function` · `Email` · `Docs`

**File / aree toccate.**
- `supabase/functions/booking-ics/index.ts` (nuovo)
- `supabase/functions/send-booking-confirmation/index.ts`
- `supabase/functions/_shared/transactional-email-templates/booking-confirmation.tsx`
- `supabase/config.toml` (entry `[functions.booking-ics] verify_jwt = false`)
- `docs/transactional-emails.md` (paragrafo "Allegati e calendari"), `docs/architettura.md` §5

**Follow-up.**
- Se in futuro servirà servire documenti sensibili (fatture, export dati personali), sostituire l'UUID del booking con un token a scadenza dedicato.

---

### 2026-05-19 — HR: Calendario, Utenti, Galleria — prima ondata operativa

**Contesto.** Tre voci che erano `HRPlaceholderPage` (Calendario, Galleria) o pagina embrionale (Utenti) passano a feature reali nel pannello HR. Avanzamento dell'Ondata 2 di `aperto.md`.

**Cosa cambia.**
- **Calendario HR** (`/hr/calendario`): vista calendario aggregata sulle date di volontariato del programma attivato per l'azienda. Filtri laterali (`CalendarFiltersSidebar`), viste Month / Week / Day, popover di dettaglio giornata. RLS già coperta dalla `hr_view_experience_dates_v5` + funzione `hr_has_historical_booking_for_date`.
- **Utenti HR** (`/hr/users`): rinominata da "Dipendenti" a "Utenti" (terminologia inclusiva). Metriche, segmenti (Attivi / Da coinvolgere / Nuovi), funnel partecipazione, drill-down dialog per le partecipazioni del singolo utente. Build sopra `BookingsTable`, `EmployeeMetricsCards`, `EmployeeParticipationsDialog`. Resta single-vertical (solo volontariato), debito già tracciato in `aperto.md` §2.
- **Galleria HR** (`/hr/galleria`): galleria company-wide con `react-photo-album` (rows layout), lightbox, filtri (esperienze, range date), coda di moderazione (`ModerationQueueDialog`), bulk actions (selezione, download ZIP via `jszip`, eliminazione di massa con conferma), e upload diretto HR (`HRPhotoUploadDialog`) che bypassa la moderazione (auto-approved dal trigger DB `populate_gallery_photo_metadata` per `hr_admin`). Storage bucket `gallery-photos`. Tabella `gallery_photos` con stati `pending`/`approved`/`rejected`/`hidden`. Re-fetch via `invalidateQueries` per chiudere il bug "cancello ma resta visibile" (migration `20260519093314_*.sql`).

**Impatto.** `DB schema` · `RLS` · `UI` · `Storage` · `Docs`

**File / aree toccate.**
- `src/pages/hr/HRCalendarPage.tsx`, `src/components/hr/calendar/CalendarFiltersSidebar.tsx`, `src/components/calendar/*`
- `src/pages/hr/HREmployeesPage.tsx`, `src/components/hr/{EmployeeMetricsCards,EmployeeParticipationsDialog,BookingsTable}.tsx`
- `src/pages/hr/HRGalleryPage.tsx`, `src/components/hr-gallery/*` (GalleryFilters, GallerySelectionBar, HRPhotoUploadDialog, ModerationQueueDialog, PhotoLightbox)
- `src/hooks/queries/gallery/*` (useCompanyGallery, useBulk{Delete,Download}Photos, useHRUploadPhotos, useCompanyPastDates, useModeratePhotos, useUpdatePhotoStatus, useSignedPhotoUrls)
- Tabella `gallery_photos`, trigger `populate_gallery_photo_metadata`, bucket Storage `gallery-photos`, migration `20260519093314_*.sql`
- `package.json` (+ `jszip`, `browser-image-compression`)

**Follow-up.**
- Controparte super-admin della Galleria mancante (vedi `aperto.md` §2).
- Vista Galleria lato dipendente: oggi vede solo le proprie foto caricate, non la galleria aziendale approvata.
- Migliorie incrementali su upload e filtri della galleria HR.

---

### 2026-05-16 — Volontariato: modello esclusività a 2 assi + cleanup RLS

**Contesto.** Il modello di esclusività delle esperienze era ambiguo a livello DB: nessun vincolo impediva a un'esperienza `private` di avere più aziende nel bridge, le RLS HR/dipendente avevano bug (HR non vedeva date di esperienze private; dipendenti vedevano date riservate ad altre aziende), e HR aveva ancora INSERT/DELETE su `experience_companies` (residuo del modello in cui HR curava il catalogo). Lo `Switch "privata"` del `VisibilityDialog` non rifletteva nessuna delle decisioni reali.

**Cosa cambia.**
- Modello a 2 assi indipendenti formalizzato: asse esperienza (`experiences.visibility` = `public`/`private`) + asse data (`experience_dates.company_id` NULL o valorizzato). Caso d'uso target "canile alternato": esperienza `public` con date riservate ad aziende diverse (A il 1°/3° mercoledì, B il 2°/4°).
- RLS migrate in 2 blocchi (add-then-drop):
  - `hr_view_experience_dates_v5` (rimuove filtro `visibility = 'public'` di v4 che escludeva date di esperienze private; mantiene `experience_companies` + `company_id IS NULL OR my_company`)
  - `employees_view_dates_v3` (aggiunge `company_id IS NULL OR my_company`, fix bug v2 che mostrava date riservate ad altre aziende)
  - `association_manage_own_experience_dates_v2` (ETS gestisce proprie date, `WITH CHECK` impedisce di valorizzare `company_id`)
- Falla privilege escalation chiusa: rimosse `HR admin can activate/deactivate experiences for own company` su `experience_companies`. La curation è esclusivamente super-admin.
- Duplicate rimosse: `HR admin can view own company experience_companies`, `Admins can view all experience dates`, `Admins can view all experiences`.
- Trigger DB di consistenza: funzione `public.enforce_private_experience_single_company()` con 2 trigger gemelli — `enforce_private_single_company_on_bridge` (BEFORE INSERT su `experience_companies`) e `enforce_private_single_company_on_experiences` (BEFORE UPDATE OF visibility su `experiences`). Garantiscono `visibility = 'private'` ⇔ ≤1 azienda nel bridge. Messaggi di errore in italiano.
- UI: `VisibilityDialog` refactorato. Toggle "Condivisa"/"Esclusiva" al posto dello `Switch "privata"`. Esclusiva = RadioGroup single-select, azienda obbligatoria. Condivisa = Checkbox multi-select (0-N). Copy: "Visibilità e assegnazione", "Visibile a una sola azienda…" / "Visibile a tutte le aziende selezionate". Sequenza di salvataggio: DELETE bridge → UPDATE visibility → INSERT bridge, progettata per rispettare il trigger.

**Impatto.** `DB schema` · `RLS` · `UI` · `Docs`

**File / aree toccate.**
- `experience_dates`, `experience_companies`, `experiences` (policy + trigger + funzione)
- `src/components/super-admin/VisibilityDialog.tsx`
- `docs/volunteering.md`, `docs/architettura.md`

**Follow-up.** `src/pages/super-admin/ExperiencesPage.tsx` legge ancora `visibility === "private"` per i badge in tabella — funziona (i valori DB restano `public`/`private`), ma le etichette UI andrebbero rinominate in "Esclusiva"/"Condivisa" per coerenza con il nuovo copy del dialog.

---

### 2026-05-15 — UI: disattivate entry animations framer-motion (no flicker)

**Contesto.** Dopo l'introduzione degli skeleton (entry sotto) restava un micro-flicker percepibile: lo skeleton spariva e il contenuto vero entrava con `motion.*` (`initial opacity:0, y:10 → animate opacity:1`) presente in ~30 pagine. In quella frazione di secondo lo schermo "lampeggiava".

**Cosa cambia.**
- `src/App.tsx`: wrap globale `<MotionConfig reducedMotion="always">` da framer-motion. Tutti i `motion.*` esistenti saltano la transizione e vanno direttamente allo stato `animate` — niente fade-in iniziale, niente slide-in, niente delay a cascata.
- Hover/tap, animazioni di submit (spinner pulsanti), CSS keyframes (accordion, dialog, sheet) e `animate-pulse` degli skeleton restano invariati: non sono entry animations.
- Nessuna rimozione fisica dei `motion.*` dal codice: la scelta è reversibile in una riga.

**Impatto.** `UI`

**File / aree toccate.**
- `src/App.tsx`

**Follow-up.** Cleanup futuro opzionale: rimuovere fisicamente i `motion.*` di sole entry animation quando si toccano le rispettive pagine.

---

### 2026-05-15 — UI: skeleton al posto degli spinner full-screen

**Contesto.** L'app sfarfallava nei caricamenti: prima lo spinner del route guard, poi lo spinner della pagina, poi il contenuto. Richiesta esplicita di rimuovere gli spinner generici e mostrare uno **skeleton che anticipi la struttura della pagina sottostante**, così l'utente capisce che sta caricando senza interruzioni visive.

**Cosa cambia.**
- Nuovi componenti `src/components/common/skeletons/PageSkeleton.tsx` (varianti `list` / `table` / `detail` / `dashboard` / `form` / `grid`) e `AppBootSkeleton.tsx` (shell completo lato admin/sidebar oppure mobile/employee).
- Route guards (`ProtectedRoute`, `ProtectedHRRoute`, `ProtectedSuperAdminRoute`, `ProtectedAssociationRoute`) sostituiscono lo spinner centrato con `AppBootSkeleton` (role `admin` / `employee`).
- Migrate da `LoadingState` / `Loader2` full-page a `PageSkeleton`: **HR** (`HRHomePage`, `HRDashboard`, `HRExperiencesPage`, `HRTeamBuildingPage`, `HRTBProposalDetailPage`, `HRNewTBRequestPage`, `HREmployeesPage`), **Association** (`AssociationHome`, `AssociationExperiencesPage`, `AssociationHistoryPage`, `AssociationCalendarPage`, `AssociationProfilePage`), **Employee** (`Profile`, `MyBookings`).
- Spinner legittimi preservati: dentro pulsanti submit, upload in corso, azioni inline brevi.

**Impatto.** `UI` · `Design system`

**File / aree toccate.**
- `src/components/common/skeletons/{PageSkeleton,AppBootSkeleton}.tsx` (nuovi)
- `src/components/Protected{,HR,SuperAdmin,Association}Route.tsx`
- 14 pagine sopra elencate
- `docs/design-system.md` (nuova nota "Loading states")

**Follow-up.** Estendere il pattern alle pagine super-admin che eventualmente usano ancora `LoadingState`/spinner full-page (sweep secondario quando le si tocca).

---

### 2026-05-15 — HR: `/hr/experiences/:id` diventa puramente informativa

**Contesto.** Il modello di prodotto è cambiato: l'HR non cura più il catalogo, lo *vede*. La pagina di dettaglio esperienza HR conteneva ancora tutta la logica di curation (attivazione/disattivazione esperienza per la propria azienda) ereditata dal modello precedente.

**Cosa cambia.**
- `src/pages/hr/HRExperienceDetail.tsx`: rimossi `isActive`, `isToggling`, `drawerOpen`, `handleToggle`, `fetchActivation`, `HRMobileActionDrawer`, `HRRelatedExperiencesList` di curation. Resta solo la vista informativa.
- Sidebar dettaglio riportata a stile Airbnb (coerente col resto delle viste experience-detail).
- Nessuna azione HR di attivazione/disattivazione su `experience_companies`: la curation è in mano al team Bravo!.

**Impatto.** `UI` · `Prodotto`

**File / aree toccate.**
- `src/pages/hr/HRExperienceDetail.tsx`
- `src/components/hr/HRSidebar.tsx` (e componenti correlati al dettaglio)

**Follow-up.** —

---

### 2026-05-15 — HR: `/hr/volontariato` come vista unica del programma aziendale

**Contesto.** Stesso cambio di modello dell'entry sopra: l'HR non vede più "il catalogo Bravo! da cui scegliere" + "il proprio programma" + "le statistiche" come tab separati. Vede direttamente, in una sola pagina, **il programma di volontariato attivato per la sua azienda** dal team Bravo!. RLS lato DB già aggiornate (HR non può scrivere su `experience_companies`).

**Cosa cambia.**
- `src/pages/hr/HRExperiencesPage.tsx` riscritta: rimossi i 3 tab (Catalogo / Il mio programma / Statistiche), `handleActivate`/`handleDeactivate`, lo stato `activatedIds`, gli stati `statsExperiences`/`statsLoading`/`statsLoaded`. Singola lista delle esperienze attivate per l'azienda.
- Grid card: su `HRExperiencesPage` e `HRTeamBuildingPage` sostituito `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` con `grid-cols-[repeat(auto-fill,minmax(...))]` — cap dimensionale per evitare card troppo grandi su schermi larghi. Card volutamente un filo più grandi di quelle del catalogo employee (`/app/experiences`).
- `src/components/common/BravoCard.tsx`: titolo `text-[13px]` → `text-[15px]`.

**Impatto.** `UI` · `Prodotto`

**File / aree toccate.**
- `src/pages/hr/HRExperiencesPage.tsx`
- `src/pages/hr/HRTeamBuildingPage.tsx`
- `src/components/common/BravoCard.tsx`

**Follow-up.** Allineare `docs/volunteering.md` e `docs/architettura.md` se descrivono ancora HR come curatore (vedi questa stessa sessione).

---

### 2026-05-15 — UI: sweep finale Card→PageSection per tabelle/liste

**Contesto.** Secondo passaggio del refactor stile Attio: bonifica dei call-site rimasti che ancora avvolgono tabelle e liste in `<Card><CardHeader/><CardContent/>`. Riferimento visivo: `/super-admin/associations`. Le primitive (`ui/table.tsx`, `crud/CrudTableCard.tsx`, `crud/CrudTableRow.tsx`) erano già allineate, non serviva un nuovo componente "Table".

**Cosa cambia.**
- HR: `BookingsTable`, `TopPerformersTable`, `UpcomingEvents` → `PageSection` (no Card wrapper).
- Super Admin: `TBRequestsPage`, `TBFormatsPage`, `AccessCodesPage`, `ExperiencesPage`, `EmailSettingsPage` → `PageSection`. Header tabella allineato con `bg-muted/50`.
- Association: `AssociationHistoryPage` → lista "Date Passate" piatta, summary cards (metriche hero) restano `<Card>` per regola.

**Impatto.** `UI` · `Design system`

**File / aree toccate.**
- `src/components/hr/BookingsTable.tsx`, `src/components/hr/TopPerformersTable.tsx`, `src/components/hr/UpcomingEvents.tsx`
- `src/pages/super-admin/{TBRequestsPage,TBFormatsPage,AccessCodesPage,ExperiencesPage,EmailSettingsPage}.tsx`
- `src/pages/association/AssociationHistoryPage.tsx`
- `docs/design-system.md` (nota header tabella `bg-muted/50`)

**Follow-up.** Modali (`BookingDetailModal`, `FeedbackModal`, `ExperienceDateDialog`, `TBFormatEditDialog`, `VisibilityDialog`) e detail pages TB (`HRTBRequestDetailPage`, `HRTBProposalDetailPage`, `TBRequestDetailPage`, `TBFormatDetailPage`, `tb-quote-editor/*`) restano da bonificare. Pagine employee-facing (`Impact`, `Profile`) lasciate nello stile Airbnb attuale.

---

### 2026-05-15 — UI: rimozione card-wrapper a favore di layout piatto stile Attio

**Contesto.** Incongruenza visiva tra pagine "a riquadri" (HR Home, dashboard super-admin, liste con `<Card>` che wrappano una tabella) e pagine "piatte" (impostazioni profilo). Decisa una regola unica: la `<Card>` resta riservata ai blocchi che devono spiccare visivamente; tutto il resto va piatto sul background della pagina, separato da hairline e spacing.

**Cosa cambia.**
- Nuovo componente `src/components/common/PageSection.tsx` come alternativa flat a `<Card>` per liste/widget/sezioni di settings.
- `src/components/crud/CrudTableCard.tsx` riscritto: stesso nome e stessa API, ma non renderizza più il wrapper `<Card>` — solo header con hairline + content. Propaga il layout piatto a tutte le liste super-admin (Users, Companies, Associations, Experiences, TBFormats, TBRequests, AccessCodes, AccessRequests, Cities, Categories, EmailSettings).
- HR: `HRHomePage` (widget "Prossime iniziative" + "Riepilogo rapido"), `HREmployeesPage` (filtri + tabella utenti), `HRExperiencesPage` (filtri tab statistiche) — tutti appiattiti su background unico, divisori a linea.
- Super Admin: `UsersPage` rifatto a mano (non passava da `CrudTableCard`); `SuperAdminDashboard` "Azioni Rapide" appiattito.
- Association: `AssociationHome` widget appiattiti.
- Stessa regola applicata anche al dark theme (nessuna eccezione per il canvas).

**Impatto.** `UI` · `Design system`

**File / aree toccate.**
- `src/components/common/PageSection.tsx` (nuovo)
- `src/components/crud/CrudTableCard.tsx` (riscritto, no Card wrapper)
- `src/pages/hr/HRHomePage.tsx`, `src/pages/hr/HREmployeesPage.tsx`, `src/pages/hr/HRExperiencesPage.tsx`
- `src/pages/super-admin/UsersPage.tsx`, `src/pages/super-admin/SuperAdminDashboard.tsx`
- `src/pages/association/AssociationHome.tsx`

**Follow-up.** Sweep successiva su:
- HR: `HRTBRequestDetailPage`, `HRTBProposalDetailPage`, modali HR (`HRBookingsDialog`, `EmployeeParticipationsDialog`), `BookingsTable`, `TopPerformersTable`.
- Super Admin: `TBRequestDetailPage`, `TBFormatDetailPage`, `tb-quote-editor/*`, modali (`ExperienceDateDialog`, `TBFormatEditDialog`, `VisibilityDialog`).
- Association: `AssociationHistoryPage`, `AssociationPublicProfile`, modali condivisi (`BookingDetailModal`, `FeedbackModal`).
- `EmployeeMetricsCards`: tenere come MetricCard (numeri hero) ma verificare coerenza wrapper.

---

### 2026-05-13 — TB rollout: Step 1 + Step 2 (lista HR riprogettata)

**Contesto.** Avvio dell'implementazione del nuovo modello "bacheca accumulativa" descritto in `tb-flow.md`. Si parte dagli step abilitanti: DB additivo minimo (Step 1) e riprogettazione della lista HR `/hr/team-building` (Step 2).

**Cosa cambia.**
- **Step 1 (DB additivo, ✅):** aggiunta colonna `tb_requests.state` `GENERATED` (4 valori: `open`/`confirmed`/`completed`/`cancelled`, mappata da `status`); aggiunta `tb_proposals.is_active boolean NOT NULL DEFAULT true`; indici `idx_tb_requests_state`, `idx_tb_proposals_is_active`. Nessun drop, RLS invariate, comportamento esistente non toccato.
- **Step 2 (frontend, ⚠️ da rivedere):** riscrittura di `src/pages/hr/HRTeamBuildingPage.tsx` con tre sezioni ("Eventi in programma" / "Richieste in corso" / "Archivio" collassato) guidate da `state`. Pill calcolata client-side dalla gerarchia proposte+quote. Bozze unificate dentro "Richieste in corso". Query batch con `.in()` (1 + N parallele in `Promise.all`).
- Nuovo helper `src/lib/tb-category-icons.ts`: mappa fissa `categoryId → LucideIcon` per le 11 categorie + `getTbPrimaryCategoryId` che estrae la prima preferred activity da `extra_services`. Nessuna modifica al wizard (la categoria preferita era già catturata).
- Fix in corso giornata: l'embed `format:tb_formats(image_url)` su `tb_events` rompeva la query (FK inesistente) → empty state anche con 9 richieste a DB. Sostituito recuperando l'immagine da `tb_proposals.format_id` della proposta accettata, via query parallela aggiuntiva.
- Documentazione: aggiunto banner di stato in cima a `tb-flow.md` (Step 1 ✅, Step 2 ⚠️, Step 3–7 non avviati). Creato `docs/tb-flow-implementation-plan.md` con il piano originario completo come reference.

**Impatto.** `DB schema` · `UI` · `Docs`

**File / aree toccate.**
- `tb_requests` (colonna `state` generated), `tb_proposals` (colonna `is_active`), indici relativi
- `src/pages/hr/HRTeamBuildingPage.tsx` (riscrittura)
- `src/lib/tb-category-icons.ts` (nuovo)
- `docs/tb-flow.md`, `docs/tb-flow-implementation-plan.md`, `.lovable/plan.md`

**Follow-up.**
- **Step 2 da rivedere**: ci sono errori residui sulla lista HR (oltre al fix embed `tb_events` già applicato). Aprire una sessione di correzione prima di considerare lo Step 2 chiuso e di procedere con lo Step 3.
- Aggiornare `architettura.md` con la nuova colonna `state` su `tb_requests` e `is_active` su `tb_proposals`.
- Step 3 (DB additivo Fase 1 + RPC per-proposal) resta in attesa.

---
### 2026-05-11 — Introdotto `docs/log.md`

**Contesto.** Mancava un punto unico dove tracciare le modifiche al sistema sessione per sessione. `architettura.md` descrive lo stato attuale, `principi.md` descrive il perché — ma il "cosa è cambiato e quando" era disperso tra commit e memoria.

**Cosa cambia.**
- Creato `docs/log.md` con header, regole d'uso, template e questa prima entry seed.
- Definito lo schema fisso di ogni entry (Contesto, Cosa cambia, Impatto, File toccati, Follow-up) e l'ordine cronologico inverso.

**Impatto.** `Docs`

**File / aree toccate.**
- `docs/log.md`

**Follow-up.** A regime, ogni sessione che tocca DB / RLS / RPC / edge function deve aggiornare anche `architettura.md` oltre al log.

---

## 2026-05-15 — Header pagina allineato alla sidebar + icona titolo

**Cosa cambia.** Il `<main>` di `AdminLayout` ora usa `pt-3` (allineato al `pt-3` della sidebar): il titolo della pagina cade alla stessa altezza del nome utente in alto a sinistra, stile Attio. `PageHeader` accetta `icon` e `iconColor` opzionali e renderizza un quadrato `h-7 w-7 rounded-md bg-muted` con l'icona della voce sidebar corrispondente, accanto al titolo.

**File / aree toccate.**
- `src/components/layout/AdminLayout.tsx`
- `src/components/common/PageHeader.tsx`
- Tutte le pagine che usano `PageHeader` (Super Admin, HR, Association) — aggiunta `icon` + `iconColor` coerenti con la sidebar.

**Follow-up.** Le pagine con header custom inline (es. `AccessCodesPage`, `ExperiencesPage`, `TBFormatsPage`, `EmailSettingsPage`, `AssociationHistoryPage`, `AssociationExperiencesPage`, `HRHomePage`, `AssociationHome`) ereditano l'allineamento via `pt-3` ma non l'icona — migrare a `PageHeader` in un passaggio successivo.
