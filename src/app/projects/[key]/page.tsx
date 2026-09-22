import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site/header'
import { getPublishedRegistryItem } from '@/content/repository'
import { textFor } from '@/content/types'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { getLivePublicStackGraph } from '@/server/stack/public'
import { projectRuntimeFromStack } from '@/server/stack/projection'

type Props = { params: Promise<{ key:string }> }

function metaText(
  meta:Record<string,unknown>,
  locale:'en'|'vi',
  enKey:string,
  viKey:string,
) {
  const primary = String(meta[locale === 'vi' ? viKey : enKey] ?? '').trim()
  const fallback = String(meta[locale === 'vi' ? enKey : viKey] ?? '').trim()
  return primary || fallback
}

function lines(value:string) {
  return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
}

function safeExternal(value:unknown) {
  const raw = String(value ?? '').trim()
  return /^https?:\/\//i.test(raw) ? raw : ''
}

function initials(value:string) {
  return value.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase()
}

export async function generateMetadata({ params }:Props):Promise<Metadata> {
  const { key } = await params
  const [project,locale] = await Promise.all([
    getPublishedRegistryItem('project',key),
    resolveLocale(),
  ])
  if (!project) return {}
  return {
    title:textFor(project.label,locale),
    description:textFor(project.summary,locale),
  }
}
export default async function ProjectDetailPage({ params }:Props) {
  const { key } = await params
  const locale = await resolveLocale()
  const project = await getPublishedRegistryItem('project',key)
  if (!project) notFound()

  const { graph } = await getLivePublicStackGraph()
  const runtimeMap = await projectRuntimeFromStack(graph)
  const runtime = runtimeMap[project.key]
  const nodeIds = new Set(runtime?.nodeIds ?? [])
  const nodes = graph.nodes
    .filter(node => nodeIds.has(node.id))
    .sort((a,b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
  const edges = graph.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))

  const label = textFor(project.label,locale)
  const role = textFor(project.title,locale)
  const summary = textFor(project.summary,locale)
  const meta = project.meta ?? {}
  const logoUrl = String(meta.logoUrl ?? '')
  const overview = metaText(meta,locale,'overviewEn','overviewVi') || summary
  const highlightItems = lines(metaText(meta,locale,'highlightsEn','highlightsVi'))
  const architecture = metaText(meta,locale,'architectureEn','architectureVi')
  const plane = String(meta.plane ?? '')
  const mode = String(meta.mode ?? '')
  const t = messages[locale].projectSurface
  const stateKey = runtime?.state ?? 'offline'
  const stateLabel = t.states[stateKey]

  const links = [
    ['WEBSITE',safeExternal(meta.websiteUrl)],
    ['DEMO',safeExternal(meta.demoUrl)],
    ['GITHUB',safeExternal(meta.githubUrl)],
    ['DOCS',safeExternal(meta.docsUrl)],
  ].filter((entry):entry is [string,string] => Boolean(entry[1]))

  const copy = locale === 'vi'
    ? {
        back:'← DỰ ÁN',
        overview:'TỔNG QUAN',
        highlights:'ĐIỂM NỔI BẬT',
        runtime:'HỆ THỐNG ĐANG CHẠY',
        architecture:'KIẾN TRÚC',
        links:'LIÊN KẾT',
        stack:'XEM TRONG STACK →',
        updated:'CẬP NHẬT RUNTIME',
        nodes:'NODE',
        relations:'LIÊN KẾT',
        live:'LIVE',
        empty:'Chưa có node runtime nào được liên kết với dự án này.',
      }
    : {
        back:'← PROJECTS',
        overview:'OVERVIEW',
        highlights:'HIGHLIGHTS',
        runtime:'LIVE SYSTEM',
        architecture:'ARCHITECTURE',
        links:'PROJECT LINKS',
        stack:'OPEN IN STACK →',
        updated:'RUNTIME UPDATED',
        nodes:'NODES',
        relations:'RELATIONS',
        live:'LIVE',
        empty:'No runtime nodes are currently bound to this project.',
      }
  return (
    <div className="site-shell project-detail-page">
      <SiteHeader locale={locale} />
      <main>
        <section className="project-detail-hero">
          <div className="project-detail-breadcrumb">
            <Link href="/projects">{copy.back}</Link>
          </div>

          <div className="project-detail-hero-grid">
            <div className="project-detail-mark" aria-hidden="true">
              {logoUrl
                ? <img src={logoUrl} alt="" />
                : <span>{initials(label)}</span>}
            </div>

            <div className="project-detail-title">
              <div className="project-detail-kicker">
                <span>{plane}</span>
                <i>{mode}</i>
              </div>
              <h1>{label}</h1>
              {role && <strong>{role}</strong>}
              {summary && <p>{summary}</p>}
            </div>
          </div>

          <div className="project-detail-facts">
            <div>
              <span>RUNTIME</span>
              <strong data-runtime={stateKey}>{stateLabel}</strong>
            </div>
            <div>
              <span>{copy.nodes}</span>
              <strong>{runtime?.matchedCount ?? 0}</strong>
            </div>
            <div>
              <span>{copy.relations}</span>
              <strong>{edges.length}</strong>
            </div>
            <div>
              <span>{copy.updated}</span>
              <strong>{new Date(graph.generatedAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-GB')}</strong>
            </div>
          </div>
        </section>
        <section className="project-detail-body">
          <article className="project-detail-overview">
            <span>{copy.overview}</span>
            <p>{overview}</p>
          </article>

          {highlightItems.length > 0 && (
            <section className="project-detail-highlights">
              <header><span>{copy.highlights}</span></header>
              <div>
                {highlightItems.map((item,index) => (
                  <article key={item + index}>
                    <em>{String(index + 1).padStart(2,'0')}</em>
                    <strong>{item}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="project-detail-runtime">
            <header>
              <div>
                <span>{copy.runtime}</span>
                <strong>{runtime?.onlineCount ?? 0} ONLINE · {runtime?.degradedCount ?? 0} DEGRADED</strong>
              </div>
              <Link href="/stack">{copy.stack}</Link>
            </header>

            {nodes.length > 0 ? (
              <div className="project-runtime-node-grid">
                {nodes.map(node => (
                  <article key={node.id} data-state={node.state}>
                    <div>
                      <i />
                      <span>{node.group}</span>
                    </div>
                    <strong>{node.label}</strong>
                    <p>{node.role}</p>
                    <footer>
                      <span>{node.runtime}</span>
                      <span>{node.kind}</span>
                      <span>{node.state}</span>
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <p className="project-runtime-empty">{copy.empty}</p>
            )}
          </section>
          {architecture && (
            <section className="project-detail-architecture">
              <span>{copy.architecture}</span>
              <p>{architecture}</p>
              <div className="project-architecture-strip" aria-hidden="true">
                <i /><i /><i /><i /><i />
              </div>
            </section>
          )}

          <section className="project-detail-links">
            <header><span>{copy.links}</span></header>
            <div>
              <Link href="/stack">STACK <b>→</b></Link>
              {links.map(([name,href]) => (
                <a href={href} target="_blank" rel="noopener noreferrer" key={name}>
                  {name} <b>↗</b>
                </a>
              ))}
            </div>
          </section>

          <footer className="project-detail-footer">
            <Link href="/projects">{copy.back}</Link>
            <span>{project.key}</span>
          </footer>
        </section>
      </main>
    </div>
  )
}
