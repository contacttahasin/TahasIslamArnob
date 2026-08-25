import "server-only";
import { requireOwner } from "@/app/admin/lib/auth";
import type { ProjectWithTechnologies } from "@/lib/supabase/types";

const PROJECT_WITH_TECH_SELECT = "*, project_technologies(technologies(*))";

// Supabase's nested-select shape for the join above.
type RawProjectRow = ProjectWithTechnologies extends infer P
  ? Omit<P, "technologies"> & { project_technologies: { technologies: ProjectWithTechnologies["technologies"][number] }[] }
  : never;

function flattenTechnologies(row: RawProjectRow): ProjectWithTechnologies {
  const { project_technologies, ...project } = row;
  return { ...project, technologies: project_technologies.map((pt) => pt.technologies) };
}

export async function listProjects(): Promise<ProjectWithTechnologies[]> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_WITH_TECH_SELECT)
    .order("display_order", { ascending: true });

  if (error || !data) return [];
  return (data as unknown as RawProjectRow[]).map(flattenTechnologies);
}

export async function getProject(id: string): Promise<ProjectWithTechnologies | null> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase.from("projects").select(PROJECT_WITH_TECH_SELECT).eq("id", id).single();
  if (error || !data) return null;
  return flattenTechnologies(data as unknown as RawProjectRow);
}

export async function getProjectCounts() {
  const { supabase } = await requireOwner();
  const [total, published, featured] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("featured", true),
  ]);
  return {
    total: total.count ?? 0,
    published: published.count ?? 0,
    featured: featured.count ?? 0,
  };
}

export async function getRecentProjects(limit = 5): Promise<ProjectWithTechnologies[]> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_WITH_TECH_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as unknown as RawProjectRow[]).map(flattenTechnologies);
}

export async function getLastUpdatedAt(): Promise<string | null> {
  const { supabase } = await requireOwner();
  const { data } = await supabase
    .from("projects")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.updated_at ?? null;
}
