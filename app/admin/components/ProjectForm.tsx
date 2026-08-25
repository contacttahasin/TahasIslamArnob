"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slug";
import { projectSchema, type ProjectInput } from "@/app/admin/lib/schemas/project";
import { createProject, updateProject, checkSlugAvailable } from "@/app/admin/lib/actions/projects";
import type { ProjectWithTechnologies, Technology } from "@/lib/supabase/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/app/admin/components/ImageUploader";
import { GalleryUploader } from "@/app/admin/components/GalleryUploader";

export function ProjectForm({
  technologies,
  project,
}: {
  technologies: Technology[];
  project?: ProjectWithTechnologies;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(!!project);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const listHref = "/admin/portfolio-projects";

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      slug: project?.slug ?? "",
      description: project?.description ?? "",
      fullDescription: project?.full_description ?? "",
      technologyIds: project?.technologies.map((t) => t.id) ?? [],
      liveUrl: project?.live_url ?? "",
      githubUrl: project?.github_url ?? "",
      coverImage: project?.cover_image ?? "",
      galleryImages: project?.gallery_images ?? [],
      featured: project?.featured ?? false,
      status: project?.status ?? "draft",
      displayOrder: project?.display_order ?? 0,
    },
  });

  async function checkSlug(slug: string) {
    if (!slug) return;
    setSlugStatus("checking");
    const available = await checkSlugAvailable(slug, project?.id);
    setSlugStatus(available ? "available" : "taken");
  }

  function onTitleChange(title: string) {
    form.setValue("title", title);
    if (!slugTouched) {
      const next = slugify(title);
      form.setValue("slug", next);
      checkSlug(next);
    }
  }

  async function onSubmit(values: ProjectInput) {
    startTransition(async () => {
      const result = project ? await updateProject(project.id, values) : await createProject(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(project ? "Project updated" : "Project created");
      router.push(listHref);
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input {...field} onChange={(e) => onTitleChange(e.target.value)} placeholder="LUXE Leather" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="mt-5">
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          setSlugTouched(true);
                          field.onChange(e.target.value);
                          checkSlug(slugify(e.target.value));
                        }}
                      />
                    </FormControl>
                    {slugStatus === "checking" && <FormDescription>Checking availability…</FormDescription>}
                    {slugStatus === "available" && (
                      <FormDescription className="flex items-center gap-1 text-emerald-400">
                        <Check className="size-3" /> Available
                      </FormDescription>
                    )}
                    {slugStatus === "taken" && <FormDescription className="text-destructive">Already in use</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-5">
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="One or two sentences for the project card." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullDescription"
                render={({ field }) => (
                  <FormItem className="mt-5">
                    <FormLabel>Full Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} placeholder="The full case-study write-up." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
              <FormField
                control={form.control}
                name="technologyIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technologies</FormLabel>
                    {technologies.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No technologies yet — add some under Technologies first.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {technologies.map((tech) => {
                          const active = field.value.includes(tech.id);
                          return (
                            <button
                              key={tech.id}
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  active ? field.value.filter((id) => id !== tech.id) : [...field.value, tech.id]
                                )
                              }
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                active
                                  ? "border-primary/30 bg-primary/15 text-primary"
                                  : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
                              )}
                            >
                              {tech.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:grid-cols-2 sm:p-6">
              <FormField
                control={form.control}
                name="liveUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Live Demo URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Repository URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://github.com/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
              <FormField
                control={form.control}
                name="galleryImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gallery Images</FormLabel>
                    <GalleryUploader value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <ImageUploader folder="covers" label="Cover image" value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <div>
                      <FormLabel>Featured</FormLabel>
                      <p className="text-xs text-muted-foreground">Highlight on the public site</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormDescription>Lower shows first. Drag &amp; drop in the list is usually easier.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] pt-6">
          <Button type="button" variant="outline" onClick={() => router.push(listHref)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save Project
          </Button>
        </div>
      </form>
    </Form>
  );
}
