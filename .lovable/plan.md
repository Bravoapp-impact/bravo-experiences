

## Piano: Componente Wizard riutilizzabile

### Cosa estrarre

Un componente `StepWizard` generico che gestisce la struttura comune del wizard: stepper dots, navigazione avanti/indietro, layout container. Il contenuto di ogni step resta responsabilità del componente chiamante.

### API proposta

```tsx
<StepWizard
  totalSteps={6}
  currentStep={step}
  onNext={() => ...}
  onBack={() => ...}
  canNext={true}
  submitting={false}
  backLabel="Annulla"       // opzionale, default "Indietro"
  nextLabel="Avanti"        // opzionale, default "Avanti"
  onCancel={() => navigate(-1)}  // opzionale, per step 1
>
  {/* contenuto dello step corrente */}
</StepWizard>
```

### Cosa include il componente

1. **Stepper dots** — la barra di progresso con pallini e linee connesse, identica a quella attuale
2. **Container del contenuto** — il wrapper `bg-background` che renderizza `children`
3. **Barra di navigazione** — bottoni Indietro/Avanti con gestione loading, icone freccia, disabilitazione

### Cosa NON include

- Il layout esterno (HRLayout, AppLayout) — resta nel chiamante
- La logica di form state e validazione — resta nel chiamante
- Il contenuto degli step — passato come children

### File coinvolti

| File | Azione |
|------|--------|
| `src/components/common/StepWizard.tsx` | Nuovo componente |
| `src/pages/hr/HRNewTBRequestPage.tsx` | Refactor per usare StepWizard |

### Struttura del componente

```tsx
interface StepWizardProps {
  totalSteps: number;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  canNext: boolean;
  submitting?: boolean;
  backLabel?: string;   // per step 1 ("Annulla")
  nextLabel?: string;
  className?: string;
  children: React.ReactNode;
}
```

Il componente renderizza:
- `max-w-xl mx-auto py-6 space-y-6` come container
- Stepper dots con logica completed/current/future
- Children al centro
- Footer con i due bottoni

### Impatto su HRNewTBRequestPage

La pagina si semplifica: rimuove tutto il JSX di stepper e navigazione, mantiene solo `renderStep()` e la logica di form/submit, e wrappa il tutto in `<StepWizard>`.

