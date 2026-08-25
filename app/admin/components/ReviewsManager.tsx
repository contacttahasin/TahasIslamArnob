"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, MessageSquareQuote, Pencil, Plus, Trash2, X, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/app/admin/components/PageHeader";
import { EmptyState } from "@/app/admin/components/EmptyState";
import { ConfirmDialog } from "@/app/admin/components/ConfirmDialog";
import { ReviewDialog } from "@/app/admin/components/ReviewDialog";
import { deleteReview, setReviewStatus } from "@/app/admin/lib/actions/reviews";
import type { Review, ReviewStatus } from "@/lib/supabase/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_STYLES: Record<ReviewStatus, string> = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
};

type Filter = "all" | ReviewStatus;

/**
 * Triage + full edit for every review, including the ones visitors submit
 * (those arrive as `pending` and are invisible on the site until approved
 * here). Approve/reject is one click from the row; everything else opens
 * the dialog.
 */
export function ReviewsManager({ initialReviews }: { initialReviews: Review[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: initialReviews.length,
      pending: initialReviews.filter((r) => r.status === "pending").length,
      approved: initialReviews.filter((r) => r.status === "approved").length,
      rejected: initialReviews.filter((r) => r.status === "rejected").length,
    }),
    [initialReviews]
  );

  const visible = useMemo(
    () => (filter === "all" ? initialReviews : initialReviews.filter((r) => r.status === filter)),
    [initialReviews, filter]
  );

  function changeStatus(review: Review, status: ReviewStatus) {
    startTransition(async () => {
      const result = await setReviewStatus(review.id, status);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(status === "approved" ? "Review approved" : `Review marked ${status}`);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteReview(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Review deleted");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        description={
          counts.pending > 0
            ? `${counts.pending} waiting for review · ${counts.approved} live on the site`
            : `${counts.approved} live on the site`
        }
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Add Review
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-5">
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title={filter === "all" ? "No reviews yet" : `Nothing ${filter}`}
          description={
            filter === "all"
              ? "Add one yourself, or wait for a visitor to submit one from the home page."
              : "Try a different filter."
          }
          action={
            filter === "all" ? (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                Add Review
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:flex-row sm:items-start"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {/* Same order the public site resolves in: owner upload,
                    then the submitter's Google picture, then initials. */}
                {review.picture || review.author_avatar ? (
                  <Image
                    src={(review.picture ?? review.author_avatar) as string}
                    alt={review.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
                    {review.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{review.name}</span>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[review.status]}`}
                  >
                    {review.status}
                  </span>

                  {review.featured && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      featured
                    </span>
                  )}

                  {review.rating != null && (
                    <span className="flex items-center gap-0.5 text-[11px] text-amber-300">
                      <Star className="size-3 fill-current" />
                      {review.rating}
                    </span>
                  )}

                  {review.link && (
                    <a
                      href={review.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Open source link"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>

                {(review.title || review.company) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[review.title, review.company].filter(Boolean).join(" · ")}
                  </p>
                )}

                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{review.text}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1 self-start">
                {review.status !== "approved" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Approve"
                    onClick={() => changeStatus(review, "approved")}
                  >
                    <Check className="size-4 text-emerald-400" />
                  </Button>
                )}
                {review.status !== "rejected" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Reject"
                    onClick={() => changeStatus(review, "rejected")}
                  >
                    <X className="size-4 text-red-400" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(review);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  onClick={() => setDeleteTarget(review)}
                >
                  <Trash2 className="size-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        review={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete review?"
        description={`"${deleteTarget?.name ?? ""}" will be removed permanently.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
