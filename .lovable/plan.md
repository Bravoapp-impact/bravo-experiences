# Hardening sicurezza preventivi TB (DB-only)

## 1. Ricognizione (verificata)

**Policy esistenti su `tb_quotes`:**
- `Super admin full access on tb_quotes` (ALL) — `has_role(auth.uid(), 'super_admin'::app_role)`
- `HR can view quotes for own requests` (SELECT) — hr_admin + company match
- `HR can update quotes for own requests` (UPDATE) — hr_admin + company match  ← **da rimuovere**

**Policy esistenti su `tb_quote_items`:**
- `Super admin full access on tb_quote_items` (ALL)
- `HR can view quote items for own requests` (SELECT) — hr_admin + company match via JOIN su tb_quotes/tb_requests

**Colonne `tb_quotes`:** id, request_id, version, status, total_amount_final, total_amount_ets, bravo_margin_amount, bravo_margin_percent, valid_until, terms_text, pdf_url, client_decision_notes, sent_at, viewed_at, decided_at, created_by, created_at, updated_at.
→ **Non esiste `currency`**: la RPC restituirà `'EUR'` hardcoded.

**Uso applicativo attuale di `tb_quotes` / `tb_quote_items`:**
`rg` su `src/` e `supabase/functions/` non trova nessuna lettura/scrittura. Le uniche occorrenze sono in `src/integrations/supabase/types.ts` (autogenerato) e nella migration originale. → **Il REVOKE colonne non rompe nulla di vivo.** Il super-admin oggi non legge queste tabelle dal client; quando l'editor preventivo verrà costruito, accederà tramite ruolo `super_admin` (che bypassa colonne via policy `ALL` solo perché RLS non filtra colonne — vedi nota sotto) **oppure** tramite RPC dedicate. Per non rompere il super-admin futuro: i REVOKE colonne saranno solo verso `authenticated`, NON verso `service_role` né verso il role owner. Il super-admin, loggato come `authenticated`, **subirà anch'esso il REVOKE**: dovrà leggere via RPC SECURITY DEFINER. È accettabile perché l'editor super-admin non esiste ancora → quando lo costruiremo, useremo una RPC `get_tb_quote_full_for_admin` (fuori scope di questa migration, da pianificare al momento dell'editor).

## 2. Strategia

Tre RPC `SECURITY DEFINER` come unico canale HR per leggere/decidere preventivi. Policy SELECT ristrette a quote non-`draft`/non-`superseded`. Policy UPDATE HR rimossa (le decisioni passano solo dalla RPC). REVOKE colonne sensibili al ruolo `authenticated`.

Ordine eseguibile: **(1) RPC → (2) policy SELECT più restrittive → (3) REVOKE colonne → (4) DROP policy UPDATE HR**. Ogni blocco è autonomo; eseguito in quest'ordine, l'HR non perde mai accesso ai dati che gli spettano.

## 3. Migration SQL

### Blocco 1 — Nuove RPC

