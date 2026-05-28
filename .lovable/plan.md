## Obiettivo
Le email transazionali e di auth arrivano con il nome mittente "bravo-experiences". Vanno aggiornate a "Team Bravo!".

## Modifiche
1. **`supabase/functions/send-transactional-email/index.ts`** — cambia `SITE_NAME` da `"bravo-experiences"` a `"Team Bravo!"`
2. **`supabase/functions/auth-email-hook/index.ts`** — cambia `SITE_NAME` da `"bravo-experiences"` a `"Team Bravo!"`
3. **Deploy** delle due edge functions aggiornate: `send-transactional-email` e `auth-email-hook`

Le email successive arriveranno con: `Team Bravo! <noreply@updates.bravoapp.it>`