import { EntityConsole } from '@/components/living/entity-console'
import { SiteHeader } from '@/components/site/header'

const surfaces = [
  {
    kicker: 'PROJECTS',
    title: 'Systems with a pulse',
    copy: 'Products and experiments presented with their real public state, not static screenshots.',
  },
  {
    kicker: 'BUILD LOG',
    title: 'A visible history',
    copy: 'Deployments, milestones and field notes become an event rail across the ecosystem.',
  },
  {
    kicker: 'STACK',
    title: 'Infrastructure as a living map',
    copy: 'Nodes, services and relationships surface as a safe public topology instead of a tool list.',
  },
]

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">THAIDUY.DIGITAL / LIVING SYSTEMS LAB</p>
            <h1>
              A personal site that behaves like the systems behind it.
            </h1>
            <p className="hero-lede">
              Projects, infrastructure, build history and machine senses exposed through one calm,
              living public surface.
            </p>

            <div className="hero-actions">
              <a className="primary-action" href="#projects">
                Explore the ecosystem
              </a>
              <a className="text-action" href="#stack">
                Open live stack <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="hero-principles" aria-label="Design principles">
              <span>real state over fake motion</span>
              <span>quiet when idle</span>
              <span>reactive when alive</span>
            </div>
          </div>

          <EntityConsole />
        </section>

        <section className="surface-section" id="projects">
          <div className="section-heading">
            <p className="eyebrow">PUBLIC SURFACES</p>
            <h2>Not a portfolio dashboard. A readable system.</h2>
          </div>

          <div className="surface-grid">
            {surfaces.map((surface) => (
              <article className="surface-card" key={surface.title}>
                <span>{surface.kicker}</span>
                <h3>{surface.title}</h3>
                <p>{surface.copy}</p>
                <div className="surface-signal" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="manifesto" id="stack">
          <p className="eyebrow">ENTITY RULE 01</p>
          <blockquote>
            The website does not simulate the ecosystem. It becomes the public surface of the
            ecosystem when trusted signals arrive.
          </blockquote>
          <div className="manifesto-meta">
            <span>MB → semantic state</span>
            <span>Sentinel → observation</span>
            <span>Music Sensor → expression</span>
            <span>Projects → activity</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>THAIDUY.DIGITAL</span>
        <span>GREENFIELD / 2026</span>
      </footer>
    </div>
  )
}
