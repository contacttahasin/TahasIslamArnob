"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/app/admin/components/PageHeader";
import { EmptyState } from "@/app/admin/components/EmptyState";
import { ConfirmDialog } from "@/app/admin/components/ConfirmDialog";
import { TechnologyDialog } from "@/app/admin/components/TechnologyDialog";
import { deleteTechnology } from "@/app/admin/lib/actions/technologies";
import type { Technology } from "@/lib/supabase/types";

export function TechnologiesManager({ initialTechnologies }: { initialTechnologies: Technology[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Technology | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Technology | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteTechnology(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Technology deleted");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        title="Technologies"
        description={`${initialTechnologies.length} technolog${initialTechnologies.length === 1 ? "y" : "ies"}`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Technology
          </Button>
        }
      />

      {initialTechnologies.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No technologies yet"
          description="Add the tech stack you use so it can be tagged on projects."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Add Technology
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {initialTechnologies.map((tech) => (
            <div
              key={tech.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
            >
              <span className="text-sm font-medium text-foreground">{tech.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditing(tech);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(tech)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TechnologyDialog open={dialogOpen} onOpenChange={setDialogOpen} technology={editing} onSaved={() => router.refresh()} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete technology?"
        description={`"${deleteTarget?.name}" will be removed from every project using it.`}
        loading={pending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
