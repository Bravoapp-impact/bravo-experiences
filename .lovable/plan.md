

# Piano: Import Catalogo TB da CSV Storico

## Panoramica

Utilizzare lo script Python fornito (`generate_import_sql.py`) per importare i dati dal CSV della vecchia piattaforma nella tabella `tb_formats` e relative bridge tables. Lo script necessita di alcune correzioni prima dell'esecuzione.

---

## Problemi da correggere nello script

1. **Colonna `is_nationwide` → `nationwide`**: lo script usa `is_nationwide` ma la colonna nel DB si chiama `nationwide`. Da rinominare nel SQL generato.

2. **Città mancanti nel DB**: il DB contiene solo 3 città (Carpi, Milano, Soliera). Il CSV referenzia ~18 province (BA, BG, BI, BO, BS, GE, LC, MI, MN, MO, PR, RA, RE, RM, RN, TO, TV, VR). Bisogna inserire le città mancanti prima dell'import.

3. **Associazioni mancanti**: il DB ha solo associazioni di test. Il match ILIKE non troverà quasi nulla. I format entreranno come draft senza ETS — corretto per design (il Super Admin le assegnerà poi).

4. **Path CSV e output**: adattare ai path del sandbox (`/tmp/`).

---

## Passi di esecuzione

### Passo 1 — Inserire le città mancanti

Inserire nella tabella `cities` le città capoluogo di provincia referenziate nel CSV che non esistono ancora: Bari, Bergamo, Biella, Bologna, Brescia, Genova, Lecco, Mantova, Modena, Parma, Ravenna, Reggio Emilia, Roma, Rimini, Torino, Treviso, Verona.

### Passo 2 — Correggere e lanciare lo script Python

- Copiare il CSV nel sandbox
- Correggere lo script: `is_nationwide` → `nationwide`, path aggiornati
- Eseguire lo script per generare il file SQL
- Verificare l'output generato (numero di format, warnings)

### Passo 3 — Eseguire l'SQL di import

Lanciare l'SQL generato come migration (contiene solo INSERT, nessuna modifica schema — ma dato che abbiamo bisogno di eseguire DO blocks con logica procedurale, useremo una migration).

### Passo 4 — Verifiche post-import

- Conteggio format per stato (`draft` / `archived`)
- Format senza ETS in bridge (atteso: quasi tutti, visto che le associazioni reali non sono ancora nel DB)
- Format `nationwide` = true
- Format senza città in bridge (per province non mappate)

---

## Stato risultante

Tutti i format entrano in **draft** (tranne i `rejected` del CSV → `archived`). Il campo `category_id` resta NULL — la validazione impedisce la pubblicazione finché il Super Admin non assegna categoria, ETS e verifica i dati.

---

## File coinvolti

| Azione | File |
|---|---|
| Script Python (corretto) | `/tmp/generate_import_sql.py` |
| CSV sorgente | copiato da upload |
| SQL generato | `/tmp/import-tb-formats.sql` |
| Migration | `supabase/migrations/...` (per le città + import) |

Nessuna modifica al codice dell'app — solo dati.

