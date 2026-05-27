## 1. Refactor `src/components/common/SettingsPage.tsx` per usare `PageHeader`

Oggi `SettingsPage` ha un header costruito a mano (h2 + p, animazione `y:8`, niente `min-h-[44px]`). Le pagine HR top-level usano invece `PageHeader` (h1 `text-xl font-bold`, animazione `y:-10`, container `min-h-[44px]`). Da qui la percezione di layout diverso.

Soluzione: rendere `SettingsPage` un thin wrapper che delega l'header al componente `PageHeader` condiviso.

- Importare `PageHeader` da `@/components/common/PageHeader`.
- Sostituire il blocco header interno con `<PageHeader title={...} description={...} icon={Icon} iconColor={iconColor} className="mb-6" />`.
- Mantenere il wrapper `motion.div` per la fade-in del contenuto (animazione invariata sul body), ma l'header userà l'animazione di `PageHeader` stesso → coerente con il resto.
- API pubblica invariata (title, description?, icon?, iconColor?, children, className).

Effetto: tutte le pagine impostazioni HR avranno titolo + icona identici per tipografia, spaziatura, animazione e allineamento alle pagine `/hr/*` top-level.

## 2. Pagina Membri — `src/pages/hr/settings/SettingsMembers.tsx`

Modifica saltata nel passaggio precedente:
- Importare `Users` da `lucide-react`.
- Sostituire `<SettingsPage title="Membri e accessi" description="...">` con `<SettingsPage title="Membri e accessi" icon={Users} iconColor="text-green-500">` (rimossa la description, aggiunta icona coerente con la sidebar).

## Cosa NON tocchiamo

- Logica/contenuto delle pagine impostazioni (sezioni interne, domini, tabella dipendenti).
- Le altre pagine già aggiornate (Profilo, Generali, Volontariato, Tema, Sicurezza, Report): erediteranno automaticamente il nuovo header allineato grazie al refactor di `SettingsPage`.
- `PageHeader` resta invariato.
