import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PublicProject } from "@/app/components/projects/types";
import type { ProjectWithTechnologies } from "@/lib/supabase/types";

const PROJECT_WITH_TECH_SELECT = "*, project_technologies(technologies(*))";

type RawProjectRow = Omit<ProjectWithTechnologies, "technologies"> & {
  project_technologies: { technologies: ProjectWithTechnologies["technologies"][number] }[];
};

function toPublicProject(row: RawProjectRow): PublicProject {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.cover_image ?? "",
    tech: row.project_technologies.map((pt) => pt.technologies.name),
    github: row.github_url,
    live: row.live_url,
    featured: row.featured,
    year: new Date(row.created_at).getFullYear(),
  };
}

/**
 * Every published project, ordered the same way the admin's drag-and-drop
 * reorder wrote it. No auth required — reads are public per the RLS
 * policies in supabase/schema.sql, same client the admin side uses.
 */
export async function getPublishedProjects(): Promise<PublicProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_WITH_TECH_SELECT)
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as RawProjectRow[]).map(toPublicProject);
}
