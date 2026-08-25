import { getCommitActivity } from "@/lib/github";
import CommitActivityView from "./CommitActivityView";

/**
 * Server wrapper for the Commit Activity section: pulls the real GitHub
 * contribution graph (cached for an hour in `lib/github.ts`) and hands it
 * to the client component that draws it.
 *
 * The username comes from `GITHUB_USERNAME`, defaulting to the site owner's
 * account. Setting `GITHUB_TOKEN` switches the fetch to GitHub's GraphQL
 * API; without it the public contributions calendar is used.
 */
export default async function CommitActivity() {
  const activity = await getCommitActivity();
  return <CommitActivityView activity={activity} />;
}
