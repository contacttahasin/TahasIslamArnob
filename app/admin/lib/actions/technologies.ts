"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/admin/lib/auth";
import { technologySchema, type TechnologyInput } from "@/app/admin/lib/schemas/technology";
import type { ActionResult } from "@/app/admin/lib/actions/projects";

export async function createTechnology(input: TechnologyInput): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = technologySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { error } = await supabase
    .from("technologies")
    .insert({ name: parsed.data.name, icon: parsed.data.icon || null });
  if (error) return { ok: false, error: error.code === "23505" ? "That technology already exists" : error.message };

  revalidatePath("/admin/technologies");
  return { ok: true };
}

export async function updateTechnology(id: string, input: TechnologyInput): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = technologySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { error } = await supabase
    .from("technologies")
    .update({ name: parsed.data.name, icon: parsed.data.icon || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.code === "23505" ? "That technology already exists" : error.message };

  revalidatePath("/admin/technologies");
  return { ok: true };
}

export async function deleteTechnology(id: string): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.from("technologies").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/technologies");
  return { ok: true };
}
