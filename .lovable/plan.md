# Eliminare lo sfarfallio: skeleton al posto degli spinner di pagina

## Diagnosi del problema

Lo "sfarfallio" che vedi NON è causato da animazioni di entrata (fade-in/scale) — non ce ne sono nell'app. Le cause reali sono **due livelli di spinner che si alternano**:

1. **Protected routes** (`ProtectedRoute`, `ProtectedHRRoute`, `ProtectedSuperAdminRoute`, `ProtectedAssociationRoute`): mentre `useAuth` controlla la sessione, mostrano uno spinner centrato a tutto schermo → la pagina sparisce.
2. **Pagine** che, una volta dentro, mostrano un **secondo** spinner generico (`LoadingState` o `Loader2` inline) finché i dati non arrivano → un secondo "lampo" prima del contenuto.

Risultato: sullo schermo vedi sequenza `spinner → spinner → contenuto`, da cui la sensazione di sfarfallio. Inoltre lo spinner non comunica la struttura della pagina, quindi sembra "lento" anche quando dura poco.

## Obiettivo

Sostituire gli spinner di **caricamento pagina/sezione** con **skeleton specifici** che riproducono il layout sottostante (header, card, tabella, ecc.). Mantenere gli spinner solo dove sono corretti: pulsanti in submit, upload avatar, dialog di conferma.

## Cosa cambiare

### 1. Loader globale unificato (route guards)
- File: `ProtectedRoute.tsx`, `ProtectedHRRoute.tsx`, `ProtectedSuperAdminRoute.tsx`, `ProtectedAssociationRoute.tsx`.
- Nuovo componente `AppBootSkeleton` che mostra uno scheletro neutro a tutto schermo (sidebar/topbar grigia + area contenuto con blocchi) **senza animate-spin**. Usa `Skeleton` shadcn (animate-pulse, già morbido).
- Stesso skeleton in `ProtectedRoute` (employee mobile): mostra scheletro della bottom-nav + lista card.

### 2. Skeleton per pagina (sostituiscono `LoadingState` / `Loader2` inline)

Per ogni pagina che oggi mostra spinner a tutto schermo, creo uno skeleton coerente con il suo layout:

- **HR area** (`HRHomePage`, `HRDashboard`, `HRExperiencesPage`, `HRExperienceDetail`, `HREmployeesPage`, `HRTeamBuildingPage`, `HRTBRequestDetailPage`, `HRTBProposalDetailPage`, `HRNewTBRequestPage`, `HRPlaceholderPage`, settings pages): `HRPageSkeleton` con sidebar + topbar + area centrale (titolo + 3-4 blocchi/tabella).
- **Super Admin** (`SuperAdminDashboard`, `CompaniesPage`, `ExperiencesPage`, `UsersPage`, `AssociationsPage`, `CitiesPage`, `CategoriesPage`, `EmailSettingsPage`, `AccessCodesPage`, `AccessRequestsPage`, `TBFormatsPage`, `TBFormatDetailPage`, `TBRequestsPage`, `TBRequestDetailPage`, settings): `AdminTableSkeleton` (header pagina + righe tabella) e `AdminDetailSkeleton` (titolo + 2 colonne).
- **Association** (`AssociationHome`, `AssociationExperiencesPage`, `AssociationExperienceDetail`, `AssociationHistoryPage`, `AssociationProfilePage`, `AssociationCalendarPage`, settings): skeleton analogo Admin.
- **Employee mobile** (`MyBookings`, `Profile`, `Impact`): skeleton dedicato per ciascuna (card prenotazione, profilo, stat tiles). `Experiences` e `ExperienceDetail` hanno già skeleton — li allineo allo stesso stile.

### 3. Eliminazione del doppio loader
Quando la guard mostra `AppBootSkeleton` di shell e la pagina figlia ha il proprio skeleton dei dati, evito la transizione `spinner → spinner` mostrando direttamente lo skeleton della pagina dentro la shell quando l'auth è risolto ma i dati no. Pratica: la guard finisce → la pagina parte già con lo skeleton del suo layout (no LoadingState centrale).

### 4. Cosa NON tocco (spinner legittimi)
Resta `Loader2 animate-spin` dentro:
- Pulsanti submit (Login, Register, ForgotPassword, ResetPassword, ProfileEditForm, ChangePasswordCard, ExperienceForm, ManageDatesDialog, AccessRequestModal, EnrollMFA, ChallengeMFA, StepWizard, TBFormatEditDialog, HRNewTBRequestPage submit).
- Upload immagini (ProfileAvatarUpload, AvatarUploadBlock, LogoUpload).
- AuthCallback (transizione brevissima di redirect — accettabile).
- Riga tabella in fetch incrementale (`TableLoadingRow`, `DatesSidebar`, `MobileDateDrawer`, dialog dipendenti, EmailSettings test invio).

Sono feedback di azione utente, non caricamento di pagina: non causano sfarfallio.

## Dettagli tecnici

### Nuovi file
```text
src/components/common/skeletons/
  AppBootSkeleton.tsx          // shell neutra (employee mobile / desktop)
  HRPageSkeleton.tsx           // sidebar + header + content blocks
  AdminTableSkeleton.tsx       // header + filtri + righe tabella
  AdminDetailSkeleton.tsx      // header + 2 colonne (sidebar info + main)
  AssociationPageSkeleton.tsx  // analogo HR ma con palette association
  EmployeeListSkeleton.tsx     // bottom-nav + lista card mobile
  EmployeeDetailSkeleton.tsx   // hero + descrizione + sidebar date
```
Tutti basati su `<Skeleton>` shadcn (già `animate-pulse rounded-md bg-muted`). Nessuna animazione aggiuntiva.

### Pattern di sostituzione

Prima:
```tsx
if (loading) return <LoadingState />;
```
Dopo:
```tsx
if (loading) return <HRPageSkeleton variant="table" />;
```

Per route guards:
```tsx
if (loading) return <AppBootSkeleton role="hr" />;
```

`LoadingState` resta nel codice ma deprecato (uso interno solo per pulsanti/dialog se serve testo "Caricamento...").

### File toccati (lista completa)
Route guards (4) + ~30 pagine elencate sopra. Solo sostituzione del blocco `if (loading)` — nessun cambio a logica dati, query, RLS, edge functions.

## Verifica
- Navigare tra `/login → /hr → /hr/users → /hr/team-building` osservando che tra una pagina e l'altra appaia lo skeleton del layout corretto, senza lampi bianchi né doppi spinner.
- Stesso test su mobile per `/app/experiences`, `/app/bookings`, `/app/profile`.
- Verifica visiva su super-admin e association.

## Fuori scope
- Ottimizzazioni di performance reali (cache react-query, prefetch, code-splitting). Se vuoi le affrontiamo in un secondo step dedicato — questo intervento è puramente percettivo.