```sql
-- 1a. Lettura quote attiva per HR
CREATE OR REPLACE FUNCTION public.get_tb_quote_for_hr(p_request_id uuid)
RETURNS TABLE (
  id uuid, request_id uuid, version integer, status text,
  total_amount_final numeric, currency text,
  valid_until date, terms_text text, client_decision_notes text,
  sent_at timestamptz, viewed_at timestamptz, decided_at timestamptz,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM tb_requests r
    WHERE r.id = p_request_id
      AND r.company_id = get_user_company_id(auth.uid())
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT q.id, q.request_id, q.version, q.status,
         q.total_amount_final, 'EUR'::text AS currency,
         q.valid_until, q.terms_text, q.client_decision_notes,
         q.sent_at, q.viewed_at, q.decided_at,
         q.created_at, q.updated_at
  FROM tb_quotes q
  WHERE q.request_id = p_request_id
    AND q.status NOT IN ('draft', 'superseded')
  ORDER BY q.version DESC
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_quote_for_hr(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_quote_for_hr(uuid) TO authenticated;

-- 1b. Lettura items per HR
CREATE OR REPLACE FUNCTION public.get_tb_quote_items_for_hr(p_quote_id uuid)
RETURNS TABLE (
  id uuid, quote_id uuid, description text, quantity numeric,
  unit_price_final numeric, total_final numeric,
  notes text, display_order integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM tb_quotes q
    JOIN tb_requests r ON r.id = q.request_id
    WHERE q.id = p_quote_id
      AND r.company_id = get_user_company_id(auth.uid())
      AND q.status NOT IN ('draft', 'superseded')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT i.id, i.quote_id, i.description, i.quantity,
         i.unit_price_final, i.total_final, i.notes, i.display_order
  FROM tb_quote_items i
  WHERE i.quote_id = p_quote_id
  ORDER BY i.display_order ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tb_quote_items_for_hr(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_tb_quote_items_for_hr(uuid) TO authenticated;

-- 1c. Decisione HR su quote
CREATE OR REPLACE FUNCTION public.hr_decide_on_quote(
  p_quote_id uuid,
  p_decision text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = public SET row_security = off
AS $$
DECLARE
  v_request_id uuid;
  v_status text;
  v_new_quote_status text;
  v_new_request_status text;
BEGIN
  IF NOT has_role(auth.uid(), 'hr_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT q.request_id, q.status INTO v_request_id, v_status
  FROM tb_quotes q
  JOIN tb_requests r ON r.id = q.request_id
  WHERE q.id = p_quote_id
    AND r.company_id = get_user_company_id(auth.uid());

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_status NOT IN ('sent', 'viewed') THEN
    RAISE EXCEPTION 'bad_state: quote is %', v_status;
  END IF;

  IF p_decision = 'accepted' THEN
    v_new_quote_status := 'accepted';
    v_new_request_status := 'quote_accepted';
  ELSIF p_decision = 'rejected' THEN
    v_new_quote_status := 'rejected';
    v_new_request_status := 'quote_rejected';
  ELSIF p_decision = 'modification_requested' THEN
    IF p_notes IS NULL OR length(btrim(p_notes)) = 0 THEN
      RAISE EXCEPTION 'missing_notes';
    END IF;
    v_new_quote_status := 'modification_requested';
    v_new_request_status := 'quote_in_composition';
  ELSE
    RAISE EXCEPTION 'bad_decision: %', p_decision;
  END IF;

  UPDATE tb_quotes
  SET status = v_new_quote_status,
      decided_at = now(),
      client_decision_notes = COALESCE(p_notes, client_decision_notes),
      updated_at = now()
  WHERE id = p_quote_id;

  UPDATE tb_requests
  SET status = v_new_request_status,
      updated_at = now()
  WHERE id = v_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hr_decide_on_quote(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hr_decide_on_quote(uuid, text, text) TO authenticated;
```

### Blocco 2 — Policy SELECT più restrittive

```sql
DROP POLICY IF EXISTS "HR can view quotes for own requests" ON public.tb_quotes;
CREATE POLICY "HR can view non-draft quotes for own requests"
  ON public.tb_quotes FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'hr_admin'::app_role)
    AND status NOT IN ('draft', 'superseded')
    AND EXISTS (
      SELECT 1 FROM tb_requests r
      WHERE r.id = tb_quotes.request_id
        AND r.company_id = get_user_company_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "HR can view quote items for own requests" ON public.tb_quote_items;
CREATE POLICY "HR can view items of non-draft quotes for own requests"
  ON public.tb_quote_items FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1
      FROM tb_quotes q
      JOIN tb_requests r ON r.id = q.request_id
      WHERE q.id = tb_quote_items.quote_id
        AND r.company_id = get_user_company_id(auth.uid())
        AND q.status NOT IN ('draft', 'superseded')
    )
  );
```

### Blocco 3 — REVOKE colonne sensibili

