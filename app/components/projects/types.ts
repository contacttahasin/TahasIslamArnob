/**
 * Public-site view model for a project — shared by both the filterable grid
 * (ProjectGrid) and the 3D ring (ProjectsRing), replacing the two separate
 * static shapes that used to live in data/projects.ts and data/ringProjects.ts.
 * Sourced from Supabase now (app/(site)/lib/projects.ts), filtered to
 * status="published" before it ever reaches these components.
 */
export type PublicProject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  tech: string[];
  github: string | null;
  live: string | null;
  featured: boolean;
  year: number;
  type: "latest" | "portfolio";
};
