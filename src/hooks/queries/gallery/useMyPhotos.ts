import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { galleryKeys } from "./keys";

export interface MyPhoto {
  id: string;
  storage_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  caption: string | null;
  created_at: string;
  experience_date_id: string;
  experience_dates?: {
    start_datetime: string;
    experiences?: {
      title: string;
    } | null;
  } | null;
}

export function useMyPhotos(userId: string | undefined) {
  return useQuery({
    queryKey: galleryKeys.myPhotos(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("gallery_photos")
        .select(
          `id, storage_path, status, rejection_reason, caption, created_at, experience_date_id,
           experience_dates ( start_datetime, experiences ( title ) )`,
        )
        .eq("uploaded_by", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyPhoto[];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useMyPhotosCountForEvent(
  userId: string | undefined,
  experienceDateId: string | undefined,
) {
  return useQuery({
    queryKey: galleryKeys.countForEvent(userId ?? "", experienceDateId ?? ""),
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("gallery_photos")
        .select("id", { count: "exact", head: true })
        .eq("uploaded_by", userId)
        .eq("experience_date_id", experienceDateId)
        .neq("status", "rejected");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId && !!experienceDateId,
    staleTime: 0,
  });
}

export interface MyEventPhoto {
  id: string;
  storage_path: string;
  status: "pending" | "approved" | "rejected";
  caption: string | null;
  created_at: string;
}

export function useMyPhotosForEvent(
  userId: string | undefined,
  experienceDateId: string | undefined,
) {
  return useQuery({
    queryKey: galleryKeys.myPhotosForEvent(userId ?? "", experienceDateId ?? ""),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("gallery_photos")
        .select("id, storage_path, status, caption, created_at")
        .eq("uploaded_by", userId)
        .eq("experience_date_id", experienceDateId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyEventPhoto[];
    },
    enabled: !!userId && !!experienceDateId,
    staleTime: 30 * 1000,
  });
}
