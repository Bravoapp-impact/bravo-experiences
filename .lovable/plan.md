

# Fix focus ring clipping + unify association modals

## Problem
The focus ring on inputs inside `CreateExperienceDialog` is clipped at left/right edges. This happens because `ScrollArea` (which has `overflow: hidden`) has `px-6`, and the focus ring extends 4px outside the input boundary — getting cut off.

Secondary issue: association modals use Radix `Dialog` while employee-facing modals use `BaseModal`, causing visual inconsistency.

## Plan

### 1. Fix ring clipping in CreateExperienceDialog
In the `ScrollArea`, the inner `div` already has `pr-2` for the scrollbar. Add symmetric horizontal padding (`px-1`) to give the focus ring room to render without being clipped by the overflow container.

**File:** `src/components/association/CreateExperienceDialog.tsx`
- Change inner div from `space-y-4 pt-2 pr-2` to `space-y-4 pt-2 px-1 pr-3` (1px left for ring, 3px right for ring + scrollbar)

### 2. Convert CreateExperienceDialog to BaseModal
Replace `Dialog`/`DialogContent`/`DialogHeader` with `BaseModal` for consistency with employee modals:
- Use `BaseModal` with `title="Nuova esperienza"`
- Scrollable content area with proper padding
- Fixed footer with the submit button (matching employee modal pattern)

### 3. Convert experience detail modal in AssociationExperiencesPage to BaseModal
The inline detail dialog also uses Radix `Dialog`. Convert to `BaseModal` with the same pattern used in the employee `ExperienceDetailModal`.

**Files to modify:**
| File | Change |
|------|--------|
| `src/components/association/CreateExperienceDialog.tsx` | Dialog → BaseModal, fix padding |
| `src/pages/association/AssociationExperiencesPage.tsx` | Detail Dialog → BaseModal |

No changes to shared UI components, no changes to employee-facing pages.

