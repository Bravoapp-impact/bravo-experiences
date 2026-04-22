-- =============================================
-- TB INFRASTRUCTURE — Step 1
-- =============================================

-- 1. user_events (cross-cutting analytics)
CREATE TABLE public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_event_type ON public.user_events(event_type);
CREATE INDEX idx_user_events_created_at ON public.user_events(created_at DESC);

CREATE POLICY "Super admin full access on user_events"
  ON public.user_events FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can insert own events"
  ON public.user_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own events"
  ON public.user_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. tb_formats (catalog)
CREATE TABLE public.tb_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  category_id uuid REFERENCES public.categories(id),
  secondary_tags text[] DEFAULT '{}',
  location_type text NOT NULL DEFAULT 'both' CHECK (location_type IN ('indoor', 'outdoor', 'both')),
  participants_min integer,
  participants_max integer,
  duration_hours numeric,
  price_range_min numeric,
  price_range_max numeric,
  sdgs text[] DEFAULT '{}',
  services jsonb DEFAULT '{}',
  extra_services jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_formats ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tb_formats_status ON public.tb_formats(status);
CREATE INDEX idx_tb_formats_category_id ON public.tb_formats(category_id);

CREATE POLICY "Super admin full access on tb_formats"
  ON public.tb_formats FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. tb_format_associations (bridge)
CREATE TABLE public.tb_format_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id uuid NOT NULL REFERENCES public.tb_formats(id) ON DELETE CASCADE,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (format_id, association_id)
);
ALTER TABLE public.tb_format_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on tb_format_associations"
  ON public.tb_format_associations FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 4. tb_format_cities (bridge)
CREATE TABLE public.tb_format_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id uuid NOT NULL REFERENCES public.tb_formats(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (format_id, city_id)
);
ALTER TABLE public.tb_format_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on tb_format_cities"
  ON public.tb_format_cities FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 5. tb_requests
CREATE TABLE public.tb_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  requested_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  participants_min integer,
  participants_max integer,
  preferred_period_from date,
  preferred_period_to date,
  budget_estimate numeric,
  preferred_location_type text CHECK (preferred_location_type IS NULL OR preferred_location_type IN ('indoor', 'outdoor', 'both')),
  preferred_city_id uuid REFERENCES public.cities(id),
  extra_services jsonb DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'in_matching', 'proposals_sent', 'proposals_reviewed',
    'quote_requested', 'quote_in_composition', 'quote_sent', 'quote_accepted',
    'quote_rejected', 'signed', 'event_scheduled', 'completed', 'cancelled'
  )),
  assigned_admin_id uuid,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tb_requests_company_id ON public.tb_requests(company_id);
CREATE INDEX idx_tb_requests_status ON public.tb_requests(status);

CREATE POLICY "Super admin full access on tb_requests"
  ON public.tb_requests FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "HR can view own company tb_requests"
  ON public.tb_requests FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND company_id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "HR can insert own company tb_requests"
  ON public.tb_requests FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND company_id = public.get_user_company_id(auth.uid())
    AND requested_by = auth.uid()
  );

CREATE POLICY "HR can update own company tb_requests"
  ON public.tb_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND company_id = public.get_user_company_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND company_id = public.get_user_company_id(auth.uid())
  );

