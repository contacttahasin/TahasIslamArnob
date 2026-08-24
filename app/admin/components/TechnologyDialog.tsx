"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { technologySchema, type TechnologyInput } from "@/app/admin/lib/schemas/technology";
import { createTechnology, updateTechnology } from "@/app/admin/lib/actions/technologies";
import type { Technology } from "@/lib/supabase/types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function TechnologyDialog({
  open,
  onOpenChange,
  technology,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technology?: Technology | null;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<TechnologyInput>({
    resolver: zodResolver(technologySchema),
    defaultValues: { name: "", icon: "" },
  });

  useEffect(() => {
    if (open) form.reset({ name: technology?.name ?? "", icon: technology?.icon ?? "" });
  }, [open, technology, form]);

  function onSubmit(values: TechnologyInput) {
    startTransition(async () => {
      const result = technology ? await updateTechnology(technology.id, values) : await createTechnology(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(technology ? "Technology updated" : "Technology added");
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{technology ? "Edit Technology" : "Add Technology"}</DialogTitle>
          <DialogDescription>Used in the project form&apos;s technology picker.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Next.js" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="nextjs (icon name or URL)" />
                  </FormControl>
                  <FormDescription>Optional — an icon identifier or image URL.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
