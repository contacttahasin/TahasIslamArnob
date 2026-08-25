"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  ExternalLink,
  Star,
  Trash2,
  Search,
  Plus,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/app/admin/components/PageHeader";
import { EmptyState } from "@/app/admin/components/EmptyState";
import { ConfirmDialog } from "@/app/admin/components/ConfirmDialog";
import {
  deleteProject,
  toggleProjectFeatured,
  setProjectStatus,
  reorderProjects,
} from "@/app/admin/lib/actions/projects";
import type { ProjectWithTechnologies } from "@/lib/supabase/types";

const PAGE_SIZE = 8;

function SortableRow({
  project,
  basePath,
  onDelete,
  onToggleFeatured,
  onToggleStatus,
  pending,
}: {
  project: ProjectWithTechnologies;
  basePath: string;
  onDelete: () => void;
  onToggleFeatured: () => void;
  onToggleStatus: () => void;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-2.5 transition-colors",
        isDragging && "z-10 border-primary/30 bg-white/[0.04] shadow-xl"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
        {project.cover_image && <Image src={project.cover_image} alt="" fill sizes="44px" className="object-cover" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`${basePath}/${project.id}`} className="truncate text-sm font-medium text-foreground hover:underline">
            {project.title}
          </Link>
          {project.featured && <Star className="size-3.5 shrink-0 fill-primary text-primary" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">{project.description}</p>
      </div>

      <button
        onClick={onToggleStatus}
        disabled={pending}
        className="shrink-0"
        aria-label="Toggle publish status"
      >
        <Badge variant={project.status === "published" ? "default" : "secondary"} className="cursor-pointer capitalize">
          {project.status}
        </Badge>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}>
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`${basePath}/${project.id}`} />}>
            <Pencil className="size-3.5" /> Edit
          </DropdownMenuItem>
          {project.live_url && (
            <DropdownMenuItem render={<a href={project.live_url} target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink className="size-3.5" /> Preview
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onToggleFeatured}>
            <Star className="size-3.5" /> {project.featured ? "Unfeature" : "Feature"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="size-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ProjectsTable({ initialProjects }: { initialProjects: ProjectWithTechnologies[] }) {
  const [items, setItems] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithTechnologies | null>(null);
  const [pending, startTransition] = useTransition();

  const basePath = "/admin/portfolio-projects";

  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = isFiltering ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : items;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      const result = await reorderProjects(next.map((p) => p.id));
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleToggleFeatured(project: ProjectWithTechnologies) {
    setItems((prev) => prev.map((p) => (p.id === project.id ? { ...p, featured: !p.featured } : p)));
    startTransition(async () => {
      const result = await toggleProjectFeatured(project.id, !project.featured);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleToggleStatus(project: ProjectWithTechnologies) {
    const next = project.status === "published" ? "draft" : "published";
    setItems((prev) => prev.map((p) => (p.id === project.id ? { ...p, status: next } : p)));
    startTransition(async () => {
      const result = await setProjectStatus(project.id, next);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteProject(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== target.id));
      toast.success("Project deleted");
      setDeleteTarget(null);
    });
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${items.length} project${items.length === 1 ? "" : "s"} total`}
        actions={
          <Button render={<Link href={`${basePath}/new`} />} nativeButton={false}>
            <Plus className="size-4" /> Add New
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search projects…"
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as typeof statusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No projects yet"
          description="Add your first project to get started."
          action={
            <Button render={<Link href={`${basePath}/new`} />} nativeButton={false} size="sm">
              Add New
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search or filter." />
      ) : isFiltering ? (
        <div className="space-y-2">
          {visible.map((project) => (
            <SortableRow
              key={project.id}
              project={project}
              basePath={basePath}
              pending={pending}
              onDelete={() => setDeleteTarget(project)}
              onToggleFeatured={() => handleToggleFeatured(project)}
              onToggleStatus={() => handleToggleStatus(project)}
            />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {visible.map((project) => (
                <SortableRow
                  key={project.id}
                  project={project}
                  basePath={basePath}
                  pending={pending}
                  onDelete={() => setDeleteTarget(project)}
                  onToggleFeatured={() => handleToggleFeatured(project)}
                  onToggleStatus={() => handleToggleStatus(project)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isFiltering && pageCount > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete project?"
        description={`"${deleteTarget?.title}" will be permanently removed. This can't be undone.`}
        loading={pending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
