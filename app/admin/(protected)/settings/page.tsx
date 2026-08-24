import type { Metadata } from "next";
import { SettingsForm } from "@/app/admin/components/SettingsForm";
import { getSettings } from "@/app/admin/lib/queries/settings";

export const metadata: Metadata = { title: "Portfolio Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsForm settings={settings} />;
}
