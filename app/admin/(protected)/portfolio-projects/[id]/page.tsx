import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/app/admin/components/ProjectForm";
import { PageHeader } from "@/app/admin/components/PageHeader";
import { getProject } from "@/app/admin/lib/queries/projects";
import { listTechnologies } from "@/app/admin/lib/queries/technologies";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, technologies] = await Promise.all([getProject(id), listTechnologies()]);
  if (!project) notFound();

  return (
    <div>
      <PageHeader title="Edit Project" description={project.title} />
      <ProjectForm technologies={technologies} project={project} />
    </div>
  );
}
