import Team from "../ourTeam/Team";
import Review from "../review/review";
import { getApprovedReviews } from "@/app/(site)/lib/reviews";
import CommitActivity from "../shared/CommitActivity";
import StickyCards from "./StickyCards";
import WorkTimeline from "./WorkTimeline";
import Timeline from "../about/Timeline";

/**
 * Home page's mid-scroll block.
 *
 * Commit graph / team are stacked into one pinned card sequence — the
 * section holds the viewport and each slides up over the one before it.
 * Reviews stay a normal, freely-scrolling section after the stack releases.
 *
 * The skills panel used to sit in this stack; the journey section (Timeline)
 * took its place and runs after the stack releases, as its own pinned
 * section rather than a panel inside this pin.
 */
const Skiper30 = async () => {
  const reviews = await getApprovedReviews();

  return (
    <main className="w-full text-ink bg-linear-to-b from-bg-secondary via-bg-secondary to-bg-primary">
      <StickyCards>
        <WorkTimeline compact />
        <CommitActivity />
        <Team />
      </StickyCards>

      {/* Journey runs after the stack has released. It pins on its own, so it
          is a sibling of StickyCards rather than one of its panels — a pin
          inside a pin would break both. */}
      <Timeline />

      <Review items={reviews} />
    </main>
  );
};

export { Skiper30 };