-- 6. tb_proposals
CREATE TABLE public.tb_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tb_requests(id) ON DELETE CASCADE,
  format_id uuid NOT NULL REFERENCES public.tb_formats(id),
  override_association_id uuid REFERENCES public.associations(id),
  priority integer NOT NULL DEFAULT 1,
  admin_notes text,
  client_status text NOT NULL DEFAULT 'pending' CHECK (client_status IN ('pending', 'interested', 'needs_clarification', 'declined')),
  client_decision_at timestamptz,
  client_notes text,
  association_visibility text NOT NULL DEFAULT 'visible' CHECK (association_visibility IN ('visible', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on tb_proposals"
  ON public.tb_proposals FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "HR can view proposals for own requests"
  ON public.tb_proposals FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_proposals.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "HR can update proposal client_status"
  ON public.tb_proposals FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_proposals.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_proposals.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- 7. tb_quotes
CREATE TABLE public.tb_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tb_requests(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'accepted', 'rejected', 'modification_requested', 'superseded'
  )),
  total_amount_final numeric,
  total_amount_ets numeric,
  bravo_margin_amount numeric,
  bravo_margin_percent numeric,
  valid_until date,
  terms_text text,
  pdf_url text,
  client_decision_notes text,
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on tb_quotes"
  ON public.tb_quotes FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "HR can view quotes for own requests"
  ON public.tb_quotes FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_quotes.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "HR can update quotes for own requests"
  ON public.tb_quotes FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_quotes.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_quotes.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- 8. tb_quote_items
CREATE TABLE public.tb_quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.tb_quotes(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.tb_proposals(id),
  association_id uuid REFERENCES public.associations(id),
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price_ets numeric,
  unit_price_final numeric,
  total_ets numeric,
  total_final numeric,
  notes text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on tb_quote_items"
  ON public.tb_quote_items FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- HR sees only client-facing columns via application layer (unit_price_final, total_final)
CREATE POLICY "HR can view quote items for own requests"
  ON public.tb_quote_items FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_quotes q
      JOIN public.tb_requests r ON r.id = q.request_id
      WHERE q.id = tb_quote_items.quote_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- 9. tb_matching_decisions (AI training log)
CREATE TABLE public.tb_matching_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tb_requests(id) ON DELETE CASCADE,
  format_id uuid REFERENCES public.tb_formats(id),
  association_id uuid REFERENCES public.associations(id),
  decision text NOT NULL CHECK (decision IN (
    'shown_in_filter', 'selected_as_proposal', 'discarded',
    'client_interested', 'client_declined', 'client_needs_clarification'
  )),
  decided_by uuid,
  decision_reason text,
  context jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_matching_decisions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tb_matching_request ON public.tb_matching_decisions(request_id);

CREATE POLICY "Super admin full access on tb_matching_decisions"
  ON public.tb_matching_decisions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 10. tb_contracts
CREATE TABLE public.tb_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tb_requests(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES public.tb_quotes(id),
  signature_method text NOT NULL DEFAULT 'manual_external' CHECK (signature_method IN ('manual_external', 'click_in_app')),
  signed_at timestamptz,
  signer_profile_id uuid,
  signer_ip text,
  signer_user_agent text,
  contract_pdf_url text,
  terms_version_signed text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access on tb_contracts"
  ON public.tb_contracts FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "HR can view contracts for own requests"
  ON public.tb_contracts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_contracts.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- 11. tb_events
CREATE TABLE public.tb_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tb_requests(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.tb_contracts(id),
  title text NOT NULL,
  scheduled_datetime timestamptz,
  location_name text,
  location_address text,
  status text NOT NULL DEFAULT 'pending_date' CHECK (status IN ('pending_date', 'date_confirmed', 'in_progress', 'completed')),
  public_slug text UNIQUE,
  max_participants integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tb_events_public_slug ON public.tb_events(public_slug);

CREATE POLICY "Super admin full access on tb_events"
  ON public.tb_events FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "HR can view events for own requests"
  ON public.tb_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_requests r
      WHERE r.id = tb_events.request_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- 12. tb_event_participants
CREATE TABLE public.tb_event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.tb_events(id) ON DELETE CASCADE,
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  dietary_restrictions text,
  privacy_accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tb_event_participants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tb_event_participants_event ON public.tb_event_participants(event_id);

CREATE POLICY "Super admin full access on tb_event_participants"
  ON public.tb_event_participants FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "HR can view participants for own events"
  ON public.tb_event_participants FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'hr_admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.tb_events ev
      JOIN public.tb_requests r ON r.id = ev.request_id
      WHERE ev.id = tb_event_participants.event_id
        AND r.company_id = public.get_user_company_id(auth.uid())
    )
  );

-- Public registration (anon insert via public slug — application layer validates)
CREATE POLICY "Anyone can register for public events"
  ON public.tb_event_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tb_events ev
      WHERE ev.id = tb_event_participants.event_id
        AND ev.public_slug IS NOT NULL
        AND ev.status IN ('date_confirmed', 'in_progress')
    )
    AND privacy_accepted = true
  );

-- =============================================
-- updated_at triggers
-- =============================================

CREATE TRIGGER update_tb_formats_updated_at
  BEFORE UPDATE ON public.tb_formats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tb_requests_updated_at
  BEFORE UPDATE ON public.tb_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tb_proposals_updated_at
  BEFORE UPDATE ON public.tb_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tb_quotes_updated_at
  BEFORE UPDATE ON public.tb_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tb_events_updated_at
  BEFORE UPDATE ON public.tb_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();