import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { suggestionKeys } from "./keys";
import type { AssociationSuggestion } from "./useSuggestionsList";

type Status = AssociationSuggestion["status"];

export function useUpdateSuggestionStatus(companyId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;
      const { error } = await supabase
        .from("association_suggestions")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      if (!companyId) return;
      const key = suggestionKeys.list(companyId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<AssociationSuggestion[]>(key);
      if (previous) {
        qc.setQueryData<AssociationSuggestion[]>(
          key,
          previous.map((s) => (s.id === id ? { ...s, status } : s)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (!companyId || !ctx?.previous) return;
      qc.setQueryData(suggestionKeys.list(companyId), ctx.previous);
    },
    onSettled: () => {
      if (companyId) qc.invalidateQueries({ queryKey: suggestionKeys.list(companyId) });
    },
  });
}
