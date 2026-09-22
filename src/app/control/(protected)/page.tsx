import Link from 'next/link'
import { getControlOverview, getTrafficDailySeries } from '@/control/queries'

type Row=Record<string,unknown>

export default async function ControlOverviewPage() {
  const [stats,seriesRaw]=await Promise.all([
    getControlOverview(),
    getTrafficDailySeries(7),
  ])

  const series=seriesRaw as Row[]
  const maxValue=Math.max(
    1,
    ...series.flatMap(row=>[Number(row.views ?? 0),Number(row.events ?? 0)]),
  )

  const cards = [
    ['REGISTRY',stats.registry,'/control/content'],
    ['TRAFFIC / 24H',stats.events24h,'/control/traffic'],
    ['ACTIVE / 5M',stats.active5m,'/control/traffic'],
    ['CV ISSUED / 24H',stats.cvIssued24h,'/control/traffic/cv'],
    ['PUBLISHED WRITING',stats.publishedPosts,'/control/content/writing'],
  ] as const

  const systemCards=[
    ['READY MEDIA',stats.readyAssets,'Assets available to public/editorial surfaces','/control/assets'],
    ['RUNTIME BINDINGS',stats.runtimeBindings,'Enabled live-state bindings','/control/runtime'],
    ['FEATURE FLAGS',stats.flags,'Site capability switches','/control/settings'],
    ['ACTIVE BRAINS',stats.brains,'Enabled cognition profiles','/control/brains'],
  ] as const

  return (
    <section className="control-page control-overview-page">
      <header className="control-page-head">
        <p>CONTROL / OVERVIEW</p>
        <h1>Living surface control plane</h1>
        <span>Durable content, runtime policy, document state and anonymous traffic telemetry in one operator surface.</span>
      </header>

      <div className="control-stat-grid control-overview-primary">
        {cards.map(([label,value,href])=>(
          <Link className="control-stat" href={href} key={label}>
            <span>{label}</span>
            <strong>{value.toLocaleString('en-US')}</strong>
          </Link>
        ))}
      </div>

      <section className="control-overview-chart">
        <header>
          <div>
            <span>PUBLIC ACTIVITY / 7D</span>
            <h2>Views and explicit events</h2>
          </div>
          <div className="control-chart-legend">
            <span><i data-series="views"/>PAGEVIEWS</span>
            <span><i data-series="events"/>EVENTS</span>
          </div>
        </header>

        <div className="control-bar-chart">
          {series.map(row=>{
            const views=Number(row.views ?? 0)
            const events=Number(row.events ?? 0)
            const visitors=Number(row.visitors ?? 0)
            return (
              <div className="control-bar-day" key={String(row.label)}>
                <div className="control-bar-stage">
                  <i
                    data-series="views"
                    style={{height:`${Math.max(2,views/maxValue*100)}%`}}
                    title={`${views} pageviews`}
                  />
                  <i
                    data-series="events"
                    style={{height:`${Math.max(2,events/maxValue*100)}%`}}
                    title={`${events} events`}
                  />
                </div>
                <strong>{views.toLocaleString('en-US')}</strong>
                <small>{events.toLocaleString('en-US')} EVT · {visitors.toLocaleString('en-US')} VIS</small>
                <span>{String(row.label)}</span>
              </div>
            )
          })}
        </div>
        <footer>
          <span>LOCAL DAY · ASIA/HO_CHI_MINH</span>
          <Link href="/control/traffic">OPEN TRAFFIC →</Link>
        </footer>
      </section>

      <section className="control-overview-systems">
        <header>
          <span>OPERATING STATE</span>
          <em>CURRENT CONTROL INVENTORY</em>
        </header>
        <div>
          {systemCards.map(([label,value,note,href])=>(
            <Link href={href} key={label}>
              <span>{label}</span>
              <strong>{value.toLocaleString('en-US')}</strong>
              <small>{note}</small>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}
