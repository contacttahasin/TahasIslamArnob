import type { Metadata } from "next";
import { ProjectForm } from "@/app/admin/components/ProjectForm";
import { PageHeader } from "@/app/admin/components/PageHeader";
import { listTechnologies } from "@/app/admin/lib/queries/technologies";

export const metadata: Metadata = { title: "New Latest Project" };

export default async function NewLatestProjectPage() {
  const technologies = await listTechnologies();
  return (
    <div>
      <PageHeader title="New Latest Project" description="Add a new entry to Latest Projects." />
      <ProjectForm type="latest" technologies={technologies} />
    </div>
  );
}
