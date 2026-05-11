# CLAUDE.md

## 1. Come parlare con Filippo

Italiano, tono diretto. Vai al punto, ragiona per causa-effetto. Niente analisi inutili, niente preamboli, niente elenchi puntati quando va bene la prosa.

Non confermare per default. Se una richiesta è ambigua, contraddice un principio già fissato, o ha un costo nascosto, dillo prima di procedere. Il valore che porti è il confronto, non l'esecuzione cieca.

Non inventare. Se non sai dove sta una funzione, una tabella, una policy: leggi il file, fai una query, chiedi. Mai descrivere codice "verosimile" che non hai verificato.

Ogni intervento parte da un brief con tre cose esplicite: **cosa cambia**, **perché cambia**, **cosa NON deve cambiare**. Se il brief manca della terza, chiedila prima di scrivere. È la regola più importante: senza guard rail espliciti tendi a riordinare e ottimizzare cose che non andrebbero toccate.

A fine sessione, prima di chiudere, aggiorna `/docs/architettura.md` se hai toccato schema, RLS, RPC o edge function, e aggiungi una entry in `/docs/log.md`. Se è rimasto qualcosa di aperto, registralo in `/docs/aperto.md`.

---

## 2. Regole di sicurezza sul codice

Bravo! è in produzione con clienti veri. Un errore su RLS, RPC o auth può esporre dati sensibili o margini commerciali. Le regole sotto non sono raccomandazioni: sono vincoli.

**Mai DROP + CREATE nello stesso step.** Le RLS sullo stesso oggetto sono valutate in OR: aggiungere una policy nuova prima di rimuovere quella vecchia è sempre sicuro, l'inverso è un punto di non ritorno. Stessa regola per colonne, funzioni, indici critici. Aggiungi prima, rimuovi dopo — o non rimuovere e segnala in `/docs/aperto.md`.

**Mai modificare RLS, RPC SECURITY DEFINER, auth check o policy esistenti senza brief esplicito.** Il rischio più frequente nei refactor assistiti da AI è la rimozione silenziosa di un controllo di accesso durante un riordino del codice. Se durante un task incontri un check che ti sembra ridondante o malfatto, fermati e chiedi prima di toccarlo. Non è mai ridondante per default.

**Tutte le funzioni `SECURITY DEFINER` devono avere `SET search_path = public, pg_temp`** dentro la definizione. Senza, sono vulnerabili a search_path hijacking. Su ogni funzione nuova: `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC` e poi `GRANT EXECUTE TO authenticated` (o al ruolo specifico). Mai lasciare permessi di esecuzione a `PUBLIC`.

**Le RPC SECURITY DEFINER devono sempre verificare autorizzazione in cima al corpo**, prima di qualsiasi `SELECT`/`INSERT`/`UPDATE`. Pattern: prima `has_role(auth.uid(), ...)`, poi il controllo di ownership sul dato (es. `company_id = get_user_company_id(auth.uid())`), poi la logica. Se manca uno dei due, è un bug di sicurezza, non un'ottimizzazione.

**Separazione HR / super-admin a livello di RPC, non solo di view.** Le letture HR su dati sensibili passano per RPC dedicate (`get_tb_quote_for_hr`, `get_tb_quote_items_for_hr`, ...). Le RPC parallele super-admin sono separate. Non collassare le due in un'unica funzione "intelligente": la separazione è l'auditabilità.

**`REVOKE` column-level sui dati sensibili.** Margini ETS, prezzi ETS, costi interni: mai accessibili a `authenticated` in lettura diretta. L'HR vede `unit_price_final` e `total_final`, mai `unit_price_ets`, `total_ets`, `bravo_margin_*`. Se proponi una nuova colonna che contiene un dato di costo o margine, applica `REVOKE` esplicito nella stessa migration.

**Mai chiavi `service_role` o segreti lato client.** Le variabili `VITE_*` sono esposte al browser by design: usale solo per URL pubblici e chiavi `anon`. Tutto il resto va nel vault Supabase o nelle env delle edge function. Se un'edge function deve essere chiamata solo da altre edge function, mantieni il pattern `verify_jwt = true` + check esplicito su `role = 'service_role'`.

**Self-review obbligatoria su aree sensibili.** Dopo una modifica che tocca auth, RLS, RPC, edge function o policy: fai un secondo passaggio sul tuo output con la domanda "se fossi un attaccante con accesso autenticato a un'altra company, riuscirei a leggere o modificare dati che non sono miei?". Riporta a Filippo il risultato di questo passaggio, anche quando è negativo.

## 3. Regole operative

**`git pull origin main` come primo gesto, sempre.** `git push origin main` come ultimo gesto, sempre. Mai chiudere una sessione con modifiche locali non pushate.

**Commit message: `[area] descrizione breve`.** Esempi: `[tb-quote] fix race condition versioning`, `[volunteering] aggiunto filtro città`, `[email] wrapper send-tb-quote-sent`, `[docs] aggiornata architettura post sprint TB`. Una modifica = un commit logico. Non accorpare cambi non correlati.

**Aggiornamento `/docs/` a fine sessione.** Se hai toccato schema, RLS, RPC o edge function → aggiorna `architettura.md`. Sempre → una entry in `log.md` con data, titolo, una frase su cosa cambia, hash del commit. Se è rimasto un debito (un fix mancato, una decisione aperta, un test da fare) → riga in `aperto.md`.

**Dipendenze.** Mai aggiungere pacchetti npm senza spiegare perché servono e qual è l'alternativa "senza nuovo pacchetto". Le dipendenze di Bravo! sono già abbastanza: aggiungerne va giustificato.

---

## In caso di dubbio

Fermati e chiedi. Una sessione che finisce con una domanda aperta è sempre meglio di una sessione che finisce con codice in produzione che nessuno capisce. La velocità è un effetto collaterale del fare le cose giuste, non l'obiettivo.