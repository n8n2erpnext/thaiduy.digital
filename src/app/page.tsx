import { ActivityRail } from '@/components/living/activity-rail'
import { EntityConsole } from '@/components/living/entity-console'
import { LivingCanvas } from '@/components/living/living-canvas'
import { MusicOrgan } from '@/components/living/music-organ'
import { SiteHeader } from '@/components/site/header'

const surfaces = [
  { kicker: 'PROJECTS', title: 'Systems with a pulse', copy: 'LightBI, Light Remote, Sentinel and the n8n2erpnext ecosystem will expose public state beside their human-readable stories.' },
  { kicker: 'BUILD LOG', title: 'A visible history', copy: 'Deployments, milestones and field notes become an event rail instead of a disconnected archive of posts.' },
  { kicker: 'STACK', title: 'Infrastructure as a place', copy: 'Topology, nodes and services become an explorable surface while private network details stay private.' },
] as const

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero hero-v2">
          <div className="hero-copy">
            <p className="eyebrow">THÁI DUY / LIVING SYSTEMS LAB</p>
            <h1>A public surface for systems that are actually alive.</h1>
            <p className="hero-lede">Projects, infrastructure, machine senses and field notes — presented as one calm digital organism. Motion will come from real state, not decorative noise.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#living-field">Enter living field <span aria-hidden="true">↘</span></a>
              <a className="text-action" href="#projects">Explore surfaces <span aria-hidden="true">→</span></a>
            </div>
            <div className="hero-principles" aria-label="Design principles">
              <span>real state over fake motion</span><span>quiet when idle</span><span>reactive when alive</span>
            </div>
          </div>

          <div className="living-field" id="living-field">
            <div className="field-topbar"><span>LIVING FIELD / LOCAL PROTOTYPE</span><span className="field-truth">EXTERNAL FEEDS · OFFLINE</span></div>
            <LivingCanvas />
            <div className="field-footer"><span>UI heartbeat · local</span><span>entity links · reserved</span><span>telemetry · not connected</span></div>
          </div>
        </section>

        <ActivityRail />

        <section className="organ-section">
          <div className="section-heading"><p className="eyebrow">ORGANS / PUBLIC STATE</p><h2>Each system gets one truthful way to speak.</h2></div>
          <div className="organ-grid"><EntityConsole /><MusicOrgan /></div>
        </section>

        <section className="surface-section" id="projects">
          <div className="section-heading"><p className="eyebrow">PUBLIC SURFACES</p><h2>Not a portfolio dashboard. A readable system.</h2></div>
          <div className="surface-grid">
            {surfaces.map((surface) => (
              <article className="surface-card" key={surface.kicker}>
                <span>{surface.kicker}</span><h3>{surface.title}</h3><p>{surface.copy}</p>
                <div className="surface-signal" aria-hidden="true"><i /><i /><i /></div>
              </article>
            ))}
          </div>
        </section>

        <section className="manifesto">
          <blockquote>When the ecosystem is quiet, the site is quiet. When something real happens, the surface responds.</blockquote>
          <div className="manifesto-meta"><span>MB · THINKING</span><span>SENTINEL · WATCHING</span><span>MUSIC · LISTENING / HUMMING / RESTING</span><span>SYSTEM · CALM / ACTIVE / DEGRADED</span></div>
        </section>
      </main>
      <footer className="site-footer"><span>THAIDUY.DIGITAL / GREENFIELD 2026</span><span>BOOTSTRAP · PORT 3000</span></footer>
    </div>
  )
}
