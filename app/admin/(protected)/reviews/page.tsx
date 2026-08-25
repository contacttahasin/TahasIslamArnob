import type { Metadata } from "next";
import { ReviewsManager } from "@/app/admin/components/ReviewsManager";
import { listReviews } from "@/app/admin/lib/queries/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const reviews = await listReviews();
  return <ReviewsManager initialReviews={reviews} />;
}
