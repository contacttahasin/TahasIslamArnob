import type { Metadata } from "next";
import { ProjectsTable } from "@/app/admin/components/ProjectsTable";
import { listProjects } from "@/app/admin/lib/queries/projects";

export const metadata: Metadata = { title: "Portfolio Projects" };

export default async function PortfolioProjectsPage() {
  const projects = await listProjects("portfolio");
  return <ProjectsTable type="portfolio" initialProjects={projects} />;
}
