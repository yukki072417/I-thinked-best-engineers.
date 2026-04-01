// GitHub API types
interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

interface GithubRepo {
  full_name: string;
  fork: boolean;
  has_wiki: boolean;
}

interface GithubLanguages {
  [lang: string]: number;
}

interface GithubPullRequest {
  merged_at: string | null;
}

interface ContributionDay {
  contributionCount: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

interface ContributionStats {
  totalPullRequestReviewContributions: number;
  totalIssueContributions: number;
  contributionCalendar: ContributionCalendar;
}

// GitHub API calls
const ghHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
});

async function fetchUser(token: string): Promise<GithubUser> {
  const res = await fetch("https://api.github.com/user", { headers: ghHeaders(token) });
  if (!res.ok) throw new Error(`fetchUser failed: ${res.status}`);
  return res.json() as Promise<GithubUser>;
}

async function fetchAllRepos(token: string): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&affiliation=owner`,
      { headers: ghHeaders(token) }
    );
    if (!res.ok) throw new Error(`fetchAllRepos failed: ${res.status}`);
    const data = (await res.json()) as GithubRepo[];
    if (data.length === 0) break;
    repos.push(...data);
    page++;
  }
  return repos;
}

async function fetchAllLanguages(token: string, repos: GithubRepo[]): Promise<GithubLanguages> {
  const nonFork = repos.filter((r) => !r.fork);
  const results = await Promise.all(
    nonFork.map(async (r) => {
      const res = await fetch(`https://api.github.com/repos/${r.full_name}/languages`, {
        headers: ghHeaders(token),
      });
      return res.ok ? (res.json() as Promise<GithubLanguages>) : {};
    })
  );
  const totals: GithubLanguages = {};
  for (const langMap of results) {
    for (const [lang, bytes] of Object.entries(langMap as GithubLanguages)) {
      totals[lang] = (totals[lang] ?? 0) + (bytes as number);
    }
  }
  return totals;
}

async function fetchPullRequests(token: string, login: string): Promise<GithubPullRequest[]> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const res = await fetch(
    `https://api.github.com/search/issues?q=author:${login}+type:pr+created:>=${since.toISOString().split("T")[0]}&per_page=100`,
    { headers: ghHeaders(token) }
  );
  if (!res.ok) throw new Error(`fetchPullRequests failed: ${res.status}`);
  const data = (await res.json()) as { items: GithubPullRequest[] };
  return data.items;
}

async function fetchContributions(token: string, login: string): Promise<ContributionStats> {
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const query = `
    query($login: String!, $from: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from) {
          totalPullRequestReviewContributions
          totalIssueContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
              }
            }
          }
        }
      }
    }
  `;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...ghHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login, from: from.toISOString() } }),
  });
  if (!res.ok) throw new Error(`fetchContributions failed: ${res.status}`);
  const data = (await res.json()) as {
    data: { user: { contributionsCollection: ContributionStats } };
  };
  return data.data.user.contributionsCollection;
}

// Score calculation
function calcImplementation(total: number): number {
  // 総コントリビューションをベースに、継続開発量をそのままスコア化（上限なし）
  return Math.round(total);
}

function calcPlanning(repos: GithubRepo[], techCount: number): number {
  const nonFork = repos.filter((r) => !r.fork);
  if (nonFork.length === 0) return 0;

  const wikiCount = nonFork.filter((r) => r.has_wiki).length;
  const repoBase = nonFork.length * 12;
  const wikiScore = wikiCount * 18;
  const techBreadth = techCount * 6;
  return Math.round(repoBase + wikiScore + techBreadth);
}

function calcSpeed(contributions: ContributionStats, prs: GithubPullRequest[]): number {
  const commitsPerMonth = (contributions.contributionCalendar.totalContributions / 365) * 30;
  const mergedPrs = prs.filter((p) => p.merged_at).length;
  return Math.round(commitsPerMonth * 10 + mergedPrs * 5);
}

function calcReview(contributions: ContributionStats, prs: GithubPullRequest[]): number {
  const mergedPrs = prs.filter((p) => p.merged_at).length;
  return Math.round(
    contributions.totalPullRequestReviewContributions * 18 +
      contributions.totalIssueContributions * 6 +
      mergedPrs * 2
  );
}

function calcLongestStreak(calendar: ContributionCalendar): number {
  let longest = 0;
  let current = 0;

  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > 0) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
  }

  return longest;
}

function calcStamina(contributions: ContributionStats): number {
  const longestStreak = calcLongestStreak(contributions.contributionCalendar);
  const yearlyVolume = contributions.contributionCalendar.totalContributions;
  return Math.round(longestStreak * 12 + yearlyVolume * 0.15);
}

function calcAdaptability(repos: GithubRepo[], languages: GithubLanguages): number {
  const nonFork = repos.filter((r) => !r.fork).length;
  const languageCount = Object.keys(languages).length;
  const weightedBreadth = Object.values(languages).filter((bytes) => bytes >= 5000).length;
  return Math.round(languageCount * 18 + weightedBreadth * 12 + nonFork * 2);
}

function calcTendency(
  impl: number,
  planning: number,
  speed: number
): "implementation" | "planning" | "balanced" {
  const avg = (impl + planning + speed) / 3;
  if (impl > avg + 15 && speed > avg + 15) return "implementation";
  if (planning > avg + 15) return "planning";
  return "balanced";
}

function calcDeckScore(
  impl: number,
  planning: number,
  speed: number,
  review: number,
  stamina: number,
  adaptability: number
): number {
  return Math.round(
    impl * 0.3 +
      speed * 0.23 +
      planning * 0.17 +
      review * 0.12 +
      stamina * 0.1 +
      adaptability * 0.08
  );
}

// Public interface
export interface GithubCharacterData {
  user: GithubUser;
  stats: {
    skills: {
      implementation: number;
      planning: number;
      speed: number;
      review: number;
      stamina: number;
      adaptability: number;
    };
    tech: { primary: string[]; all: string[] };
    tendency: "implementation" | "planning" | "balanced";
    deckScore: number;
  };
}

export async function getCharacterData(token: string): Promise<GithubCharacterData> {
  const user  = await fetchUser(token);
  const repos = await fetchAllRepos(token);
  const [languages, contributions, prs] = await Promise.all([
    fetchAllLanguages(token, repos),
    fetchContributions(token, user.login),
    fetchPullRequests(token, user.login),
  ]);

  const sorted  = Object.entries(languages).sort(([, a], [, b]) => b - a);
  const impl     = calcImplementation(contributions.contributionCalendar.totalContributions);
  const planning = calcPlanning(repos, sorted.length);
  const speed    = calcSpeed(contributions, prs);
  const review   = calcReview(contributions, prs);
  const stamina  = calcStamina(contributions);
  const adaptability = calcAdaptability(repos, languages);

  return {
    user,
    stats: {
      skills:    {
        implementation: impl,
        planning,
        speed,
        review,
        stamina,
        adaptability,
      },
      tech:      { primary: sorted.slice(0, 2).map(([l]) => l), all: sorted.map(([l]) => l) },
      tendency:  calcTendency(impl, planning, speed),
      deckScore: calcDeckScore(impl, planning, speed, review, stamina, adaptability),
    },
  };
}
