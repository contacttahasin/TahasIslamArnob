import "server-only";
import { requireOwner } from "@/app/admin/lib/auth";
import type { Technology } from "@/lib/supabase/types";

export async function listTechnologies(): Promise<Technology[]> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase.from("technologies").select("*").order("name", { ascending: true });
  if (error || !data) return [];
  return data;
}
