import type { Locale } from '@/i18n/config'
import type { GitHubPublicPulse } from '@/server/github/public-pulse'

type Props = {
  locale: Locale
  pulse: GitHubPublicPulse
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function monthName(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function GitHubPublicPulseView({ locale, pulse }: Props) {
  const vi = locale === 'vi'
  const repoRows = pulse.repos.slice(0, 5)
  const commits = pulse.repos
    .map((repo) => ({ repo: repo.name, commit: repo.latestCommit }))
    .filter((item) => item.commit)
    .slice(0, 7)
  const weeks = Array.from(
    { length: Math.ceil(pulse.activity.days.length / 7) },
    (_, index) => pulse.activity.days.slice(index * 7, index * 7 + 7),
  )
  const monthLabels = weeks.map((week, index) => {
    const current = week[0] ? monthName(week[0].date, locale) : ''
    const previous = index > 0 && weeks[index - 1]?.[0]
      ? monthName(weeks[index - 1][0].date, locale)
      : ''
    return current !== previous ? current : ''
  })
  const labels = vi
    ? {
        repos: 'REPO CÔNG KHAI',
        stars: 'STARS',
        forks: 'FORKS',
        active: 'HOẠT ĐỘNG / 30 NGÀY',
        repoList: 'REPO / PUSH GẦN NHẤT',
        commitList: 'COMMIT MỚI NHẤT',
        cached: 'GITHUB PUBLIC API · CACHE 15 PHÚT',
        degraded: 'TÍN HIỆU GITHUB BỊ GIÁN ĐOẠN',
        noSignal: 'Chưa có commit công khai trong khoảng thời gian này.',
        activity: 'HOẠT ĐỘNG COMMIT CÔNG KHAI / 53 TUẦN',
        indexed: 'commit công khai đã được GitHub lập chỉ mục',
        partial: 'kết quả vượt giới hạn lập chỉ mục',
        source: 'Nguồn: GitHub',
        less: 'Ít',
        more: 'Nhiều',
        viewOrg: 'XEM TỔ CHỨC',
        pushed: 'PUSH',
      }
    : {
        repos: 'PUBLIC REPOS',
        stars: 'STARS',
        forks: 'FORKS',
        active: 'ACTIVE / 30D',
        repoList: 'REPOSITORIES / RECENT PUSH',
        commitList: 'LATEST COMMIT SIGNAL',
        cached: 'GITHUB PUBLIC API · 15 MIN CACHE',
        degraded: 'GITHUB SIGNAL DEGRADED',
        noSignal: 'No public commit signal is available in the current window.',
        activity: 'PUBLIC COMMIT ACTIVITY / 53 WEEKS',
        indexed: 'public commits indexed by GitHub',
        partial: 'index result exceeded the cap',
        source: 'Source: GitHub',
        less: 'Less',
        more: 'More',
        viewOrg: 'VIEW ORG',
        pushed: 'PUSH',
      }

  return (
    <div className="home-github-pulse" data-state={pulse.status}>
      <header className="home-github-pulse-head">
        <div>
          <span>GITHUB / {pulse.organization}</span>
          <strong>{pulse.status === 'live' ? labels.cached : labels.degraded}</strong>
        </div>
        <i className="home-github-live-dot" aria-hidden="true" />
      </header>

      <div className="home-github-summary">
        <article><span>{labels.repos}</span><strong>{pulse.repoCount}</strong></article>
        <article><span>{labels.stars}</span><strong>{pulse.stars}</strong></article>
        <article><span>{labels.forks}</span><strong>{pulse.forks}</strong></article>
        <article><span>{labels.active}</span><strong>{pulse.active30d}</strong></article>
      </div>

      <div className="home-github-body">
        <section className="home-github-repos">
          <header><span>{labels.repoList}</span><span>{repoRows.length}/5</span></header>
          {repoRows.map((repo, index) => (
            <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer">
              <span className="home-github-repo-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="home-github-repo-copy">
                <strong>{repo.name}</strong>
                <p>{repo.description || '—'}</p>
                <footer>
                  <span>{repo.language}</span>
                  <span>{labels.pushed} {formatDate(repo.pushedAt, locale)}</span>
                </footer>
              </div>
              <div className="home-github-repo-stats">
                <span>★ {repo.stars}</span>
                <span>FORK {repo.forks}</span>
                <span>ISSUES {repo.issues}</span>
              </div>
              <em>↗</em>
            </a>
          ))}
        </section>

        <aside className="home-github-commits">
          <header><span>{labels.commitList}</span><span>{commits.length}</span></header>
          {commits.length ? commits.map(({ repo, commit }) => commit && (
            <a key={repo + commit.sha} href={commit.url} target="_blank" rel="noreferrer">
              <div className="home-github-commit-meta">
                <span>{repo}</span>
                <code>{commit.sha}</code>
              </div>
              <strong>{commit.message}</strong>
              <footer>
                <span>{commit.author}</span>
                <time>{formatDate(commit.committedAt, locale)}</time>
              </footer>
            </a>
          )) : <p className="home-github-empty">{labels.noSignal}</p>}
        </aside>
      </div>

      <section className="home-github-heatmap" aria-label={labels.activity}>
        <header>
          <span>{labels.activity}</span>
          <span>{pulse.activity.total} {labels.indexed}</span>
        </header>
        {weeks.length ? (
          <div className="home-github-heatmap-scroll">
            <div className="home-github-heatmap-months" aria-hidden="true">
              {monthLabels.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
            <div className="home-github-heatmap-weeks">
              {weeks.map((week, weekIndex) => (
                <div className="home-github-heatmap-week" key={weekIndex}>
                  {week.map((day) => (
                    <span
                      key={day.date}
                      className="home-github-heatmap-day"
                      data-level={day.level}
                      title={`${day.date} · ${day.count} commits`}
                      aria-label={`${day.date}: ${day.count} commits`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="home-github-empty">{labels.noSignal}</p>
        )}
        <footer>
          <p>
            <strong>{pulse.activity.total}</strong> {labels.indexed}, {formatDate(pulse.activity.startDate, locale)}
            {' — '}{formatDate(pulse.activity.endDate, locale)}.
            {!pulse.activity.complete ? ` ${labels.partial}.` : ''}
            {' '}<a href={pulse.organizationUrl} target="_blank" rel="noreferrer">{labels.source}</a>.
          </p>
          <div className="home-github-heatmap-legend" aria-label={`${labels.less} — ${labels.more}`}>
            <span>{labels.less}</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} data-level={level} />
            ))}
            <span>{labels.more}</span>
          </div>
        </footer>
      </section>

      <footer className="home-github-pulse-foot">
        <span>
          {pulse.status === 'live'
            ? (vi ? 'DỮ LIỆU CÔNG KHAI · KHÔNG GIẢ LẬP' : 'PUBLIC DATA · NO SIMULATION')
            : labels.degraded}
        </span>
        <a href={pulse.organizationUrl} target="_blank" rel="noreferrer">
          {labels.viewOrg} ↗
        </a>
      </footer>
    </div>
  )
}
