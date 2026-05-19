import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { suggestionKeys } from "./keys";

export function useCompanySuggestionToken(companyId: string | null | undefined) {
  return useQuery({
    queryKey: companyId ? suggestionKeys.token(companyId) : ["suggestions", "token", "none"],
    queryFn: async (): Promise<string | null> => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("suggestion_token")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return (data?.suggestion_token as string) ?? null;
    },
    enabled: !!companyId,
  });
}
