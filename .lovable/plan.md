## Obiettivo

Aggiornare la sezione "Dominio aziendale" nella pagina `/hr/impostazioni/membri` ora che la funzionalità di registrazione via dominio email è attiva.

## Modifiche a `src/pages/hr/settings/SettingsMembers.tsx`

Sezione "Dominio aziendale":

1. **Rimuovere il badge "Presto"** (la funzionalità è attiva).
2. **Caricare i domini configurati** dell'azienda corrente leggendo `companies.allowed_email_domains` (array di stringhe) filtrato per `profile.company_id`. Caricamento in parallelo al fetch dei dipendenti già presente.
3. **Mostrare i domini attivi** al posto del singolo input readonly:
  - Se ci sono domini: lista di chip/badge con prefisso `@` (es. `@nomeazienda.com`), uno per dominio.
  - Se non ce ne sono: stato vuoto con messaggio "Nessun dominio configurato".
  - In stato di loading: piccoli Skeleton.
4. **Modificare leggermente la frase informativa** in "Contatta il tuo referente Bravo! per configurare o modificare il dominio aziendale."
5. **Aggiungere un bottone diretto** subito sotto la frase: `Contatta il team Bravo!` (variant `outline`, size `sm`, icona Mail) che apre un `mailto:` verso `team@bravoapp.it` con un subject precompilato del tipo `Configurazione dominio aziendale — <Nome azienda>`.

## Cosa NON cambia

- La sezione "Dipendenti registrati" resta invariata.
- Nessuna modifica al backend / RLS / schema (i campi esistono già e l'HR ha già accesso in lettura alla propria company).
- Nessuna logica di modifica dei domini lato HR (resta gestita dal team Bravo!).

## Note tecniche

- Fetch: `supabase.from("companies").select("name, allowed_email_domains").eq("id", profile.company_id).maybeSingle()`.
- Usare `devLog.error` per eventuali errori.
- Icona `Mail` da `lucide-react` per il bottone, coerente con lo stile attuale della pagina.