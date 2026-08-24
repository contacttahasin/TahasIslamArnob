import Team from "../ourTeam/Team";
import Skill from "../skill/skill";
import Review from "../review/review";
import CommitActivity from "../shared/CommitActivity";
import StickyCards from "./StickyCards";

/**
 * Home page's mid-scroll block.
 *
 * Skills / commit graph / team are stacked into one pinned card sequence —
 * the section holds the viewport and each of the three slides up over the
 * one before it. Reviews stay a normal, freely-scrolling section after the
 * stack releases.
 */
const Skiper30 = () => {
  return (
    <main className="w-full text-ink bg-linear-to-b from-bg-secondary via-bg-secondary to-bg-primary">
      <StickyCards>
        <Skill />
        <CommitActivity />
        <Team />
      </StickyCards>

      <Review />
    </main>
  );
};

export { Skiper30 };
