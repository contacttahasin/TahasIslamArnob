import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { LayoutGrid, Globe, Star, Images, Clock, Plus, Tag, Settings, HardDrive } from "lucide-react";

import { PageHeader } from "@/app/admin/components/PageHeader";
import { StatCard } from "@/app/admin/components/StatCard";
import { EmptyState } from "@/app/admin/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { getProjectCounts, getRecentProjects, getLastUpdatedAt } from "@/app/admin/lib/queries/projects";
import { getStorageUsage, listMediaFolder } from "@/app/admin/lib/actions/media";
import { MEDIA_FOLDERS } from "@/app/admin/lib/media-constants";
import { formatBytes } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [counts, recentProjects, lastUpdated, usage] = await Promise.all([
    getProjectCounts(),
    getRecentProjects(5),
    getLastUpdatedAt(),
    getStorageUsage(),
  ]);

  const totalImages = usage.filter((u) => u.folder !== "resume").reduce((sum, u) => sum + u.count, 0);
  const totalBytes = usage.reduce((sum, u) => sum + u.bytes, 0);

  const recentUploads = (
    await Promise.all(MEDIA_FOLDERS.map((folder) => listMediaFolder(folder)))
  )
    .flat()
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" description="An overview of your portfolio content." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Projects" value={counts.total} icon={LayoutGrid} accent />
        <StatCard label="Published" value={counts.published} icon={Globe} />
        <StatCard label="Featured Projects" value={counts.featured} icon={Star} />
        <StatCard label="Total Images" value={totalImages} icon={Images} />
        <StatCard
          label="Last Updated"
          value={lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : "—"}
          icon={Clock}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <EmptyState icon={LayoutGrid} title="No projects yet" description="Add your first project to see it here." />
          ) : (
            <div className="space-y-1">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/portfolio-projects/${project.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                    {project.cover_image && (
                      <Image src={project.cover_image} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={project.status === "published" ? "default" : "secondary"} className="shrink-0 text-[10px] capitalize">
                    {project.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h2>
            <div className="space-y-1.5">
              <Link href="/admin/portfolio-projects/new" className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground">
                <Plus className="size-4" /> New Project
              </Link>
              <Link href="/admin/technologies" className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground">
                <Tag className="size-4" /> Manage Technologies
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground">
                <Settings className="size-4" /> Portfolio Settings
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <HardDrive className="size-4" /> Storage Usage
            </h2>
            <p className="mb-3 text-2xl font-semibold tracking-tight text-foreground">{formatBytes(totalBytes)}</p>
            <div className="space-y-2">
              {usage.map((u) => (
                <div key={u.folder} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{u.folder}</span>
                  <span className="text-foreground">
                    {u.count} · {formatBytes(u.bytes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Recent Uploads</h2>
        {recentUploads.length === 0 ? (
          <EmptyState icon={Images} title="No uploads yet" description="Images you upload will show up here." />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {recentUploads.map((file) => (
              <div key={file.path} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <Image src={file.url} alt={file.name} fill sizes="150px" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
