## Obiettivo

La sezione **Sicurezza** è oggi visivamente sbilanciata: campi password che attraversano tutta la pagina, bottoni con allineamenti diversi (Aggiorna password a destra, Attiva 2FA a sinistra), check requirements spezzati su due colonne, nessuna gerarchia chiara. Vogliamo un layout pulito e coerente, in linea con lo stile Attio/Airbnb già adottato altrove.

## Pattern di layout adottato

Adottiamo il classico pattern **two-column settings** (label+descrizione a sinistra, controlli a destra), con larghezza massima contenuta. Stesso pattern già visto in Stripe, Linear, Attio.

```text
┌─────────────────────────────────────────────────────────┐
│ Sicurezza                                                │
│ Gestisci la password e l'autenticazione a due fattori    │
├───────────────────────────────────────────────────────── ┤
│                                                          │
│  Cambia password           ┌──────────────────────────┐  │
│  Per la tua sicurezza,     │ Password attuale         │  │
│  ti chiediamo prima la     │ [_________________] 👁   │  │
│  password attuale.         │                          │  │
│                            │ Nuova password           │  │
│                            │ [_________________] 👁   │  │
│                            │ ▓▓▓▓░░░░ Sicurezza: media│  │
│                            │ ✓ 8 caratteri            │  │
│                            │ ✓ Maiuscola              │  │
│                            │ ○ Minuscola              │  │
│                            │ ○ Numero                 │  │
│                            │ ○ Speciale               │  │
│                            │                          │  │
│                            │ Conferma nuova password  │  │
│                            │ [_________________]      │  │
│                            │                          │  │
│                            │      [Aggiorna password] │  │
│                            └──────────────────────────┘  │
│                                                          │
│  ─────────────────────── divider ───────────────────────│
│                                                          │
│  Autenticazione a        ┌──────────────────────────┐    │
│  due fattori             │ 🛡️ 2FA non attiva        │    │
│                          │                          │    │
│                          │ Usa Google Authenticator │    │
│                          │ o Authy.                 │    │
│                          │                          │    │
│                          │       [Attiva 2FA]       │    │
│                          └──────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Modifiche concrete

### 1. Nuovo componente `SettingsFormRow`

File nuovo: `src/components/common/SettingsFormRow.tsx`

Wrapper riutilizzabile a due colonne:

- A sinistra (`md:col-span-1`): titolo `text-sm font-semibold` + descrizione `text-xs text-muted-foreground`
- A destra (`md:col-span-2`): contenuto del form
- Su mobile: stack verticale (label sopra, form sotto)
- Larghezza massima del contenuto a destra: `max-w-md` (≈448px) per evitare campi giganteschi

### 2. `SecuritySettingsContent.tsx`

- Rimuovo `space-y-8` semplice, uso `divide-y divide-border` con padding verticale per separare le sezioni in modo netto.
- Larghezza massima container: `max-w-3xl`.
- Ogni sezione (Password, MFA) avvolta in `SettingsFormRow`.

### 3. `ChangePasswordCard.tsx` (ChangePasswordForm)

- Rimuovo l'header interno (titolo+descrizione) — ora vive nella colonna sinistra di `SettingsFormRow`.
- Restituisco solo il `<form>`.
- Bottone "Aggiorna password" rimane allineato a destra **dentro** la colonna form (coerente con la larghezza dei campi).
- Spaziatura uniforme `space-y-5`.

### 4. `PasswordStrengthInput.tsx` — fix requirements

- Cambio la lista da `grid-cols-1 sm:grid-cols-2` a **singola colonna** `flex flex-col gap-1`. Dentro la colonna stretta del form (max-w-md) i 5 requisiti su una colonna sono molto più leggibili e non si "spezzano".
- Ridimensiono icone a `h-3 w-3` per coerenza.

### 5. `EnrollMFA.tsx`

- Rimuovo l'header interno (titolo+descrizione) — va nella colonna sinistra di `SettingsFormRow`.
- Restituisco direttamente il contenuto degli stati (attivo / non attivo / enrolling).
- Bottone "Attiva 2FA" allineato a **destra** come "Aggiorna password" → finalmente i due CTA hanno lo stesso allineamento.
- Quando si entra in modalità QR (enrolling), il blocco resta dentro la colonna destra — il QR rimane centrato ma il container è contenuto.

## File modificati

- `src/components/common/SettingsFormRow.tsx` (nuovo)
- `src/components/settings/SecuritySettingsContent.tsx`
- `src/components/profile/ChangePasswordCard.tsx`
- `src/components/auth/EnrollMFA.tsx`
- `src/components/auth/PasswordStrengthInput.tsx`

## Risultato atteso

- Campi password di larghezza ragionevole (max ~448px), non più stiracchiati.
- Entrambi i bottoni ("Aggiorna password" e "Attiva 2FA") allineati a destra, alla stessa colonna verticale.
- Requirements password in una colonna chiara, niente più "spezzettatura".
- Gerarchia visiva: a colpo d'occhio capisci cos'è "Cambia password" vs "Autenticazione a due fattori" grazie alla colonna sinistra dedicata.
- Pattern riutilizzabile (`SettingsFormRow`) che potremo applicare anche al profilo e alle altre settings per uniformità.