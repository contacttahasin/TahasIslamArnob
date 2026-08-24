/**
 * Hand-written to match supabase/schema.sql exactly — there's no linked
 * Supabase CLI project in this environment to run `supabase gen types`
 * against. If the schema changes, update this file to match.
 *
 * Shape (Views/Functions/Enums/CompositeTypes, Relationships on every
 * table) mirrors exactly what `supabase gen types` itself outputs — the
 * Supabase JS client's generics require every one of these keys to be
 * present or its Insert/Update/Row inference silently collapses to `never`.
 */

export type ProjectType = "latest" | "portfolio";
export type ProjectStatus = "published" | "draft";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          type: ProjectType;
          title: string;
          slug: string;
          description: string;
          full_description: string;
          live_url: string | null;
          github_url: string | null;
          cover_image: string | null;
          gallery_images: string[];
          featured: boolean;
          status: ProjectStatus;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: ProjectType;
          title: string;
          slug: string;
          description?: string;
          full_description?: string;
          live_url?: string | null;
          github_url?: string | null;
          cover_image?: string | null;
          gallery_images?: string[];
          featured?: boolean;
          status?: ProjectStatus;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      technologies: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["technologies"]["Insert"]>;
        Relationships: [];
      };
      project_technologies: {
        Row: {
          project_id: string;
          technology_id: string;
        };
        Insert: {
          project_id: string;
          technology_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_technologies"]["Insert"]>;
        Relationships: [];
      };
      portfolio_settings: {
        Row: {
          id: boolean;
          name: string | null;
          job_title: string | null;
          about: string | null;
          location: string | null;
          availability: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          github: string | null;
          linkedin: string | null;
          facebook: string | null;
          instagram: string | null;
          twitter: string | null;
          resume_url: string | null;
          meta_title: string | null;
          meta_description: string | null;
          og_image: string | null;
          logo: string | null;
          favicon: string | null;
          accent_color: string | null;
          loader: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["portfolio_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["portfolio_settings"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_type: ProjectType;
      project_status: ProjectStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Technology = Database["public"]["Tables"]["technologies"]["Row"];
export type PortfolioSettings = Database["public"]["Tables"]["portfolio_settings"]["Row"];

export type ProjectWithTechnologies = Project & { technologies: Technology[] };
