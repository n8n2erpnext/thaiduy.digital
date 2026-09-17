import Link from 'next/link'
import { getControlOverview } from '@/control/queries'

export default async function ControlOverviewPage() {
  const stats = await getControlOverview()
  const cards = [
    ['REGISTRY', stats.registry, '/control/content'],
    ['FEATURE FLAGS', stats.flags, '/control/settings'],
    ['ACTIVE BRAINS', stats.brains, '/control/brains'],
    ['TRAFFIC / 24H', stats.events24h, '/control/traffic'],
    ['ACTIVE / 5M', stats.active5m, '/control/traffic'],
  ] as const
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / OVERVIEW</p><h1>Living surface control plane</h1><span>Durable content, runtime policy, brain state and anonymous traffic telemetry in one operator surface.</span></header>
      <div className="control-stat-grid">
        {cards.map(([label, value, href]) => <Link className="control-stat" href={href} key={label}><span>{label}</span><strong>{value}</strong></Link>)}
      </div>
    </section>
  )
}
