import type { Metadata } from "next";
import { ProjectForm } from "@/app/admin/components/ProjectForm";
import { PageHeader } from "@/app/admin/components/PageHeader";
import { listTechnologies } from "@/app/admin/lib/queries/technologies";

export const metadata: Metadata = { title: "New Project" };

export default async function NewProjectPage() {
  const technologies = await listTechnologies();
  return (
    <div>
      <PageHeader title="New Project" description="Add a new project to your portfolio." />
      <ProjectForm technologies={technologies} />
    </div>
  );
}
