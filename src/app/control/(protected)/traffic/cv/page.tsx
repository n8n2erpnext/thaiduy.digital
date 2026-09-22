import { TrafficRecentPanel } from '@/components/control/traffic-recent-panel'
import { getCvTraffic, getCvTrafficDetail } from '@/control/queries'

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

export default async function CvTrafficPage() {
  const [cv24Raw,cv7dRaw,detail]=await Promise.all([
    getCvTraffic(),
    getCvTraffic(24*7),
    getCvTrafficDetail(24*7,10,1),
  ])

  const cv24=cv24Raw as Row
  const cv7d=cv7dRaw as Row
  const views24=number(cv24,'views')
  const actions24=number(cv24,'prints')+number(cv24,'pdf')+number(cv24,'verify')+number(cv24,'copies')
  const rate24=views24>0?Math.round(actions24/views24*100):0

  const recentInitial={
    total:detail.total,
    page:detail.page,
    pages:detail.pages,
    limit:detail.limit,
    recent:(detail.recent as Row[]).map(row=>({
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
        <p>CONTROL / TRAFFIC / CV</p>
        <h1>CV document signals</h1>
        <span>
          Engagement around the verifiable CV: views, print intent, PDF intent, verification and Document ID copy actions.
        </span>
      </header>

      <section className="traffic-cv-panel">
        <header className="traffic-section-head">
          <div><span>CV / DOCUMENT FUNNEL</span><h2>/cv engagement</h2></div>
          <em>24H PRIMARY · 7D CONTEXT</em>
        </header>
        <div className="traffic-cv-grid">
          <Metric label="CV VIEWS / 24H" value={views24} note={`${number(cv7d,'views').toLocaleString('en-US')} / 7D`}/>
          <Metric label="UNIQUE VIEWERS" value={number(cv24,'visitors')} note={`${number(cv7d,'visitors').toLocaleString('en-US')} / 7D`}/>
          <Metric label="PRINT" value={number(cv24,'prints')} note={`${number(cv7d,'prints').toLocaleString('en-US')} / 7D`}/>
          <Metric label="PDF INTENT" value={number(cv24,'pdf')} note={`${number(cv7d,'pdf').toLocaleString('en-US')} / 7D`}/>
          <Metric label="VERIFY" value={number(cv24,'verify')} note={`${number(cv7d,'verify').toLocaleString('en-US')} / 7D`}/>
          <Metric label="COPY ID" value={number(cv24,'copies')} note={`${number(cv7d,'copies').toLocaleString('en-US')} / 7D`}/>
          <Metric label="ACTION / VIEW" value={rate24} note="PERCENT · 24H"/>
        </div>
        <p className="traffic-cv-note">
          PDF INTENT means the visitor clicked “Save PDF”. Browser and OS print dialogs do not expose whether the final filesystem save completed.
        </p>
      </section>

      <section className="traffic-cv-explain">
        <article>
          <span>VIEW</span>
          <strong>Page reached</strong>
          <p>A deduplicated pageview of <code>/cv</code>.</p>
        </article>
        <article>
          <span>PRINT / PDF</span>
          <strong>Document intent</strong>
          <p>Explicit action from the CV utility rail before the browser print dialog opens.</p>
        </article>
        <article>
          <span>VERIFY / COPY ID</span>
          <strong>Trust action</strong>
          <p>Visitor begins verification or copies the issued Document ID for later use.</p>
        </article>
      </section>

      <TrafficRecentPanel
        scope="cv"
        eyebrow="CV SIGNALS · 7D"
        title="Recent CV activity"
        emptyLabel="NO CV SIGNALS YET"
        initial={recentInitial}
      />
    </section>
  )
}
