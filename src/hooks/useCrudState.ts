import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";

interface UseCrudStateOptions<T> {
  tableName: string;
  orderBy?: { column: keyof T; ascending?: boolean };
  searchFields?: (keyof T)[];
  fetchOnMount?: boolean;
  idField?: keyof T;
}

interface UseCrudStateReturn<T> {
  items: T[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  saving: boolean;
  fetchItems: () => Promise<void>;
  handleSave: (payload: Partial<T>, onSuccess?: () => void) => Promise<boolean>;
  handleDelete: (onSuccess?: () => void) => Promise<boolean>;
  filteredItems: T[];
}

export function useCrudState<T>({
  tableName,
  orderBy,
  searchFields = [],
  fetchOnMount = true,
  idField = "id" as keyof T,
}: UseCrudStateOptions<T>): UseCrudStateReturn<T> {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Stabilize orderBy values to prevent infinite re-fetches
  const orderByColumn = orderBy?.column ? String(orderBy.column) : undefined;
  const orderByAscending = orderBy?.ascending ?? true;

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      // Cast to any to handle dynamic table names with Supabase typed client
      const tableRef = supabase.from(tableName as any);
      let query = tableRef.select("*");

      if (orderByColumn) {
        query = query.order(orderByColumn, {
          ascending: orderByAscending,
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems((data as unknown as T[]) || []);
    } catch (error) {
      devLog.error(`Error fetching ${tableName}:`, error);
      toast({
        title: "Errore",
        description: `Impossibile caricare i dati`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tableName, orderByColumn, orderByAscending, toast]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchItems();
    }
  }, [fetchOnMount, fetchItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim() || searchFields.length === 0) {
      return items;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [items, searchTerm, searchFields]);

  const handleSave = useCallback(
    async (payload: Partial<T>, onSuccess?: () => void): Promise<boolean> => {
      try {
        setSaving(true);
        const id = selectedItem?.[idField];
        const tableRef = supabase.from(tableName as any);

        if (id) {
          // Update existing item
          const { error } = await tableRef
            .update(payload as any)
            .eq(String(idField), id as any);

          if (error) throw error;

          toast({
            title: "Salvato",
            description: "Elemento aggiornato con successo",
          });
        } else {
          // Create new item
          const { error } = await tableRef.insert(payload as any);

          if (error) throw error;

          toast({
            title: "Creato",
            description: "Elemento creato con successo",
          });
        }

        await fetchItems();
        setDialogOpen(false);
        setSelectedItem(null);
        onSuccess?.();
        return true;
      } catch (error) {
        console.error(`Error saving ${tableName}:`, error);
        toast({
          title: "Errore",
          description: "Impossibile salvare l'elemento",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [selectedItem, idField, tableName, fetchItems, toast]
  );

  const handleDelete = useCallback(
    async (onSuccess?: () => void): Promise<boolean> => {
      if (!selectedItem) return false;

      try {
        setSaving(true);
        const id = selectedItem[idField];
        const tableRef = supabase.from(tableName as any);

        const { error } = await tableRef
          .delete()
          .eq(String(idField), id as any);

        if (error) throw error;

        toast({
          title: "Eliminato",
          description: "Elemento eliminato con successo",
        });

        await fetchItems();
        setDeleteDialogOpen(false);
        setSelectedItem(null);
        onSuccess?.();
        return true;
      } catch (error) {
        console.error(`Error deleting ${tableName}:`, error);
        toast({
          title: "Errore",
          description: "Impossibile eliminare l'elemento",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [selectedItem, idField, tableName, fetchItems, toast]
  );

  return {
    items,
    loading,
    searchTerm,
    setSearchTerm,
    selectedItem,
    setSelectedItem,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    saving,
    fetchItems,
    handleSave,
    handleDelete,
    filteredItems,
  };
}