```sql
REVOKE SELECT (total_amount_ets, bravo_margin_amount, bravo_margin_percent)
  ON public.tb_quotes FROM authenticated;

REVOKE SELECT (unit_price_ets, total_ets, association_id, proposal_id)
  ON public.tb_quote_items FROM authenticated;
```

Nota: le RPC del Blocco 1 girano come owner (postgres), quindi possono comunque leggere queste colonne quando servono internamente (oggi non vengono esposte a HR).

### Blocco 4 — Rimozione UPDATE HR su tb_quotes

```sql
DROP POLICY IF EXISTS "HR can update quotes for own requests" ON public.tb_quotes;
```

Da qui in poi l'HR può cambiare lo stato del preventivo **solo** via `hr_decide_on_quote`.

## 4. Come testare

Setup test: un utente `hr_admin` X di company A, una `tb_request` di company A, due `tb_quotes`: Q_draft (status=`draft`), Q_sent (status=`sent`). Una `tb_quote_items` su Q_sent.

**Blocco 1 — RPC:**
```sql
-- come HR di company A
SELECT * FROM get_tb_quote_for_hr('<request_id>');
-- atteso: 1 riga (Q_sent), nessuna colonna ets/margin
SELECT * FROM get_tb_quote_items_for_hr('<Q_sent_id>');
-- atteso: items ordinati per display_order, senza colonne ets
SELECT get_tb_quote_for_hr('<request_id_di_altra_company>');
-- atteso: ERROR forbidden
SELECT hr_decide_on_quote('<Q_sent_id>', 'modification_requested', NULL);
-- atteso: ERROR missing_notes
SELECT hr_decide_on_quote('<Q_sent_id>', 'accepted', NULL);
-- atteso: void; verifica tb_quotes.status='accepted', tb_requests.status='quote_accepted'
SELECT hr_decide_on_quote('<Q_sent_id>', 'accepted', NULL);
-- atteso: ERROR bad_state (è già accepted)
```

**Blocco 2 — Policy SELECT:**
```sql
-- come HR di company A
SELECT id, status FROM tb_quotes WHERE request_id = '<request_id>';
-- atteso: solo Q_sent (Q_draft filtrato)
SELECT id FROM tb_quote_items WHERE quote_id = '<Q_draft_id>';
-- atteso: 0 righe (la quote draft non è visibile)
```

**Blocco 3 — REVOKE colonne:**
```sql
-- come HR
SELECT total_amount_ets FROM tb_quotes WHERE id = '<Q_sent_id>';
-- atteso: ERROR permission denied for column total_amount_ets
SELECT total_amount_final FROM tb_quotes WHERE id = '<Q_sent_id>';
-- atteso: OK
SELECT unit_price_ets FROM tb_quote_items WHERE quote_id = '<Q_sent_id>';
-- atteso: ERROR permission denied
SELECT * FROM get_tb_quote_for_hr('<request_id>');
-- atteso: continua a funzionare (la RPC bypassa column-grants)
```

**Blocco 4 — DROP UPDATE policy:**
```sql
-- come HR
UPDATE tb_quotes SET status='accepted' WHERE id='<Q_sent_id>';
-- atteso: 0 righe aggiornate (RLS blocca, non c'è più USING per UPDATE)
SELECT hr_decide_on_quote('<Q_sent_id>', 'rejected', NULL);
-- atteso: void (l'unico canale rimasto funziona)
```

## 5. Note operative

- **Super admin futuro:** quando costruiremo l'editor preventivo per super-admin, dovrà usare RPC `SECURITY DEFINER` dedicate (non `select *` da client come `authenticated`), perché il REVOKE colpisce anche lui se loggato come `authenticated`. Da pianificare in quel momento, fuori scope qui.
- **PDF (`pdf_url`):** non esposto in V1. Quando servirà, aggiungeremo una RPC dedicata o uno Storage signed URL.
- **Niente trigger:** lo state-flow vive solo in `hr_decide_on_quote`.
- **Nessun rischio di rottura attuale:** nessun codice client/edge legge oggi `tb_quotes` o `tb_quote_items`.
