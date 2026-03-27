

# Piano: Profilo Impostazioni stile Attio

## Problema
La pagina profilo ha campi stretti (`max-w-sm`), avatar non allineato con i campi, e Nome/Cognome non affiancati. Nello screenshot Attio: campi First Name e Last Name sono side-by-side su griglia a 2 colonne, email full-width, avatar con label e bottone upload affiancati, tutto centrato con larghezza generosa.

## Modifiche

### 1. `src/pages/hr/settings/SettingsProfile.tsx`
Ristrutturare il layout per replicare Attio:
- Rimuovere `max-w-sm` dai contenitori campi
- Avatar: layout orizzontale con avatar a sinistra, a destra titolo "Foto profilo", descrizione "Supportiamo PNG, JPEG e GIF sotto 10MB", e bottone upload sotto
- Nome e Cognome: griglia a 2 colonne (`grid grid-cols-1 sm:grid-cols-2 gap-4`) — affiancati su desktop, impilati su mobile
- Email: full-width, read-only
- Bottone salva: visibile solo quando ci sono modifiche, allineato a destra
- Sezione Sicurezza: stessa larghezza, password + bottone affiancati

### 2. `src/components/layout/HRSettingsLayout.tsx`
Nessuna modifica — il `max-w-4xl mx-auto` è corretto per il centraggio.

## File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/hr/settings/SettingsProfile.tsx` | Ristrutturazione layout campi |

