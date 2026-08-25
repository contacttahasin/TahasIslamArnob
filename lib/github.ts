/**
 * Real GitHub contribution data for the "Commit Activity" section.
 *
 * GitHub has no public REST endpoint for the contribution graph — the only
 * official source is the GraphQL `contributionsCollection` field, which
 * requires a token. So this reads the same data two ways:
 *
 *   1. GraphQL, when `GITHUB_TOKEN` is set (exact, and can include private
 *      contributions if the token has the scope for it).
 *   2. The public contributions calendar HTML at
 *      `github.com/users/<user>/contributions`, which is what the profile
 *      page itself renders. No token, no REST rate limit.
 *
 * If both fail (offline build, GitHub down) the caller falls back to the
 * placeholder pattern so the page still renders.
 */

export type ContributionDay = {
  /** ISO `YYYY-MM-DD`, in GitHub's reckoning of the day. */
  date: string;
  count: number;
};

export type CommitActivity = {
  /** One entry per day, oldest first, for the trailing year. */
  days: ContributionDay[];
  totalLastYear: number;
  currentStreak: number;
  longestStreak: number;
  /** Most recent day with at least one contribution, or null. */
  lastActive: string | null;
  username: string;
  source: "graphql" | "html" | "placeholder";
};

export const GITHUB_USERNAME = process.env.GITHUB_USERNAME?.trim() || "contacttahasin";

/** Cache window for both sources. The graph only changes once a day. */
const REVALIDATE_SECONDS = 60 * 60;

function computeStreaks(days: ContributionDay[]) {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    if (day.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  // The current streak is counted backwards from the end, but today having
  // no commits yet doesn't break a streak that is otherwise alive — so an
  // empty final day is skipped once before counting.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  for (; i >= 0; i--) {
    if (days[i].count === 0) break;
    current++;
  }

  return { current, longest };
}

function summarize(
  days: ContributionDay[],
  username: string,
  source: CommitActivity["source"],
): CommitActivity {
  const { current, longest } = computeStreaks(days);
  const lastActive = [...days].reverse().find((d) => d.count > 0)?.date ?? null;
  return {
    days,
    totalLastYear: days.reduce((sum, d) => sum + d.count, 0),
    currentStreak: current,
    longestStreak: longest,
    lastActive,
    username,
    source,
  };
}

async function fetchViaGraphQL(username: string, token: string): Promise<ContributionDay[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays { date contributionCount }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: username } }),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) throw new Error(`GitHub GraphQL responded ${res.status}`);

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0]?.message ?? "GitHub GraphQL error");

  const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks)) throw new Error("Unexpected GraphQL shape");

  const days: ContributionDay[] = weeks
    .flatMap((week: { contributionDays?: { date: string; contributionCount: number }[] }) =>
      week.contributionDays ?? [],
    )
    .map((day) => ({ date: day.date, count: day.contributionCount }));

  if (!days.length) throw new Error("GraphQL returned no days");
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Parses the contribution calendar HTML fragment. Each day is a `<td>`
 * carrying `data-date` and an `id`; the count itself only lives in the
 * screen-reader `<tool-tip for="<id>">` text ("3 contributions on …" /
 * "No contributions on …"), so the two are joined by id.
 */
function parseContributionHtml(html: string): ContributionDay[] {
  const counts = new Map<string, number>();
  const tooltipRe = /<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g;
  for (const match of html.matchAll(tooltipRe)) {
    const [, id, text] = match;
    const n = /^\s*([\d,]+)\s+contribution/.exec(text);
    counts.set(id, n ? Number(n[1].replace(/,/g, "")) : 0);
  }

  const days: ContributionDay[] = [];
  const cellRe = /<td\b[^>]*class="[^"]*ContributionCalendar-day[^"]*"[^>]*>/g;
  for (const match of html.matchAll(cellRe)) {
    const tag = match[0];
    const date = /\bdata-date="([^"]+)"/.exec(tag)?.[1];
    if (!date) continue;
    const id = /\bid="([^"]+)"/.exec(tag)?.[1];
    days.push({ date, count: (id && counts.get(id)) || 0 });
  }

  if (!days.length) throw new Error("No contribution cells found in HTML");
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchViaHtml(username: string): Promise<ContributionDay[]> {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
    headers: {
      // GitHub serves this fragment to normal browsers; a bare fetch UA can
      // get a challenge page instead.
      "User-Agent": "Mozilla/5.0 (compatible; portfolio-site/1.0)",
      Accept: "text/html",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) throw new Error(`GitHub contributions page responded ${res.status}`);
  return parseContributionHtml(await res.text());
}

/**
 * Deterministic stand-in used only when both live sources fail, so a build
 * without network access still produces a page that renders.
 */
function placeholderDays(days: number): ContributionDay[] {
  let seed = 42;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const today = new Date();
  const out: ContributionDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const spike = next() < 0.15 ? next() * 18 : 0;
    out.push({
      date: date.toISOString().slice(0, 10),
      count: Math.max(0, Math.round(next() * 7 - 2 + spike)),
    });
  }
  return out;
}

export async function getCommitActivity(
  username: string = GITHUB_USERNAME,
): Promise<CommitActivity> {
  const token = process.env.GITHUB_TOKEN?.trim();

  if (token) {
    try {
      return summarize(await fetchViaGraphQL(username, token), username, "graphql");
    } catch (error) {
      console.error("[github] GraphQL contributions failed, falling back to HTML:", error);
    }
  }

  try {
    return summarize(await fetchViaHtml(username), username, "html");
  } catch (error) {
    console.error("[github] contributions unavailable, using placeholder:", error);
    return summarize(placeholderDays(365), username, "placeholder");
  }
}
