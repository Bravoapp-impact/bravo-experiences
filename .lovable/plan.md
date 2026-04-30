# Prompt 2 — Eliminate legacy profile pages (HR + Super Admin + Association)

## Goal
Resolve A2 + D1 in one pass: kill the three old card-based profile pages and route everything through the new settings panels created in Prompt 1.

## Current state (verified)

Three legacy profile UIs still exist on disk (and one is still routed):

```text
LEGACY                                NEW (Prompt 1)
/hr/profile          → live route  →  /hr/impostazioni/profilo + /sicurezza
/super-admin/profile → 307 redirect →  /super-admin/impostazioni/profilo + /sicurezza
/association/my-profile → 307 redirect → /association/impostazioni/profilo + /sicurezza + /organizzazione
```

The new panels already cover:
- profile editing (name, surname, avatar, read-only email) → `*/settings/SettingsProfile.tsx`
- password change → `ChangePasswordCard` inside profile + security page
- MFA enrollment → `*/settings/SettingsSecurity.tsx`
- logout → unified sidebar dropdown

What the legacy pages contain that the new ones don't:
- **Account info card** (email + company / association name): redundant — email is shown read-only in the profile form, and company/association name is shown in the sidebar header (`entityName` / `entityLogoUrl`).
- **Logout button**: already in the dropdown.
- **HR-only hour budget widget**: shows the HR user's *own* booking budget. HR admins are not the bookers (employees are). It belongs nowhere on an HR profile and is already exposed at the company level in `SettingsVolunteering`.

No functional regression.

## Changes

### 1. `src/App.tsx`
- Remove the live `<Route path="/hr/profile">` block (currently renders `<HRProfile />`); replace with `<Route path="/hr/profile" element={<Navigate to="/hr/impostazioni/profilo" replace />} />`.
- Remove `import HRProfile from "./pages/hr/HRProfile";`.
- Remove the now-dead legacy import comments for `SuperAdminProfile` and `AssociationAdminProfile` (cleanup).
- Verify the existing `/super-admin/profile` and `/association/my-profile` redirects stay in place.

### 2. `src/pages/Profile.tsx`
The employee profile page redirects admin roles back to legacy URLs. Update the `roleRoutes` map:
```ts
const roleRoutes: Record<string, string> = {
  super_admin: "/super-admin/impostazioni/profilo",
  hr_admin: "/hr/impostazioni/profilo",
  association_admin: "/association/impostazioni/profilo",
};
```
(Avoids one extra redirect hop through the legacy URL.)

### 3. Delete legacy files
- `src/pages/hr/HRProfile.tsx`
- `src/pages/super-admin/SuperAdminProfile.tsx`
- `src/pages/association/AssociationAdminProfile.tsx`

### 4. Verify no dangling references
Sanity-check there are no remaining imports or links to the deleted files or the legacy paths inside sidebars / dropdowns / quick actions. Current scan shows only the references listed above.

## Files

- **Modified**: `src/App.tsx`, `src/pages/Profile.tsx`
- **Deleted**: `src/pages/hr/HRProfile.tsx`, `src/pages/super-admin/SuperAdminProfile.tsx`, `src/pages/association/AssociationAdminProfile.tsx`

## Risks

- **Bookmarks / external links** to `/hr/profile`, `/super-admin/profile`, `/association/my-profile` → all three now resolve via `<Navigate replace>` to the new settings panels.
- **Lost functionality**: none. The "Account info" card, the logout button, and the HR personal hour-budget widget are either redundant or misplaced.
- **No DB / RLS / edge function changes.** Pure routing + cleanup.

## Out of scope
- Visual changes to the new settings panels.
- Any change to `AssociationProfilePage` (`/association/profile`) — that's the public organization profile, intentionally separate.
