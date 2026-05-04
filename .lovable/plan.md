## Piano: Short Description per TB Formats

### Cosa faremo

1. **Migrazione DB**: Aggiungere colonna `short_description TEXT` alla tabella `tb_formats`
2. **Generazione contenuti con AI**: Usare l'AI gateway per leggere le 70 descrizioni lunghe e generare un riassunto accattivante (1 frase, max ~120 caratteri) per ciascuna
3. **Inserimento dati**: Aggiornare tutti i 70 record con le nuove short_description generate
4. **Aggiornamento frontend**: Dove oggi viene mostrata la descrizione troncata (card, liste), usare `short_description` al posto di `description`
5. **Form di editing**: Aggiungere il campo `short_description` nel form di creazione/modifica dei TB formats (Super Admin)

### Dettagli tecnici

- Migrazione: `ALTER TABLE tb_formats ADD COLUMN short_description TEXT;`
- Script AI: batch processing con il modello Gemini Flash per generare i riassunti in italiano
- Frontend: aggiornare i componenti che mostrano le card dei TB formats e il form di editing nel Super Admin
- Il tipo TypeScript si aggiornerà automaticamente dopo la migrazione
