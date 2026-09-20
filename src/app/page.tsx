import Link from 'next/link'
import { LivingCanvas } from '@/components/living/living-canvas'
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
import { getPublicOrganismState } from '@/server/stack/organism'

function initials(value:string) {
  return value.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()
}

export default async function Home() {
  const locale=await resolveLocale()
  const t=messages[locale].home
  const [hero,projects,posts,organism]=await Promise.all([
    resolveManagedSection('home.hero',locale,{
      eyebrow:t.eyebrow,
      title:t.title,
      copy:t.lede,
    }),
    getRegistry('project'),
    getPublishedPosts(),
    getPublicOrganismState(locale),
  ])

  const selectedProjects=projects.slice(0,3)
  const selectedPosts=posts.slice(0,3)
  const online=organism.nodes.filter(node=>node.state==='online').length
  const degraded=organism.nodes.filter(node=>node.state==='degraded').length
  const nowCopy=locale==='vi'
    ? {
        index:'PHÒNG LAB CÔNG KHAI',
        mode:'BUILD · OBSERVE · WRITE · EXPERIMENT',
        now:'HIỆN TẠI',
        live:'HỆ THỐNG LIVE',
        work:'ĐANG XÂY',
        notes:'GHI CHÚ',
        selected:'SELECTED WORK',
        selectedCopy:'Một vài hệ thống đang được xây, vận hành và quan sát công khai.',
        allProjects:'TẤT CẢ DỰ ÁN',
        fieldNotes:'FIELD NOTES',
        fieldNotesCopy:'Những gì học được trong lúc xây hệ thống.',
        allWriting:'TẤT CẢ BÀI VIẾT',
        instrument:'LIVE INSTRUMENT',
        instrumentCopy:'Một cảm biến đang nghe, diễn giải và tự ngân nga khi rảnh.',
        field:'LIVING FIELD',
        fieldCopy:'Không phải animation trang trí — đây là trạng thái công khai của các hệ đang sống.',
        openStack:'MỞ STACK',
        openMusic:'MỞ MUSIC SENSOR',
      }
    : {
        index:'PUBLIC SYSTEMS LAB',
        mode:'BUILD · OBSERVE · WRITE · EXPERIMENT',
        now:'NOW',
        live:'LIVE SYSTEMS',
        work:'CURRENT WORK',
        notes:'FIELD NOTES',
        selected:'SELECTED WORK',
        selectedCopy:'A few systems being built, operated and observed in public.',
        allProjects:'ALL PROJECTS',
        fieldNotes:'FIELD NOTES',
        fieldNotesCopy:'What the systems teach while they are being built.',
        allWriting:'ALL WRITING',
        instrument:'LIVE INSTRUMENT',
        instrumentCopy:'A sensor listening, interpreting and occasionally humming to itself.',
        field:'LIVING FIELD',
        fieldCopy:'Not decorative motion — this is a public projection of systems that are actually alive.',
        openStack:'OPEN STACK',
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
                <Link href="/writing">{locale==='vi'?'ĐỌC GHI CHÚ':'READ NOTES'} ↗</Link>
              </div>
              <div className="home-public-hero-runtime" aria-label={locale==='vi'?'Trạng thái runtime':'Runtime state'}>
                <span><i /> {online}/{organism.nodes.length} ONLINE</span>
                <span>{organism.links.length} LINKS</span>
                <span>{locale==='vi'?'TÍN HIỆU THẬT':'LIVE SIGNAL'}</span>
              </div>
            </div>
            <div className="home-public-hero-visual">
              <RackServerVisual />
            </div>
          </section>

          <section className="home-public-now" aria-label={nowCopy.now}>
            <header><span>{nowCopy.now}</span><i /></header>
            <div className="home-public-now-grid">
              <Link href="/stack" className="home-public-now-item">
                <span className="home-public-now-kicker">{nowCopy.live}</span>
                <strong>{organism.nodes.length} {locale==='vi'?'thực thể':'entities'} · {online} online</strong>
                <small>{degraded ? degraded+' degraded' : (locale==='vi'?'trạng thái ổn định':'runtime nominal')}</small>
                <em>↗</em>
              </Link>
              <Link href="/projects" className="home-public-now-item">
                <span className="home-public-now-kicker">{nowCopy.work}</span>
                <strong>{selectedProjects[0] ? textFor(selectedProjects[0].label,locale) : '—'}</strong>
                <small>{selectedProjects[0] ? textFor(selectedProjects[0].title,locale) : '—'}</small>
                <em>↗</em>
              </Link>
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
                <span>01</span>
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
                <span>02</span>
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
                <span>03</span>
                <h2>{nowCopy.instrument}</h2>
                <p>{nowCopy.instrumentCopy}</p>
              </div>
              <Link href="/music-sensor">{nowCopy.openMusic} ↗</Link>
            </div>
            <div className="home-public-instrument-body">
              <MusicOrgan locale={locale}/>
            </div>
          </section>

          <section className="home-public-section home-public-field">
            <div className="home-public-section-head">
              <div>
                <span>04</span>
                <h2>{nowCopy.field}</h2>
                <p>{nowCopy.fieldCopy}</p>
              </div>
              <Link href="/stack">{nowCopy.openStack} ↗</Link>
            </div>
            <div className="home-public-field-frame">
              <div className="home-public-field-meta">
                <span>{organism.nodes.length} NODES</span>
                <span>{organism.links.length} LINKS</span>
                <span>{organism.mode.toUpperCase()}</span>
              </div>
              <LivingCanvas locale={locale} initialState={organism}/>
            </div>
          </section>

          <section className="home-public-close">
            <span>{locale==='vi'?'MỘT PHÒNG LAB CÔNG KHAI':'A PUBLIC LAB'}</span>
            <p>{locale==='vi'
              ? 'Xây thứ thật. Quan sát trạng thái thật. Viết lại những gì học được.'
              : 'Build real things. Observe real state. Write down what the systems teach.'}</p>
          </section>
        </main>
      </div>
    </div>
  )
}
