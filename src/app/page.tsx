import Link from 'next/link'
import { ActivityRail } from '@/components/living/activity-rail'
import { EntityConsole } from '@/components/living/entity-console'
import { LivingCanvas } from '@/components/living/living-canvas'
import { MusicOrgan } from '@/components/living/music-organ'
import { SiteHeader } from '@/components/site/header'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'

export default async function Home() {
  const locale = await resolveLocale()
  const t = messages[locale].home

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main>
        <section className="hero hero-v2">
          <div className="hero-copy">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className="hero-lede">{t.lede}</p>
            <div className="hero-actions">
              <a className="primary-action" href="#living-field">{t.enter} <span aria-hidden="true">↘</span></a>
              <a className="text-action" href="#projects">{t.explore} <span aria-hidden="true">→</span></a>
            </div>
            <div className="hero-principles" aria-label={t.principlesLabel}>
              {t.principles.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>

          <div className="living-field" id="living-field">
            <div className="field-topbar"><span>{t.fieldTop}</span><span className="field-truth">{t.fieldTruth}</span></div>
            <LivingCanvas locale={locale} />
            <div className="field-footer">{t.fieldFooter.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        </section>

        <ActivityRail locale={locale} />

        <section className="organ-section">
          <div className="section-heading"><p className="eyebrow">{t.organsEyebrow}</p><h2>{t.organsTitle}</h2></div>
          <div className="organ-grid"><EntityConsole locale={locale} /><MusicOrgan locale={locale} /></div>
        </section>

        <section className="surface-section" id="projects">
          <div className="section-heading"><p className="eyebrow">{t.surfacesEyebrow}</p><h2>{t.surfacesTitle}</h2></div>
          <div className="surface-grid">
            {t.surfaces.map((surface, index) => {
              const href = ['/projects', '/log', '/stack'][index]
              return (
                <Link className="surface-card" href={href} key={surface.kicker}>
                  <span>{surface.kicker}</span><h3>{surface.title}</h3><p>{surface.copy}</p>
                  <div className="surface-signal" aria-hidden="true"><i /><i /><i /></div>
                  <em className="surface-enter" aria-hidden="true">↗</em>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="manifesto">
          <blockquote>{t.manifesto}</blockquote>
          <div className="manifesto-meta">{t.manifestoMeta.map((item) => <span key={item}>{item}</span>)}</div>
        </section>
      </main>
      <footer className="site-footer"><span>{t.footerLeft}</span><span>{t.footerRight}</span></footer>
    </div>
  )
}
