import type { Metadata } from "next";
import { ProjectForm } from "@/app/admin/components/ProjectForm";
import { PageHeader } from "@/app/admin/components/PageHeader";
import { listTechnologies } from "@/app/admin/lib/queries/technologies";

export const metadata: Metadata = { title: "New Portfolio Project" };

export default async function NewPortfolioProjectPage() {
  const technologies = await listTechnologies();
  return (
    <div>
      <PageHeader title="New Portfolio Project" description="Add a new entry to Portfolio Projects." />
      <ProjectForm type="portfolio" technologies={technologies} />
    </div>
  );
}
