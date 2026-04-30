# Allineare Sicurezza tra HR / Super Admin / Association + form password senza card

## Obiettivo
1. **Form Cambia Password senza chrome a card.** Oggi `ChangePasswordCard` usa `Card/CardHeader/CardContent`. In `SettingsProfile` HR è già forzato neutro con un hack (`cardClassName="border-0 shadow-none bg-transparent p-0"`). Lo trasformiamo in un form pulito riutilizzato ovunque.
2. **Stessa IA "Password & MFA" per tutti gli admin.** Super Admin e Association ce l'hanno già come voce dedicata nella sidebar impostazioni. HR no: il cambio password vive *dentro* la pagina Profilo. Allineiamo HR aggiungendo la voce e spostando lì il blocco.

## Cosa cambia

### 1) `ChangePasswordCard` → `ChangePasswordForm` (no card)
File: `src/components/profile/ChangePasswordCard.tsx` (rinominato logicamente — manteniamo il nome file per non rompere git history se preferisci, ma esportiamo `ChangePasswordForm`).

- Rimuoviamo `Card/CardHeader/CardTitle/CardDescription/CardContent`.
- Sostituiamo con un `<section className="space-y-4">`:
  - Heading inline coerente con `SettingsSection`: titolo `text-base font-semibold` + descrizione `text-sm text-muted-foreground`.
  - Niente icona viola nel titolo (era decorativa, distoglieva).
- Rimuoviamo la prop `cardClassName` (e tutti i suoi usi).
- Bottone "Aggiorna password" non più `w-full`: diventa allineato a destra come gli altri form delle impostazioni (`size="sm"`, `Save` icon, pattern identico al "Salva modifiche" di `ProfileSettingsContent`).

Backward-compat: aggiungiamo `export const ChangePasswordCard = ChangePasswordForm` per non rompere import in volo, poi aggiorniamo i 4 callsite.

### 2) HR: nuova voce "Password & MFA" nelle impostazioni
File: `src/components/layout/HRSettingsLayout.tsx`
- Aggiungo `{ label: "Password & MFA", icon: Shield, href: "/hr/impostazioni/sicurezza", iconColor: "text-emerald-500" }` subito dopo "Profilo" (stesso ordine di SuperAdmin/Association).
- Aggiorno `sectionLabels`: la sezione "Personale" ora copre Profilo + Password & MFA + Tema + Notifiche + Referral, gli indici delle sezioni successive si shiftano di +1.

File: `src/App.tsx`
- Aggiungo route `<Route path="sicurezza" element={<HRSettingsSecurity />} />` dentro il blocco `/hr/impostazioni`.

File: `src/pages/hr/settings/SettingsSecurity.tsx` (nuovo)
- One-liner: `export default () => <SecuritySettingsContent />;` (stesso pattern di SuperAdmin e Association).

File: `src/pages/hr/settings/SettingsProfile.tsx`
- Rimuovo l'import e l'uso di `ChangePasswordCard` in fondo alla pagina. Il Profilo HR torna a contenere solo avatar + dati personali, esattamente come Super Admin e Association.

### 3) Aggiorna gli altri callsite del nuovo form
- `src/components/settings/SecuritySettingsContent.tsx`: importa `ChangePasswordForm` invece di `ChangePasswordCard` (o tiene l'alias — funzionerà comunque).
- `src/pages/Profile.tsx` (employee, fuori scope di questo prompt ma il componente rimarrà usato): tiene l'alias `ChangePasswordCard` finché non lo tocchiamo.

## File toccati

**Modificati**
- `src/components/profile/ChangePasswordCard.tsx` — rifattorizzazione: stripping Card chrome, nuovo header inline, bottone allineato a destra, export `ChangePasswordForm` + alias.
- `src/components/layout/HRSettingsLayout.tsx` — nuova voce "Password & MFA" + shift indici sezione.
- `src/App.tsx` — nuova route `hr/impostazioni/sicurezza`.
- `src/pages/hr/settings/SettingsProfile.tsx` — rimosso il blocco `ChangePasswordCard` finale.
- `src/components/settings/SecuritySettingsContent.tsx` — usa il nuovo nome (cosmetico, l'alias copre).

**Creati**
- `src/pages/hr/settings/SettingsSecurity.tsx` — wrapper di `SecuritySettingsContent`.

**Non toccati**
- Super Admin e Association: già OK strutturalmente. Riceveranno automaticamente il nuovo look del form (no card).
- `EnrollMFA` resta com'è (è un Card a sé, decisione invariata).
- Profilo employee `/app/profile`: non in scope, hai già detto che l'employee non ci interessa adesso.
- Nessuna modifica al DB, nessuna nuova RLS, nessuna nuova chiamata.

## Verifica post-deploy
1. Login come HR → sidebar impostazioni mostra "Password & MFA" subito sotto Profilo. Click → form password senza card + sezione MFA.
2. Login come Super Admin → `/super-admin/impostazioni/sicurezza` → form password ora visivamente "flat" (no card), allineato al resto della pagina.
3. Login come Association Admin → idem.
4. Dark mode attivo → controlla che heading/inputs/bottone restino leggibili (usano già token semantici, dovrebbero).
