-- Step 1.A: tb_requests.state come colonna GENERATED da status
ALTER TABLE public.tb_requests
ADD COLUMN state text GENERATED ALWAYS AS (
  CASE
    WHEN status IN ('quote_accepted') THEN 'confirmed'
    WHEN status IN ('completed') THEN 'completed'
    WHEN status IN ('cancelled', 'quote_rejected') THEN 'cancelled'
    ELSE 'open'
  END
) STORED;

-- Indice sulla nuova colonna per la lista HR
CREATE INDEX IF NOT EXISTS idx_tb_requests_state ON public.tb_requests(state);

-- Step 1.B: tb_proposals.is_active (default true)
ALTER TABLE public.tb_proposals
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Indice parziale: in pratica HR legge quasi sempre is_active = true
CREATE INDEX IF NOT EXISTS idx_tb_proposals_is_active
  ON public.tb_proposals(request_id)
  WHERE is_active = true;