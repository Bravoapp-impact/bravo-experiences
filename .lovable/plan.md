# Prompt 1 (rivisto) — Pannello Impostazioni unificato per tutti i ruoli

Ridisegna l'accesso alle impostazioni in modo coerente per **HR, Super Admin e Association Admin**:

- Il dropdown della sidebar in alto contiene sempre e solo **2 voci**: "Impostazioni" + "Esci".
- Esiste un **pannello impostazioni dedicato per ogni ruolo** (HR già fatto, Super Admin e Association nuovi), con sidebar settings interna.
- La voce profilo viene **rimossa dalla sidebar HR** (`/hr/impostazioni/profilo` resta accessibile solo via dropdown → Impostazioni).
- Risolto contestualmente **A1** (404 dropdown) e **A3** (Home Super Admin mai attiva).

---

## 1. AdminLayout: dropdown unificato

**`src/components/layout/AdminLayout.tsx`**

Sostituire la voce dropdown "Impostazioni" che oggi naviga a `${basePath}/impostazioni` con una versione che riceve la path corretta tramite prop. Aggiungere prop `settingsPath: string` ad `AdminLayoutProps` (richiesta), e linkare il `DropdownMenuItem` "Impostazioni" a quella path.

Rimuovere la prop `dropdownItems` (non più usata da nessun layout dopo questa pulizia — verificare prima con `rg "dropdownItems"`; se qualcuno la passa, eliminarne l'uso).

Risultato: dropdown sempre composto da 2 sole voci → **Impostazioni** (icona `Settings`) + **Esci** (icona `LogOut`, destructive).

## 2. Super Admin Settings — nuovo pannello

Riprodurre la struttura HR (`HRSettingsLayout` + `pages/hr/settings/*`) per il super admin.

**Nuovi file:**

- `src/components/layout/SuperAdminSettingsLayout.tsx` — clone di `HRSettingsLayout`, ma:
  - `basePath="/super-admin/impostazioni"`, `profilePath="/super-admin/impostazioni/profilo"`
  - `entityName="Bravo! Team"`, nessun logo
  - Sidebar items minimale e onesta (niente "Presto" su funzioni che non esistono nel super admin):
    - `Indietro` → `/super-admin`
    - sezione "Personale": **Profilo** (`/super-admin/impostazioni/profilo`)
    - sezione "Sicurezza": **Password & MFA** (`/super-admin/impostazioni/sicurezza`)
- `src/pages/super-admin/settings/SettingsProfile.tsx` — porta dentro `ProfileAvatarUpload` + `ProfileEditForm` (riuso dei componenti esistenti, stesso pattern di `pages/hr/settings/SettingsProfile.tsx`).
- `src/pages/super-admin/settings/SettingsSecurity.tsx` — `ChangePasswordCard` + `EnrollMFA`.

**Routing in `src/App.tsx`:**

```tsx
<Route path="/super-admin/impostazioni" element={
  <ProtectedSuperAdminRoute><SuperAdminSettingsLayout /></ProtectedSuperAdminRoute>
}>
  <Route index element={<Navigate to="profilo" replace />} />
  <Route path="profilo" element={<SuperAdminSettingsProfile />} />
  <Route path="sicurezza" element={<SuperAdminSettingsSecurity />} />
</Route>
```

La vecchia route `/super-admin/profile` (`SuperAdminProfile.tsx`) viene sostituita da un redirect a `/super-admin/impostazioni/profilo`. Il file `SuperAdminProfile.tsx` non viene cancellato in questo prompt (cleanup in Prompt 5/8).

## 3. Association Settings — nuovo pannello

Stessa struttura per l'association admin.

**Nuovi file:**

- `src/components/layout/AssociationSettingsLayout.tsx`:
  - `basePath="/association/impostazioni"`, `profilePath="/association/impostazioni/profilo"`
  - `entityName={profile?.associations?.name || "Associazione"}`, `entityLogoUrl` da `associations.logo_url`
  - Sidebar items:
    - `Indietro` → `/association`
    - sezione "Personale": **Profilo** (mio profilo personale, `/association/impostazioni/profilo`)
    - sezione "Sicurezza": **Password & MFA** (`/association/impostazioni/sicurezza`)
    - sezione "Organizzazione": **Profilo pubblico** (`/association/impostazioni/organizzazione`) — link al profilo pubblico dell'associazione
- `src/pages/association/settings/SettingsProfile.tsx` — profilo personale dell'admin (avatar, nome).
- `src/pages/association/settings/SettingsSecurity.tsx` — password + MFA.
- `src/pages/association/settings/SettingsOrganization.tsx` — semplice card con CTA "Modifica profilo pubblico" che porta a `/association/profile` (che già esiste). In alternativa potremmo embed-are direttamente l'editor; per ora teniamolo come hub di link per non duplicare logica complessa.

**Routing in `src/App.tsx`:**

```tsx
<Route path="/association/impostazioni" element={
  <ProtectedAssociationRoute><AssociationSettingsLayout /></ProtectedAssociationRoute>
}>
  <Route index element={<Navigate to="profilo" replace />} />
  <Route path="profilo" element={<AssociationSettingsProfile />} />
  <Route path="sicurezza" element={<AssociationSettingsSecurity />} />
  <Route path="organizzazione" element={<AssociationSettingsOrganization />} />
</Route>
```

La vecchia `/association/my-profile` (`AssociationAdminProfile.tsx`) diventa redirect a `/association/impostazioni/profilo`. File legacy non cancellato in questo prompt.

## 4. HRLayout: rimuovi profilo dalla sidebar

**`src/components/layout/HRLayout.tsx`**

- Rimuovi la voce sidebar "Impostazioni" (oggi `/hr/impostazioni/profilo`, ultima della lista) — l'unico modo di entrare nelle impostazioni sarà il dropdown in alto, **uniforme con gli altri ruoli**.
- Aggiorna gli indici di `separatorAfterIndex` e `sectionLabels` di conseguenza.
- Cambia `profilePath` da `/hr/profile` a `/hr/impostazioni/profilo` (così risolviamo anche **D1** in anticipo, e il redirect `/hr/profile` → `/hr/impostazioni/profilo` lo facciamo nel Prompt 2 originale).
- Passa la nuova prop `settingsPath="/hr/impostazioni/profilo"` ad `AdminLayout`.

Stesso aggiornamento per `SuperAdminLayout` e `AssociationLayout`: passano `settingsPath` rispettivamente a `/super-admin/impostazioni/profilo` e `/association/impostazioni/profilo`.

## 5. Fix Super Admin Home (A3)

**`src/components/layout/SuperAdminLayout.tsx`**

Cambia href della voce "Home" da `/super-admin/home` a `/super-admin`. La logica `isActive` di `AdminLayout` ha già `if (path === basePath) return location.pathname === path;` quindi l'evidenziazione funzionerà correttamente.

---

## File nuovi e modificati

**Nuovi (8 file)**
- `src/components/layout/SuperAdminSettingsLayout.tsx`
- `src/components/layout/AssociationSettingsLayout.tsx`
- `src/pages/super-admin/settings/SettingsProfile.tsx`
- `src/pages/super-admin/settings/SettingsSecurity.tsx`
- `src/pages/association/settings/SettingsProfile.tsx`
- `src/pages/association/settings/SettingsSecurity.tsx`
- `src/pages/association/settings/SettingsOrganization.tsx`

**Modificati (5 file)**
- `src/components/layout/AdminLayout.tsx` — dropdown a 2 voci, nuova prop `settingsPath`, rimozione `dropdownItems`
- `src/components/layout/HRLayout.tsx` — rimossa voce Impostazioni dalla sidebar, `profilePath` corretto, `settingsPath` aggiunto
- `src/components/layout/SuperAdminLayout.tsx` — Home → `/super-admin`, `settingsPath` aggiunto
- `src/components/layout/AssociationLayout.tsx` — `settingsPath` aggiunto (rimuovere eventuali voci sidebar profilo se presenti)
- `src/App.tsx` — nuove route settings, redirect `/super-admin/profile` e `/association/my-profile`

## Pattern riusati

- `AdminLayout` per la shell con sidebar, scoped `admin-panel` styling già esistente.
- `ProfileAvatarUpload`, `ProfileEditForm`, `ChangePasswordCard`, `EnrollMFA` — invariati, riusati nei nuovi `SettingsProfile`/`SettingsSecurity`.
- Stesso pattern di `HRSettingsLayout` (Outlet wrappato in `max-w-4xl mx-auto`) per coerenza visiva tra ruoli.

## Auto-verifica

- HR / Super Admin / Association: dropdown sidebar → "Impostazioni" → apre il pannello del ruolo, niente 404.
- Sidebar HR: la voce "Impostazioni" non c'è più (l'unico ingresso è il dropdown).
- Sidebar Super Admin: voce "Home" su `/super-admin` risulta attiva.
- Vecchie route `/super-admin/profile` e `/association/my-profile` rispondono con redirect alla nuova path settings.
- Tutte e 3 le aree settings hanno: Profilo (avatar + nome) + Sicurezza (password + MFA). Association ha in più "Profilo pubblico" come link.

## Rischi

- L'`AssociationLayout` potrebbe già contenere voci sidebar dedicate al profilo: vanno individuate e rimosse per non creare duplicati con il pannello settings (verificherò leggendo il file in fase di implementazione).
- `SuperAdminProfile.tsx` e `AssociationAdminProfile.tsx` restano come dead code dopo il redirect — eliminazione rinviata al Prompt 5/8 per non incrociare modifiche di rotte e cleanup nello stesso step.
- La nuova prop `settingsPath` su `AdminLayout` è obbligatoria: bisogna passarla in **tutti** i 5 layout che usano `AdminLayout` (HR, Super Admin, Association, HR Settings, e i nuovi Super Admin Settings / Association Settings) altrimenti TypeScript darà errore — utile come safety net.
