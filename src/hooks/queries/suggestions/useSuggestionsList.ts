import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { suggestionKeys } from "./keys";

export interface AssociationSuggestion {
  id: string;
  company_id: string;
  suggested_name: string;
  suggested_city: string | null;
  suggester_name: string;
  suggester_email: string | null;
  reason: string | null;
  status: "new" | "seen" | "archived";
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export function useSuggestionsList(companyId: string | null | undefined) {
  return useQuery({
    queryKey: companyId ? suggestionKeys.list(companyId) : ["suggestions", "list", "none"],
    queryFn: async (): Promise<AssociationSuggestion[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("association_suggestions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssociationSuggestion[];
    },
    enabled: !!companyId,
  });
}
