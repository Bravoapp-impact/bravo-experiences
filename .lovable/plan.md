## Obiettivo

Sostituire i form di modifica oggi in bella vista sul Profilo con un'area Impostazioni stile Airbnb: indice → categoria → riga con "Edit" inline che si espande in form.

## Architettura route

```
/app/profile                        (invariata, alleggerita)
/app/impostazioni                   indice categorie
/app/impostazioni/personali         Informazioni personali
/app/impostazioni/sicurezza         Accesso e sicurezza
/app/impostazioni/notifiche         Notifiche
```

Tutte sotto `ProtectedRoute`, dentro `AppLayout` (bottom nav visibile, mobile-first).

## Nuovi componenti condivisi

`**src/components/settings/SettingsListItem.tsx**` — riga categoria dell'indice. Props: `icon`, `title`, `to`. Render: icona a sinistra, titolo, chevron a destra, divider sottile sotto. Tap-friendly (min-h ~64px).

`**src/components/settings/SettingsField.tsx**` — riga modificabile in stile Airbnb. Props: `label`, `value` (stringa già formattata da mostrare in grigio sotto la label), `placeholder` (es. "Non impostato"), `editable` (default true), `actionLabel` (default "Modifica"), `children` (il form da mostrare quando espanso), `onCancel` opzionale. 

Comportamento: stato `isEditing` interno. Quando chiuso mostra label + valore + link "Modifica" a destra. Tap su Modifica → espande sotto i `children` (il form), nasconde label/valore "old", mostra in alto la label + "Cancel" a destra che fa collassare. Quando il form salva con successo, deve chiamare `onSaved()` (esposto via render-prop o context) per chiudere automaticamente. Pattern semplice: il componente passa una callback `close` ai children tramite render-prop:

```tsx
<SettingsField label="Nome legale" value={`${firstName} ${lastName}`}>
  {(close) => <NameForm onSaved={close} />}
</SettingsField>
```

Se `editable=false`, niente Modifica a destra (per Email e Azienda).

`**src/components/settings/SettingsSubPageLayout.tsx**` — wrapper per le 3 sotto-pagine. Header con back-arrow circolare (icona `ArrowLeft` dentro un cerchio `bg-muted`), titolo H1 grande in stile Airbnb (testo grosso, font-semibold). Dentro `AppLayout`. Back va a `/app/impostazioni`.

## Pagine

`**src/pages/EmployeeSettingsIndex.tsx**` (`/app/impostazioni`)

- Header con back-arrow → `/app/profile`, titolo "Impostazioni".
- Lista di 3 `SettingsListItem`:
  - icona `User` → "Informazioni personali" → `/app/impostazioni/personali`
  - icona `Shield` → "Accesso e sicurezza" → `/app/impostazioni/sicurezza`
  - icona `Bell` → "Notifiche" → `/app/impostazioni/notifiche`

`**src/pages/settings/EmployeeSettingsPersonali.tsx**` (`/app/impostazioni/personali`)
Titolo "Informazioni personali". Lista di `SettingsField`:

- **Nome e cognome** — value: `"Mario Rossi"`, editable. Form: due input (nome, cognome) con stessa zod validation di `ProfileSettingsContent`, bottone "Salva e continua" stile Airbnb (full-width-ish, scuro). Su successo chiude.
- **Email** — value: `profile.email`, `editable=false`.
- **Azienda** — value: `profile.companies?.name || "Non associata"`, `editable=false`.

`**src/pages/settings/EmployeeSettingsSicurezza.tsx**` (`/app/impostazioni/sicurezza`)
Titolo "Accesso e sicurezza". Due `SettingsField`:

- **Password** — value: `"••••••••"`, editable. Form: riusa `ChangePasswordForm` esistente (passando `profile.email`). Sul successo deve chiudere il field — aggiungo prop opzionale `onSuccess?: () => void` a `ChangePasswordForm` (la chiamo dopo il toast di successo), zero altre modifiche.
- **Autenticazione a due fattori** — value dinamico: "Attiva" o "Non attiva" in base allo stato MFA (leggo `supabase.auth.mfa.listFactors()` al mount; loading → "Caricamento…"). Form: riusa `EnrollMFA` esistente, senza wrapper. Niente `onSuccess` qui perché `EnrollMFA` ha un flusso a step suo; il field resta espanso finché l'utente non tap su Cancel.

`**src/pages/settings/EmployeeSettingsNotifiche.tsx**` (`/app/impostazioni/notifiche`)
Titolo "Notifiche". Un solo `SettingsField`:

