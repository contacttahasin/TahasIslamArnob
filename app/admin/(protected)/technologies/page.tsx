import type { Metadata } from "next";
import { TechnologiesManager } from "@/app/admin/components/TechnologiesManager";
import { listTechnologies } from "@/app/admin/lib/queries/technologies";

export const metadata: Metadata = { title: "Technologies" };

export default async function TechnologiesPage() {
  const technologies = await listTechnologies();
  return <TechnologiesManager initialTechnologies={technologies} />;
}
