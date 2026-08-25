"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/admin/lib/auth";
import { projectSchema, type ProjectInput } from "@/app/admin/lib/schemas/project";
import { slugify } from "@/lib/slug";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function uniqueSlug(supabase: Awaited<ReturnType<typeof requireOwner>>["supabase"], base: string, excludeId?: string) {
  let candidate = slugify(base) || "project";
  let n = 2;
  for (;;) {
    let query = supabase.from("projects").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    candidate = `${slugify(base) || "project"}-${n++}`;
  }
}

/** Called by the form to preview/confirm a unique slug before submit. */
export async function checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const { supabase } = await requireOwner();
  let query = supabase.from("projects").select("id").eq("slug", slugify(slug)).limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return !data || data.length === 0;
}

function revalidateProjectPaths() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/portfolio-projects");
}

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const slug = await uniqueSlug(supabase, data.slug);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      type: "portfolio",
      title: data.title,
      slug,
      description: data.description,
      full_description: data.fullDescription,
      live_url: data.liveUrl || null,
      github_url: data.githubUrl || null,
      cover_image: data.coverImage || null,
      gallery_images: data.galleryImages,
      featured: data.featured,
      status: data.status,
      display_order: data.displayOrder,
    })
    .select("id")
    .single();

  if (error || !project) return { ok: false, error: error?.message ?? "Failed to create project" };

  if (data.technologyIds.length > 0) {
    const { error: linkError } = await supabase
      .from("project_technologies")
      .insert(data.technologyIds.map((technology_id) => ({ project_id: project.id, technology_id })));
    if (linkError) return { ok: false, error: linkError.message };
  }

  revalidateProjectPaths();
  return { ok: true };
}

export async function updateProject(id: string, input: ProjectInput): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const slug = await uniqueSlug(supabase, data.slug, id);

  const { error } = await supabase
    .from("projects")
    .update({
      type: "portfolio",
      title: data.title,
      slug,
      description: data.description,
      full_description: data.fullDescription,
      live_url: data.liveUrl || null,
      github_url: data.githubUrl || null,
      cover_image: data.coverImage || null,
      gallery_images: data.galleryImages,
      featured: data.featured,
      status: data.status,
      display_order: data.displayOrder,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  const { error: deleteLinksError } = await supabase.from("project_technologies").delete().eq("project_id", id);
  if (deleteLinksError) return { ok: false, error: deleteLinksError.message };

  if (data.technologyIds.length > 0) {
    const { error: linkError } = await supabase
      .from("project_technologies")
      .insert(data.technologyIds.map((technology_id) => ({ project_id: id, technology_id })));
    if (linkError) return { ok: false, error: linkError.message };
  }

  revalidateProjectPaths();
  revalidatePath(`/admin/portfolio-projects/${id}`);
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateProjectPaths();
  return { ok: true };
}

export async function toggleProjectFeatured(id: string, featured: boolean): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.from("projects").update({ featured }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateProjectPaths();
  return { ok: true };
}

export async function setProjectStatus(id: string, status: "published" | "draft"): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateProjectPaths();
  return { ok: true };
}

/** Persists a full drag-and-drop reorder in one round trip. */
export async function reorderProjects(orderedIds: string[]): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const updates = orderedIds.map((id, index) =>
    supabase.from("projects").update({ display_order: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };
  revalidateProjectPaths();
  return { ok: true };
}