- **Email al responsabile** — value: `profile.manager_email || ""` (mostra "Non impostata" come placeholder, action "Modifica" sia se vuoto che se valorizzato). Form: input email + bottone Salva con la stessa logica di `ManagerEmailCard` (stesso zod, stesso update su `profiles.manager_email`, stesso toast). Sotto al form, la frase esplicativa già usata oggi nella card ("Se imposti l'email del tuo responsabile, riceverà un avviso qualche giorno prima di ogni tua attività di volontariato. Lascia vuoto per non attivare l'avviso.").

Per evitare drift, sposto la logica del form di `ManagerEmailCard` in un sotto-componente locale `ManagerEmailForm` (stesso file `ManagerEmailCard.tsx`) e lo riuso. La `ManagerEmailCard` originale viene rimossa dal Profilo ma resta esportata.

## Modifiche a `src/pages/Profile.tsx`

Rimuovo:

- `ProfileEditForm` (import e blocco)
- `ManagerEmailCard` (import e blocco)
- `ChangePasswordCard` (import e blocco)
- `EnrollMFA` (import e blocco)
- l'intera "Card Informazioni account"
- import diventati inutili (`Mail`, `Building2`, `Separator`, `CardHeader`, `CardTitle` se non più usati)

Mantengo: header "Profilo", card avatar+nome (con upload tap-on-image come oggi), card budget ore, bottone logout.

Aggiungo, tra la card budget ore e il bottone logout, una `Card` cliccabile (`Link` a `/app/impostazioni`) con icona `Settings`, titolo "Impostazioni", sottotitolo "Profilo, sicurezza, notifiche" e chevron destro. Coerente visivamente col resto del Profilo.

## Routing — `src/App.tsx`

Aggiungo 4 route sotto `ProtectedRoute`:

```tsx
<Route path="/app/impostazioni" element={<ProtectedRoute><EmployeeSettingsIndex /></ProtectedRoute>} />
<Route path="/app/impostazioni/personali" element={<ProtectedRoute><EmployeeSettingsPersonali /></ProtectedRoute>} />
<Route path="/app/impostazioni/sicurezza" element={<ProtectedRoute><EmployeeSettingsSicurezza /></ProtectedRoute>} />
<Route path="/app/impostazioni/notifiche" element={<ProtectedRoute><EmployeeSettingsNotifiche /></ProtectedRoute>} />
```

## Stile

Inspired Airbnb (reference 1-3) ma fedele ai token del progetto:

- niente `Card` wrapper attorno alle liste/righe (linea sottile `border-b border-border` tra righe)
- titoli H1 pagine: `text-2xl font-semibold` (no "huge display" stile Airbnb puro, restiamo coerenti con il resto dell'app)
- "Modifica" come bottone testuale underline a destra, colore `text-foreground`, font-medium
- valore sotto label in `text-sm text-muted-foreground`
- form espansi: padding verticale `py-4`, bottoni Salva stile shadcn `Button` default
- back-arrow: cerchio `h-10 w-10 rounded-full bg-muted` con `ArrowLeft`, in alto a sinistra

## Fuori scope

- Bottom navigation: nessuna nuova voce, accesso solo dal Profilo.
- Card avatar+nome e card budget ore restano sul Profilo invariate (upload avatar via tap sull'immagine come oggi).
- Pagine HR / super-admin / association: invariate (continuano a usare `ProfileSettingsContent` e `SecuritySettingsContent`).
- `ProfileEditForm`, `EnrollMFA`: invariati come componenti, restano disponibili per gli admin.
- `ChangePasswordForm`: aggiunta solo la prop opzionale `onSuccess`, zero altri cambi.

## Verifica

- Login come dipendente → Profilo: solo header, card avatar+nome, card budget, riga "Impostazioni", logout.
- Tap "Impostazioni" → indice con 3 voci.
- Tap "Informazioni personali" → 3 righe; tap "Modifica" su Nome → form si espande con due input e Save; su Email e Azienda nessun Modifica.
- Tap "Accesso e sicurezza" → 2 righe; Password → form 3-campi che si chiude da solo dopo save; MFA → mostra stato corretto, espande EnrollMFA.
- Tap "Notifiche" → 1 riga; "Add" se vuoto, "Edit" se valorizzato; salvataggio e rimozione funzionano.
- Tutte le sotto-pagine: back-arrow torna a `/app/impostazioni`. Bottom nav sempre visibile.
- Login come HR / super-admin / association: nessuna regressione.
- Mobile 390px: tutto leggibile, niente overflow.