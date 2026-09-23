import Link from 'next/link'
import { GitHubPublicPulseView } from '@/components/home/github-public-pulse'
import { PublicSignalTicker } from '@/components/home/public-signal-ticker'
import { MusicOrgan } from '@/components/living/music-organ'
import { RackServerVisual } from '@/components/home/rack-server-visual/rack-server-visual'
import { TopAtmosphere } from '@/components/home/top-atmosphere'
import { SiteHeader } from '@/components/site/header'
import { WritingTagChip } from '@/components/writing/tag-chip'
import { getPublishedPosts, localizedPost } from '@/content/posts'
import { resolveManagedSection } from '@/content/presentation'
import { getRegistry } from '@/content/repository'
import { textFor } from '@/content/types'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { getGitHubPublicPulse } from '@/server/github/public-pulse'
import { getPublicApiWall } from '@/server/public/api-wall'
import { getLatestLunaTelegramMessages } from '@/server/sentinel/telegram-wall'
import { getPublicOrganismState } from '@/server/stack/organism'

function initials(value:string) {
  return value.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()
}

function compactDateTime(value:string,locale:'en'|'vi') {
  return new Intl.DateTimeFormat(locale==='vi'?'vi-VN':'en-GB',{
    day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',
    hour12:false,timeZone:'Asia/Ho_Chi_Minh',
  }).format(new Date(value))
}

function lunaAlertTitle(kind:string,locale:'en'|'vi') {
  if (locale!=='vi') return kind==='SUBNET_SCAN' ? 'Subnet scan correlation' : 'Behavioral anomaly'
  return kind==='SUBNET_SCAN' ? 'Dấu hiệu quét subnet' : 'Hành vi bất thường'
}

function lunaPattern(pattern:string,locale:'en'|'vi') {
  const plain=pattern.replace(/_/g,' ')
  if (locale!=='vi') return plain
  if (pattern==='targeted_probe') return 'thăm dò có mục tiêu'
  if (pattern==='distributed_subnet_probe') return 'thăm dò subnet phân tán'
  if (pattern==='broad_probe') return 'thăm dò diện rộng'
  return plain
}

function lunaScanFocus(value:string,locale:'en'|'vi') {
  if (locale!=='vi') return value
  return value
    .replace('distributed subnet probe','thăm dò subnet phân tán')
    .replace(/(\d+) sources?/g,'$1 nguồn')
    .replace(/(\d+) probe hits?/g,'$1 lượt probe')
}

