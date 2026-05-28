## Obiettivo
Aggiornare i testi di 11 template email (6 auth + 1 hook + 4 transactional) rendendoli gender-neutral, aggiungendo emoji indicate e rimuovendo punti finali dalle frasi conclusive (per un tono più naturale).

## File coinvolti

### Auth templates (`supabase/functions/_shared/email-templates/`)
1. **signup.tsx** — Heading: "Ti diamo il benvenuto in Bravo! 💜". Testo: "Grazie per la registrazione. Conferma il tuo indirizzo email ({recipient}) cliccando il bottone qui sotto:"
2. **invite.tsx** — Heading: "Hai ricevuto un invito!". Testo: "Hai ricevuto un invito a unirti a Bravo!, la piattaforma per il volontariato aziendale 💜 Clicca il bottone qui sotto per accettare l'invito e creare il tuo account"
3. **magic-link.tsx** — Testo: "Clicca il bottone qui sotto per accedere al tuo account. Il link scadrà tra pochi minuti ⏲️"
4. **recovery.tsx** — Testo: "Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Bravo!. Clicca il bottone qui sotto per scegliere una nuova password 👇"
5. **email-change.tsx** — Primo testo: "Hai richiesto di cambiare il tuo indirizzo email su Bravo! da {email} a {newEmail}" (mantieni i due link mailto). Secondo testo invariato.
6. **reauthentication.tsx** — Testo: "Usa il codice qui sotto per confermare la tua identità 👇"

### Auth hook
7. **supabase/functions/auth-email-hook/index.ts** — `EMAIL_SUBJECTS.invite`: "Hai ricevuto un invito su Bravo!"

### Transactional templates (`supabase/functions/_shared/transactional-email-templates/`)
8. **booking-confirmation.tsx** — Intro default: "Ciao {firstName},\nLa tua prenotazione è stata confermata con successo! 😍". Closing default: "Ti aspettiamo! Grazie per il tuo impegno nel volontariato.\n\nIl team Bravo! 💜"
9. **booking-reminder.tsx** — Closing default: "Non vediamo l'ora di vederti! Grazie per il tuo impegno.\n\nIl team Bravo! 💜"
10. **feedback-request.tsx** — Paragrafo: "Speriamo che la tua esperienza con {experienceTitle} sia stata significativa! Il tuo feedback ci aiuta a migliorare e a creare esperienze ancora più belle 💜"
11. **manager-absence-notification.tsx** — Primo paragrafo: "ti informiamo che {fullName} non sarà in ufficio {eventDateLong}, dalle {startTime} alle {endTime}, perché parteciperà a un'attività di volontariato aziendale organizzata da {companyName} tramite Bravo!" (grassetti esistenti mantenuti). Secondo paragrafo: "Ti scriviamo perché {firstName} ha indicato il tuo indirizzo come riferimento. Se pensi ci sia un errore, puoi contattare {firstName} direttamente". Firma: "A presto,\nIl team Bravo! 💜"

## Vincoli
- Solo testo, nessuna modifica a struttura, variabili, stili o logica.
- I punti finali delle frasi conclusive vengono rimossi (laddove presenti).
- Emoji aggiunte solo dove esplicitamente richieste.