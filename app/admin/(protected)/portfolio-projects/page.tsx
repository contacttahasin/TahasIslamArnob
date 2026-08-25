import type { Metadata } from "next";
import { ProjectsTable } from "@/app/admin/components/ProjectsTable";
import { listProjects } from "@/app/admin/lib/queries/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await listProjects();
  return <ProjectsTable initialProjects={projects} />;
}