export default async function Home() {
  const locale=await resolveLocale()
  const t=messages[locale].home
  const [hero,projects,posts,organism,githubPulse,apiWall,lunaTelegramMessages]=await Promise.all([
    resolveManagedSection('home.hero',locale,{
      eyebrow:t.eyebrow,
      title:t.title,
      copy:t.lede,
    }),
    getRegistry('project'),
    getPublishedPosts(),
    getPublicOrganismState(locale),
    getGitHubPublicPulse(),
    getPublicApiWall(),
    getLatestLunaTelegramMessages(),
  ])

  const selectedProjects=projects.slice(0,3)
  const selectedPosts=posts.slice(0,3)
  const onlineNodes=organism.nodes.filter(node=>node.state==='online')
  const online=onlineNodes.length
  const degraded=organism.nodes.filter(node=>node.state==='degraded').length
  const liveSystemNames=onlineNodes.filter(node=>node.id!=='entity-core').map(node=>node.label)
  const liveSystemLine=liveSystemNames.slice(0,3).join(' · ')+(liveSystemNames.length>3?` · +${liveSystemNames.length-3}`:'')
  const currentRepo=githubPulse.repos[0] ?? null
  const currentCommit=currentRepo?.latestCommit ?? null
  const nowCopy=locale==='vi'
    ? {
        index:'PHÒNG LAB HỆ THỐNG',
        mode:'BUILD · OBSERVE · WRITE · EXPERIMENT',
        now:'HIỆN TẠI',
        live:'HỆ THỐNG ĐANG CHẠY',
        work:'ĐANG LÀM GÌ',
        notes:'BÀI MỚI',
        trace:'DÒNG TÍN HIỆU',
        siteLog:'THAIDUY.DIGITAL / API WALL',
        lunaLog:'LUNA / TELEGRAM',
        selected:'DỰ ÁN TIÊU BIỂU',
        selectedCopy:'Một vài hệ thống tôi đang xây, vận hành và quan sát công khai.',
        allProjects:'XEM TẤT CẢ DỰ ÁN',
        fieldNotes:'GHI CHÉP KỸ THUẬT',
        fieldNotesCopy:'Những điều rút ra trong quá trình xây và vận hành hệ thống.',
        allWriting:'XEM TẤT CẢ BÀI VIẾT',
        instrument:'CẢM BIẾN ÂM THANH',
        instrumentCopy:'Một cảm biến đang lắng nghe, diễn giải và đôi khi tự ngân nga.',
        code:'MÃ NGUỒN CÔNG KHAI',
        codeCopy:'Nhịp phát triển công khai của n8n2erpnext — repo, commit và tín hiệu thực từ GitHub.',
        openGithub:'XEM GITHUB',
        openMusic:'XEM MUSIC SENSOR',
      }
    : {
        index:'PUBLIC SYSTEMS LAB',
        mode:'BUILD · OBSERVE · WRITE · EXPERIMENT',
        now:'NOW',
        live:'LIVE SYSTEMS',
        work:'CURRENT PUBLIC WORK',
        notes:'FIELD NOTES',
        trace:'LIVE TRACE',
        siteLog:'THAIDUY.DIGITAL / API WALL',
        lunaLog:'LUNA / TELEGRAM',
        selected:'SELECTED WORK',
        selectedCopy:'A few systems being built, operated and observed in public.',
        allProjects:'ALL PROJECTS',
        fieldNotes:'FIELD NOTES',
        fieldNotesCopy:'What the systems teach while they are being built.',
        allWriting:'ALL WRITING',
        instrument:'LIVE INSTRUMENT',
        instrumentCopy:'A sensor listening, interpreting and occasionally humming to itself.',
        code:'PUBLIC CODE',
        codeCopy:'A live public engineering pulse from n8n2erpnext — repositories, commits and real GitHub signals.',
        openGithub:'OPEN GITHUB',
        openMusic:'OPEN MUSIC SENSOR',
      }

  return (
    <div className="home-public-page">
      <TopAtmosphere />
      <div className="site-shell home-public-shell">
        <SiteHeader locale={locale} />

        <main className="home-public-main">
          <section className="home-public-hero home-public-hero-rack">
            <div className="home-public-hero-copy">
              <div className="home-public-hero-index">
                <span>{nowCopy.index}</span>
                <span>2026 / {organism.mode.toUpperCase()}</span>
              </div>
              <p className="home-public-mode">{nowCopy.mode}</p>
              <h1>{hero.title}</h1>
              <p className="home-public-hero-lede">{hero.copy}</p>
              <div className="home-public-hero-links">
                <Link href="/projects">{locale==='vi'?'XEM DỰ ÁN':'VIEW PROJECTS'} ↗</Link>
                <Link href="/writing">{locale==='vi'?'ĐỌC BÀI VIẾT':'READ NOTES'} ↗</Link>
              </div>
              <div className="home-public-hero-runtime" aria-label={locale==='vi'?'Trạng thái runtime':'Runtime state'}>
                <span><i /> {online}/{organism.nodes.length} ONLINE</span>
                <span>{organism.links.length} LINKS</span>
                <span>{locale==='vi'?'TÍN HIỆU THỰC':'LIVE SIGNAL'}</span>
              </div>
            </div>
            <div className="home-public-hero-visual">
              <RackServerVisual />
            </div>
          </section>

          <section className="home-public-trace" aria-label={nowCopy.trace}>
            <header><span>{nowCopy.trace}</span><i /></header>
            <div className="home-public-trace-grid">
              <div className="home-public-trace-item home-public-api-wall">
                <span>{nowCopy.siteLog}</span>
                {apiWall.length ? (
                  <div className="home-public-api-list">
                    {apiWall.map((event,index)=>(
                      <div className="home-public-api-row" key={event.at+'-'+index}>
                        <code>{event.method}</code>
                        <strong>{event.path}</strong>
                        <small>{event.status} · {event.durationMs} ms · {compactDateTime(event.at,locale)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <strong>{locale==='vi'?'Chưa có tín hiệu API an toàn để công khai':'No public-safe API signal'}</strong>
                )}
                <small>{locale==='vi'?'WALL-SAFE · ĐÃ ẨN IP / HEADER / BODY':'WALL-SAFE · IP / HEADERS / BODY REDACTED'}</small>
              </div>
              <div className="home-public-trace-item home-public-trace-luna">
                <span>{nowCopy.lunaLog}</span>
                {lunaTelegramMessages.length ? (
                  <div className="home-public-luna-list">
                    {lunaTelegramMessages.map((message,index)=>(
                      <div className="home-public-luna-row" key={message.deliveredAt+'-'+index}>
                        <div className="home-public-luna-row-head">
                          <strong>{lunaAlertTitle(message.kind,locale)}</strong>
                          <small>{message.severity.toUpperCase()} · {compactDateTime(message.deliveredAt,locale)}</small>
                        </div>
                        <p>
                          {lunaPattern(message.pattern,locale)} · {message.observations} {locale==='vi'?'quan sát':'observations'} · {locale==='vi'?'độ tin cậy':'confidence'} {message.confidence.toFixed(2)}
                        </p>
                        <code>{locale==='vi'?'MỤC TIÊU QUÉT':'SCAN FOCUS'} · {lunaScanFocus(message.scanFocus,locale)}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <strong>{locale==='vi'?'Chưa có cảnh báo Telegram':'No Telegram alert signal'}</strong>
                )}
                <small>{locale==='vi'?'TELEGRAM OUTBOX · BỎ QUA BÁO CÁO HẰNG NGÀY · ĐÃ ẨN IP NGUỒN':'TELEGRAM OUTBOX · DAILY REPORTS EXCLUDED · SOURCE IP HIDDEN'}</small>
              </div>
            </div>
          </section>

          <section className="home-public-now" aria-label={nowCopy.now}>
            <header><span>{nowCopy.now}</span><i /></header>
            <div className="home-public-now-grid">
              <Link href="/stack" className="home-public-now-item">
                <span className="home-public-now-kicker">{nowCopy.live}</span>
                <strong>{liveSystemLine || (locale==='vi'?'Chưa có hệ thống công khai nào online':'No public systems online')}</strong>
                <small>
                  {online}/{organism.nodes.length} ONLINE · {organism.links.length} LINKS · {compactDateTime(organism.updatedAt,locale)}
                  {degraded ? ` · ${degraded} DEGRADED` : ''}
                </small>
                <em>↗</em>
              </Link>
              <a
                href={currentRepo?.url ?? '/projects'}
                className="home-public-now-item"
                target={currentRepo?'_blank':undefined}
                rel={currentRepo?'noreferrer':undefined}
              >
                <span className="home-public-now-kicker">{nowCopy.work}</span>
                <strong>{currentRepo?.name ?? '—'}</strong>
                <small>
                  {currentCommit
                    ? `${currentCommit.sha} · ${currentCommit.message}`
                    : currentRepo
                      ? `${locale==='vi'?'PUSH':'PUSH'} ${compactDateTime(currentRepo.pushedAt,locale)}`
                      : '—'}
                </small>
                <em>↗</em>
              </a>
              <Link href="/writing" className="home-public-now-item">
                <span className="home-public-now-kicker">{nowCopy.notes}</span>
                <strong>{selectedPosts[0] ? localizedPost(selectedPosts[0],locale).title : '—'}</strong>
                <small>{selectedPosts[0]?.publishedAt?.toLocaleDateString(locale==='vi'?'vi-VN':'en-GB') ?? '—'}</small>
                <em>↗</em>
              </Link>
            </div>
          </section>

          <section className="home-public-section home-public-projects">
            <div className="home-public-section-head">
              <div>
                <span className="home-public-section-index">01</span>
                <h2>{nowCopy.selected}</h2>
                <p>{nowCopy.selectedCopy}</p>
              </div>
              <Link href="/projects">{nowCopy.allProjects} ↗</Link>
            </div>

            <div className="home-public-project-list">
              {selectedProjects.map((project,index)=>{
                const label=textFor(project.label,locale)
                const logo=String(project.meta?.logoUrl ?? '')
                return (
                  <Link href={'/projects/'+project.key} className="home-public-project-row" key={project.id}>
                    <span className="home-public-project-index">{String(index+1).padStart(2,'0')}</span>
                    <span className="home-public-project-mark" aria-hidden="true">
                      {logo ? <img src={logo} alt="" /> : initials(label)}
                    </span>
                    <div className="home-public-project-copy">
                      <h3>{label}</h3>
                      <p>{textFor(project.summary,locale)}</p>
                    </div>
                    <div className="home-public-project-meta">
                      <span>{String(project.meta?.plane ?? '')}</span>
                      <span>{String(project.meta?.mode ?? '')}</span>
                    </div>
                    <em>↗</em>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="home-public-section home-public-writing">
            <div className="home-public-section-head">
              <div>
                <span className="home-public-section-index">02</span>
                <h2>{nowCopy.fieldNotes}</h2>
                <p>{nowCopy.fieldNotesCopy}</p>
              </div>
              <Link href="/writing">{nowCopy.allWriting} ↗</Link>
            </div>

            <div className="home-public-notes">
              {selectedPosts.map((post,index)=>{
                const copy=localizedPost(post,locale)
                return (
                  <article className="home-public-note" key={post.id}>
                    <Link href={'/writing/'+post.slug}>
                      <div className="home-public-note-top">
                        <span>{String(index+1).padStart(2,'0')}</span>
                        <time>{post.publishedAt?.toLocaleDateString(locale==='vi'?'vi-VN':'en-GB')}</time>
                      </div>
                      <h3>{copy.title}</h3>
                      {copy.excerpt && <p>{copy.excerpt}</p>}
                    </Link>
                    {post.tagRecords.some(tag=>tag.enabled) && (
                      <div className="home-public-note-tags">
                        {post.tagRecords.filter(tag=>tag.enabled).slice(0,3).map(tag=>(
                          <WritingTagChip key={tag.id} tag={tag}/>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="home-public-section home-public-instrument">
            <div className="home-public-section-head">
              <div>
                <span className="home-public-section-index">03</span>
                <h2>{nowCopy.instrument}</h2>
                <p>{nowCopy.instrumentCopy}</p>
              </div>
              <Link href="/music-sensor">{nowCopy.openMusic} ↗</Link>
            </div>
            <div className="home-public-instrument-body">
              <MusicOrgan locale={locale}/>
            </div>
          </section>

          <section className="home-public-section home-public-code">
            <div className="home-public-section-head">
              <div>
                <span className="home-public-section-index">04</span>
                <h2>{nowCopy.code}</h2>
                <p>{nowCopy.codeCopy}</p>
              </div>
              <a href={githubPulse.organizationUrl} target="_blank" rel="noreferrer">
                {nowCopy.openGithub} ↗
              </a>
            </div>
            <GitHubPublicPulseView locale={locale} pulse={githubPulse}/>

            <PublicSignalTicker
              locale={locale}
              repoCount={githubPulse.repoCount}
              commitCount={githubPulse.activity.total}
              online={online}
              nodeCount={organism.nodes.length}
              linkCount={organism.links.length}
              active30d={githubPulse.active30d}
              currentRepoName={currentRepo?.name ?? '—'}
            />
          </section>

          <section className="home-public-close">
            <aside className="home-public-close-rail home-public-close-rail-left" aria-label={locale==='vi'?'Nguyên tắc phòng lab':'Lab principles'}>
              <strong>{locale==='vi'?'MỘT PHÒNG LAB CÔNG KHAI':'A PUBLIC LAB'}</strong>
              <span>{locale==='vi'?'TRẠNG THÁI THẬT':'REAL STATE'}</span>
              <span>{locale==='vi'?'DỮ LIỆU CÔNG KHAI':'PUBLIC DATA'}</span>
              <span>{locale==='vi'?'KHÔNG GIẢ LẬP':'NO SIMULATION'}</span>
            </aside>
            <div className="home-public-close-poster">
              <div className="home-public-close-words" aria-label={locale==='vi'?'Xây. Quan sát. Ghi lại.':'Build. Observe. Write.'}>
                <strong>{locale==='vi'?'XÂY.':'BUILD.'}</strong>
                <strong>{locale==='vi'?'QUAN SÁT.':'OBSERVE.'}</strong>
                <strong>{locale==='vi'?'GHI LẠI.':'WRITE.'}</strong>
              </div>
              <p>{locale==='vi'
                ? 'Hệ thống thật luôn để lại dấu vết. Tôi ghi lại những gì chúng cho thấy.'
                : 'Real systems leave evidence. I keep the notes.'}</p>
            </div>
            <aside className="home-public-close-rail home-public-close-rail-right" aria-label={locale==='vi'?'Nhịp làm việc':'Working rhythm'}>
              <span>BUILD</span>
              <span>OBSERVE</span>
              <span>WRITE</span>
              <strong>{locale==='vi'?'GIỮ LẠI GHI CHÉP':'KEEP THE NOTES'}</strong>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
