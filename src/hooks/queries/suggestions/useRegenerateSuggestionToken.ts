import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { suggestionKeys } from "./keys";

export function useRegenerateSuggestionToken(companyId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("regenerate_suggestion_token");
      if (error) throw error;
      return data as string | null;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: suggestionKeys.token(companyId) });
    },
  });
}
