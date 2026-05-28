## Piano

1. **Correggere il branch specifico in `Register.tsx`**
   - Riconoscere `EMAIL_ALREADY_REGISTERED` prima degli altri errori.
   - Mostrare un messaggio utente chiaro: email già registrata, accedi o recupera la password.
   - Aggiungere un’azione/link diretto a `/forgot-password` nello stesso feedback.

2. **Evitare il fallback generico**
   - Non mostrare più `EMAIL_ALREADY_REGISTERED` come testo tecnico dentro “Errore di registrazione”.
   - Lasciare invariati rate limit, dominio non ammesso e tutti gli altri errori.

3. **Verifica mirata**
   - Controllare che il form resti sulla pagina registrazione, senza schermata “Controlla la tua email”.
   - Verificare che il feedback contenga il link/azione per recuperare la password.