import type { Metadata } from "next";
import { ProjectsTable } from "@/app/admin/components/ProjectsTable";
import { listProjects } from "@/app/admin/lib/queries/projects";

export const metadata: Metadata = { title: "Latest Projects" };

export default async function LatestProjectsPage() {
  const projects = await listProjects("latest");
  return <ProjectsTable type="latest" initialProjects={projects} />;
}
