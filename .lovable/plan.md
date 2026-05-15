# Disabilitare animazioni di ingresso per eliminare il micro-flicker

## Diagnosi

Lo skeleton ha tolto lo "spinner → spinner". Il micro-flicker residuo è dato dalle animazioni di ingresso framer-motion (`initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1 }}`) presenti su ~30 pagine e in `AppLayout` / `AdminLayout`. Quando i dati arrivano, lo skeleton viene sostituito dal contenuto che parte invisibile e fa fade-in: in quella frazione di secondo lo schermo "lampeggia".

## Soluzione

Una sola modifica chirurgica in `src/App.tsx`: avvolgere l'intero albero in `<MotionConfig reducedMotion="always">` di framer-motion.

Effetto:
- Tutti i `motion.*` esistenti **saltano** la transizione e vanno direttamente allo stato `animate`. Niente fade-in iniziale, niente slide-in, niente delay a cascata.
- Le librerie di terze parti basate su framer-motion (es. radix tramite shadcn) non sono toccate — usano CSS keyframes Tailwind (accordion-down/up) che restano.
- Hover/tap interactions e animazioni esplicite di feedback (es. spinner di submit) restano invariate, perché non sono entry animations.

```text
src/App.tsx
  <QueryClientProvider>
    <ThemeProvider>
      <MotionConfig reducedMotion="always">    ← nuovo
        <AuthProvider> ... </AuthProvider>
      </MotionConfig>
    </ThemeProvider>
  </QueryClientProvider>
```

## Cosa NON tocco
- I singoli `motion.div` nelle pagine (restano nel codice, semplicemente "non animano" l'entrata). Vantaggio: zero rischio di regressioni, reversibile in una riga.
- Animazioni CSS di componenti UI (accordion, dialog, sheet) — sono brevi, non causano flicker.
- Skeleton (`animate-pulse`) — è il segnale di caricamento richiesto.
- Spinner residui dentro pulsanti submit / upload.

## Verifica
- Navigare `/login → /hr → /hr/volontariato → /hr/users → /app/experiences` osservando che il contenuto compaia "secco" appena pronto, senza fade né slide.
- Confermare che hover su card/pulsanti funzioni ancora (non è entry animation).

## Fuori scope
- Rimozione fisica dei `motion.*` dal codice. Se in futuro vuoi un cleanup definitivo lo facciamo a parte; oggi non serve per risolvere il flicker.
