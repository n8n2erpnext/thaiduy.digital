import Link from 'next/link'
import { ActivityRail } from '@/components/living/activity-rail'
import { EntityConsole } from '@/components/living/entity-console'
import { LivingCanvas } from '@/components/living/living-canvas'
import { MusicOrgan } from '@/components/living/music-organ'
import { SiteHeader } from '@/components/site/header'
import { getRegistry, getRegistryAll } from '@/content/repository'
import { resolveManagedSection } from '@/content/presentation'
import { metaList, metaText, textFor } from '@/content/types'
import { resolveLocale } from '@/i18n/locale'
import { messages } from '@/i18n/messages'
import { getFeatureState } from '@/lib/feature-flags'

export default async function Home() {
  const locale = await resolveLocale()
  const t = messages[locale].home

  const [
    hero,
    organs,
    surfacesSection,
    manifesto,
    footer,
    managedSurfaces,
    allSurfaceRows,
    featureState,
  ] = await Promise.all([
    resolveManagedSection('home.hero', locale, {
      eyebrow: t.eyebrow,
      title: t.title,
      copy: t.lede,
    }),
    resolveManagedSection('home.organs', locale, {
      eyebrow: t.organsEyebrow,
      title: t.organsTitle,
      copy: '',
    }),
    resolveManagedSection('home.surfaces', locale, {
      eyebrow: t.surfacesEyebrow,
      title: t.surfacesTitle,
      copy: '',
    }),
    resolveManagedSection('home.manifesto', locale, {
      eyebrow: 'MANIFESTO',
      title: '',
      copy: t.manifesto,
    }),
    resolveManagedSection('home.footer', locale, {
      eyebrow: t.footerLeft,
      title: '',
      copy: '',
    }),
    getRegistry('home-surface'),
    getRegistryAll('home-surface'),
    getFeatureState(
      ['public.topology', 'public.runtime_state', 'music.sensor'],
      true,
    ),
  ])

  const topologyEnabled = featureState['public.topology']
  const runtimeEnabled = featureState['public.runtime_state']
  const musicEnabled = featureState['music.sensor']

  const heroMeta = hero.item?.meta
  const enter = metaText(heroMeta, 'enter', locale, t.enter)
  const explore = metaText(heroMeta, 'explore', locale, t.explore)
  const principlesLabel = metaText(
    heroMeta,
    'principlesLabel',
    locale,
    t.principlesLabel,
  )
  const principles = metaList(heroMeta, 'principles', locale, t.principles)
  const fieldTop = metaText(heroMeta, 'fieldTop', locale, t.fieldTop)
  const fieldTruth = metaText(heroMeta, 'fieldTruth', locale, t.fieldTruth)
  const fieldFooter = metaList(heroMeta, 'fieldFooter', locale, t.fieldFooter)

  const manifestoLines = metaList(
    manifesto.item?.meta,
    'lines',
    locale,
    t.manifestoMeta,
  )
  const footerRight = metaText(
    footer.item?.meta,
    'right',
    locale,
    t.footerRight,
  )

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} />
      <main>
        {hero.visible && (
          <section
            className={`hero hero-v2${topologyEnabled ? '' : ' is-topology-off'}`}
            data-managed={hero.managed || undefined}
          >
            <div className="hero-copy">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h1>{hero.title}</h1>
              <p className="hero-lede">{hero.copy}</p>
              <div className="hero-actions">
                {topologyEnabled && (
                  <a className="primary-action" href="#living-field">
                    {enter} <span aria-hidden="true">↘</span>
                  </a>
                )}
                <a className="text-action" href="#projects">
                  {explore} <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className="hero-principles" aria-label={principlesLabel}>
                {principles.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>

            {topologyEnabled && (
              <div className="living-field" id="living-field">
                <div className="field-topbar">
                  <span>{fieldTop}</span>
                  <span className="field-truth">{fieldTruth}</span>
                </div>
                <LivingCanvas locale={locale} />
                <div className="field-footer">
                  {fieldFooter.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            )}
          </section>
        )}

        {runtimeEnabled && <ActivityRail locale={locale} />}

        {organs.visible && (runtimeEnabled || musicEnabled) && (
          <section className="organ-section" data-managed={organs.managed || undefined}>
            <div className="section-heading">
              <p className="eyebrow">{organs.eyebrow}</p>
              <h2>{organs.title}</h2>
            </div>
            <div className="organ-grid">
              {runtimeEnabled && <EntityConsole locale={locale} />}
              {musicEnabled && <MusicOrgan locale={locale} />}
            </div>
          </section>
        )}

        {surfacesSection.visible && (
          <section
            className="surface-section"
            id="projects"
            data-managed={surfacesSection.managed || undefined}
          >
            <div className="section-heading">
              <p className="eyebrow">{surfacesSection.eyebrow}</p>
              <h2>{surfacesSection.title}</h2>
            </div>
            <div className="surface-grid">
              {allSurfaceRows.length === 0
                ? t.surfaces.map((surface, index) => {
                    const href = ['/projects', '/log', '/stack'][index]
                    return (
                      <Link className="surface-card" href={href} key={surface.kicker}>
                        <span>{surface.kicker}</span>
                        <h3>{surface.title}</h3>
                        <p>{surface.copy}</p>
                        <div className="surface-signal" aria-hidden="true"><i /><i /><i /></div>
                        <em className="surface-enter" aria-hidden="true">↗</em>
                      </Link>
                    )
                  })
                : managedSurfaces.map((surface) => {
                    const href = metaText(surface.meta, 'href', locale, '/')
                    return (
                      <Link
                        className="surface-card"
                        href={href}
                        key={surface.id}
                        data-registry-key={surface.key}
                      >
                        <span>{textFor(surface.label, locale)}</span>
                        <h3>{textFor(surface.title, locale)}</h3>
                        <p>{textFor(surface.summary, locale)}</p>
                        <div className="surface-signal" aria-hidden="true"><i /><i /><i /></div>
                        <em className="surface-enter" aria-hidden="true">↗</em>
                      </Link>
                    )
                  })}
            </div>
          </section>
        )}

        {manifesto.visible && (
          <section className="manifesto" data-managed={manifesto.managed || undefined}>
            <blockquote>{manifesto.copy}</blockquote>
            <div className="manifesto-meta">
              {manifestoLines.map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>
        )}
      </main>

      {footer.visible && (
        <footer className="site-footer" data-managed={footer.managed || undefined}>
          <span>{footer.eyebrow}</span>
          <span>{footerRight}</span>
        </footer>
      )}
    </div>
  )
}
