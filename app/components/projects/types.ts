/**
 * Public-site view model for a project, rendered by ProjectGrid. Sourced
 * from Supabase (app/(site)/lib/projects.ts), filtered to status="published"
 * before it ever reaches these components.
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
};
