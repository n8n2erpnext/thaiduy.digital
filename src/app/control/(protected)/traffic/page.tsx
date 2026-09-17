import { getRealtimeVisitors, getTrafficDimensions, getTrafficOverview } from '@/control/queries'

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="control-stat"><span>{label}</span><strong>{value.toLocaleString('en-US')}</strong></div>
}

function Ranking({ title, rows, keyName }: { title: string; rows: Record<string, unknown>[]; keyName: string }) {
  return (
    <section className="control-ranking">
      <h2>{title}</h2>
      <div>{rows.length === 0 && <p>NO DATA YET</p>}{rows.map((row, index) => (
        <article key={`${String(row[keyName])}-${index}`}><span>{String(row[keyName] ?? 'unknown')}</span><strong>{Number(row.total ?? 0).toLocaleString('en-US')}</strong></article>
      ))}</div>
    </section>
  )
}

export default async function TrafficPage() {
  const [overview, dimensions, active] = await Promise.all([getTrafficOverview(), getTrafficDimensions(), getRealtimeVisitors()])
  const totals = overview.totals as Record<string, unknown>
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / TRAFFIC</p><h1>Anonymous traffic pulse</h1><span>Umami-inspired session / visit / event telemetry, without storing raw IP addresses.</span></header>
      <div className="control-stat-grid traffic-stats">
        <Metric label="ACTIVE / 5M" value={active}/><Metric label="VISITORS / 24H" value={Number(totals.visitors ?? 0)}/><Metric label="VISITS / 24H" value={Number(totals.visits ?? 0)}/><Metric label="VIEWS / 24H" value={Number(totals.views ?? 0)}/><Metric label="EVENTS / 24H" value={Number(totals.events ?? 0)}/>
      </div>
      <div className="control-ranking-grid">
        <Ranking title="TOP PAGES" rows={overview.topPages as Record<string, unknown>[]} keyName="path" />
        <Ranking title="REFERRERS" rows={overview.referrers as Record<string, unknown>[]} keyName="referrer" />
        <Ranking title="COUNTRIES" rows={dimensions.countries as Record<string, unknown>[]} keyName="label" />
        <Ranking title="DEVICES" rows={dimensions.devices as Record<string, unknown>[]} keyName="label" />
        <Ranking title="BROWSERS" rows={dimensions.browsers as Record<string, unknown>[]} keyName="label" />
      </div>
      <p className="control-note">SESSION COOKIE · FIRST-PARTY / VISIT WINDOW · 30 MIN / BOT FILTER · ON / RAW IP STORAGE · OFF</p>
    </section>
  )
}
