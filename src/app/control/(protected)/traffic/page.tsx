import { TrafficRecentPanel } from '@/components/control/traffic-recent-panel'
import {
  getRealtimeVisitors,
  getTrafficDimensions,
  getTrafficEventDetail,
  getTrafficOverview,
} from '@/control/queries'

type Row=Record<string,unknown>

function number(row:Row,key:string) {
  return Number(row[key] ?? 0)
}

function Metric({ label,value,note }:{ label:string; value:number; note?:string }) {
  return (
    <div className="control-stat traffic-metric">
      <span>{label}</span>
      <strong>{value.toLocaleString('en-US')}</strong>
      {note && <small>{note}</small>}
    </div>
  )
}

function Ranking({ title,rows,keyName,secondary }:{
  title:string
  rows:Row[]
  keyName:string
  secondary?:string
}) {
  return (
    <section className="control-ranking traffic-ranking">
      <h2>{title}</h2>
      <div>
        {rows.length===0 && <p>NO DATA YET</p>}
        {rows.map((row,index)=>(
          <article key={`${String(row[keyName])}-${index}`}>
            <span title={String(row[keyName] ?? 'unknown')}>{String(row[keyName] ?? 'unknown')}</span>
            <div>
              <strong>{number(row,'total').toLocaleString('en-US')}</strong>
              {secondary && <small>{number(row,secondary).toLocaleString('en-US')} {secondary.toUpperCase()}</small>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default async function TrafficPage() {
  const [overview,dimensions,active,eventDetail]=await Promise.all([
    getTrafficOverview(),
    getTrafficDimensions(),
    getRealtimeVisitors(),
    getTrafficEventDetail(24,10,1),
  ])

  const totals=overview.totals as Row
  const recentInitial={
    total:eventDetail.total,
    page:eventDetail.page,
    pages:eventDetail.pages,
    limit:eventDetail.limit,
    recent:(eventDetail.recent as Row[]).map(row=>({
      type:String(row.type ?? ''),
      name:String(row.name ?? ''),
      path:String(row.path ?? ''),
      location:String(row.location ?? '—'),
      device:String(row.device ?? '—'),
      browser:String(row.browser ?? '—'),
      created_at:String(row.created_at ?? ''),
    })),
  }

  return (
    <section className="control-page traffic-page">
      <header className="control-page-head">
        <p>CONTROL / TRAFFIC / OVERVIEW</p>
        <h1>Anonymous traffic pulse</h1>
        <span>
          First-party page, visit and event telemetry. Country is used when edge metadata exists; browser timezone is the fallback signal. Raw IP addresses are never stored.
        </span>
      </header>

      <section className="traffic-section">
        <header className="traffic-section-head">
          <div><span>LIVE PULSE</span><h2>Last 24 hours</h2></div>
          <em>ROLLING WINDOW</em>
        </header>
        <div className="control-stat-grid traffic-stats">
          <Metric label="ACTIVE / 5M" value={active}/>
          <Metric label="VISITORS / 24H" value={number(totals,'visitors')}/>
          <Metric label="VISITS / 24H" value={number(totals,'visits')}/>
          <Metric label="PAGEVIEWS / 24H" value={number(totals,'views')}/>
          <Metric label="EVENTS / 24H" value={number(totals,'events')}/>
        </div>
      </section>

      <section className="traffic-detail-grid">
        <Ranking title="TOP PAGES · VIEWS" rows={overview.topPages as Row[]} keyName="path" secondary="visitors"/>
        <Ranking title="CUSTOM EVENTS" rows={eventDetail.topEvents as Row[]} keyName="name" secondary="visitors"/>
        <Ranking title="REFERRERS · VIEWS" rows={overview.referrers as Row[]} keyName="referrer" secondary="visitors"/>
        <Ranking title="COUNTRY / TIMEZONE · VIEWS" rows={dimensions.countries as Row[]} keyName="label"/>
        <Ranking title="DEVICES · VIEWS" rows={dimensions.devices as Row[]} keyName="label"/>
        <Ranking title="BROWSERS · VIEWS" rows={dimensions.browsers as Row[]} keyName="label"/>
        <Ranking title="OPERATING SYSTEMS" rows={dimensions.operatingSystems as Row[]} keyName="label"/>
        <Ranking title="UTM SOURCES" rows={dimensions.utmSources as Row[]} keyName="label"/>
        <Ranking title="CAMPAIGNS" rows={dimensions.campaigns as Row[]} keyName="label"/>
      </section>

      <TrafficRecentPanel
        scope="overview"
        eyebrow="RECENT SIGNALS"
        title="Latest page and event activity"
        emptyLabel="NO TRAFFIC EVENTS YET"
        initial={recentInitial}
      />

      <p className="control-note traffic-privacy-note">
        SESSION COOKIE · FIRST-PARTY / VISIT WINDOW · 30 MIN / BOT FILTER · ON / RAW IP STORAGE · OFF / CONTROL ROUTES · EXCLUDED
      </p>
    </section>
  )
}
