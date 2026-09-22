import 'server-only'

const ORG = 'n8n2erpnext'
const API = 'https://api.github.com'
const REVALIDATE_SECONDS = 900

type GitHubRepoApi = {
  name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
  archived: boolean
}

type GitHubCommitApi = {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { name: string; date: string | null } | null
    committer: { date: string | null } | null
  }
}

type GitHubCommitSearchApi = {
  total_count: number
  items: Array<GitHubCommitApi & {
    repository: { name: string; full_name: string }
  }>
}

export type GitHubActivityDay = {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export type GitHubRepoPulse = {
  name: string
  url: string
  description: string
  language: string
  stars: number
  forks: number
  issues: number
  pushedAt: string
  latestCommit: {
    sha: string
    url: string
    message: string
    author: string
    committedAt: string
  } | null
}

export type GitHubPublicPulse = {
  status: 'live' | 'degraded'
  organization: string
  organizationUrl: string
  fetchedAt: string
  repoCount: number
  stars: number
  forks: number
  issues: number
  active30d: number
  repos: GitHubRepoPulse[]
  activity: {
    startDate: string
    endDate: string
    total: number
    complete: boolean
    days: GitHubActivityDay[]
  }
}
function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'thaiduy.digital-public-pulse',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: githubHeaders(),
    next: { revalidate: REVALIDATE_SECONDS },
  })
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`)
  }
  return response.json() as Promise<T>
}

function firstLine(value: string) {
  return value.split(/\r?\n/, 1)[0]?.trim() || 'Commit'
}
async function latestCommit(repo: string) {
  try {
    const commits = await githubJson<GitHubCommitApi[]>(
      `/repos/${ORG}/${encodeURIComponent(repo)}/commits?per_page=1`,
    )
    const item = commits[0]
    if (!item) return null
    return {
      sha: item.sha.slice(0, 7),
      url: item.html_url,
      message: firstLine(item.commit.message),
      author: item.commit.author?.name || 'unknown',
      committedAt:
        item.commit.committer?.date ||
        item.commit.author?.date ||
        new Date().toISOString(),
    }
  } catch {
    return null
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10)
}

function startOfUtcWeek(value: Date) {
  const day = new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  ))
  day.setUTCDate(day.getUTCDate() - day.getUTCDay())
  return day
}

async function getOrgCommitActivity() {
  const now = new Date()
  const today = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  ))
  const start = startOfUtcWeek(today)
  start.setUTCDate(start.getUTCDate() - 52 * 7)
  const endGrid = new Date(start.getTime() + 370 * DAY_MS)
  const query = `org:${ORG} committer-date:${isoDay(start)}..${isoDay(today)}`
  const items: GitHubCommitSearchApi['items'] = []
  let indexedTotal = 0

  for (let page = 1; page <= 10; page += 1) {
    const params = new URLSearchParams({
      q: query,
      per_page: '100',
      page: String(page),
      sort: 'committer-date',
      order: 'desc',
    })
    const result = await githubJson<GitHubCommitSearchApi>(
      `/search/commits?${params.toString()}`,
    )
    indexedTotal = result.total_count
    items.push(...result.items.filter((item) => item.repository.name !== '.github'))
    if (result.items.length < 100 || page * 100 >= Math.min(indexedTotal, 1000)) break
  }

  const counts = new Map<string, number>()
  for (const item of items) {
    const date = item.commit.committer?.date || item.commit.author?.date
    if (!date) continue
    const key = isoDay(new Date(date))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const max = Math.max(1, ...counts.values())
  const days: GitHubActivityDay[] = []
  for (let cursor = new Date(start); cursor <= endGrid; cursor = new Date(cursor.getTime() + DAY_MS)) {
    const date = isoDay(cursor)
    const count = cursor <= today ? (counts.get(date) ?? 0) : 0
    const ratio = count / max
    const level: GitHubActivityDay['level'] =
      count === 0 ? 0 : ratio <= .25 ? 1 : ratio <= .5 ? 2 : ratio <= .75 ? 3 : 4
    days.push({ date, count, level })
  }

  return {
    startDate: isoDay(start),
    endDate: isoDay(today),
    total: [...counts.values()].reduce((sum, count) => sum + count, 0),
    complete: indexedTotal <= 1000,
    days,
  }
}

export async function getGitHubPublicPulse(): Promise<GitHubPublicPulse> {
  const fetchedAt = new Date().toISOString()
  try {
    const [repos, activity] = await Promise.all([
      githubJson<GitHubRepoApi[]>(
        `/orgs/${ORG}/repos?type=public&sort=pushed&per_page=100`,
      ),
      getOrgCommitActivity(),
    ])
    const publicRepos = repos.filter((repo) => repo.name !== '.github')
    const visible = publicRepos.filter((repo) => !repo.archived).slice(0, 7)
    const commits = await Promise.all(visible.map((repo) => latestCommit(repo.name)))
    const now = Date.now()
    const activeWindow = 30 * 24 * 60 * 60 * 1000

    return {
      status: 'live',
      organization: ORG,
      organizationUrl: `https://github.com/${ORG}`,
      fetchedAt,
      repoCount: publicRepos.length,
      stars: publicRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      forks: publicRepos.reduce((sum, repo) => sum + repo.forks_count, 0),
      issues: publicRepos.reduce((sum, repo) => sum + repo.open_issues_count, 0),
      active30d: publicRepos.filter(
        (repo) => now - new Date(repo.pushed_at).getTime() <= activeWindow,
      ).length,
      activity,
      repos: visible.map((repo, index) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description || '',
        language: repo.language || '—',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        pushedAt: repo.pushed_at,
        latestCommit: commits[index] ?? null,
      })),
    }
  } catch {
    return {
      status: 'degraded',
      organization: ORG,
      organizationUrl: `https://github.com/${ORG}`,
      fetchedAt,
      repoCount: 0,
      stars: 0,
      forks: 0,
      issues: 0,
      active30d: 0,
      repos: [],
      activity: {
        startDate: fetchedAt.slice(0, 10),
        endDate: fetchedAt.slice(0, 10),
        total: 0,
        complete: false,
        days: [],
      },
    }
  }
}
