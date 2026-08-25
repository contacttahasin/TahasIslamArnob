"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { reviewSchema, type ReviewInput } from "@/app/admin/lib/schemas/review";
import { createReview, updateReview } from "@/app/admin/lib/actions/reviews";
import type { Review } from "@/lib/supabase/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/app/admin/components/ImageUploader";

const EMPTY: ReviewInput = {
  name: "",
  title: "",
  company: "",
  text: "",
  picture: "",
  link: "",
  rating: null,
  status: "approved",
  featured: false,
};

/**
 * Owner-side editor for any review — including ones a visitor submitted.
 * The avatar and source link are only editable here, never from the public
 * form, so every URL that reaches the site was typed by the owner.
 */
export function ReviewDialog({
  open,
  onOpenChange,
  review,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review?: Review | null;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      review
        ? {
            name: review.name,
            title: review.title,
            company: review.company,
            text: review.text,
            picture: review.picture ?? "",
            link: review.link ?? "",
            rating: review.rating,
            status: review.status,
            featured: review.featured,
          }
        : EMPTY
    );
  }, [open, review, form]);

  function onSubmit(values: ReviewInput) {
    startTransition(async () => {
      const result = review ? await updateReview(review.id, values) : await createReview(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(review ? "Review updated" : "Review added");
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{review ? "Edit Review" : "Add Review"}</DialogTitle>
          <DialogDescription>
            Approved reviews appear in the home page&apos;s testimonial marquee.
          </DialogDescription>
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
                    <Input placeholder="Elena Rostova" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Principal UI/UX Designer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Nova Interface" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="What they said…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="picture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <ImageUploader
                      folder="branding"
                      value={field.value}
                      onChange={field.onChange}
                      aspect="aspect-square"
                    />
                  </FormControl>
                  <FormDescription>
                    Upload an image or paste a link. Leave empty to use the picture from
                    the reviewer&apos;s Google account.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/…" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional. Makes the whole card a link to where the review came from.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No rating</SelectItem>
                        {[5, 4, 3, 2, 1].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {"★".repeat(n)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="approved">Approved — shown on site</SelectItem>
                        <SelectItem value="pending">Pending — hidden</SelectItem>
                        <SelectItem value="rejected">Rejected — hidden</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel>Featured</FormLabel>
                    <FormDescription>Sorted to the front of the marquee.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {review ? "Save changes" : "Add review"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
