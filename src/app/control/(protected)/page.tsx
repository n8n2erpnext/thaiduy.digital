import Link from 'next/link'
import { getControlOverview, getTrafficCurrentWeekSeries } from '@/control/queries'

type Row=Record<string,unknown>

const CHART={
  width:1000,
  height:310,
  left:58,
  right:22,
  top:24,
  bottom:48,
}

function compact(value:number) {
  return new Intl.NumberFormat('en-US',{
    notation:'compact',
    maximumFractionDigits:value>=1000?1:0,
  }).format(value)
}

export default async function ControlOverviewPage() {
  const [stats,seriesRaw]=await Promise.all([
    getControlOverview(),
    getTrafficCurrentWeekSeries(),
  ])

  const series=(seriesRaw as Row[]).map(row=>({
    label:String(row.label ?? ''),
    weekday:String(row.weekday ?? ''),
    future:Boolean(row.future),
    views:Number(row.views ?? 0),
    events:Number(row.events ?? 0),
    visitors:Number(row.visitors ?? 0),
  }))

  const maxRaw=Math.max(
    1,
    ...series
      .filter(row=>!row.future)
      .flatMap(row=>[row.views,row.events]),
  )
  const magnitude=10**Math.floor(Math.log10(maxRaw))
  const maxValue=Math.ceil(maxRaw/magnitude)*magnitude
  const plotWidth=CHART.width-CHART.left-CHART.right
  const plotHeight=CHART.height-CHART.top-CHART.bottom
  const baseline=CHART.top+plotHeight
  const step=series.length>1?plotWidth/(series.length-1):0
  const x=(index:number)=>CHART.left+index*step
  const y=(value:number)=>CHART.top+(1-value/maxValue)*plotHeight

  function pointsFor(key:'views'|'events') {
    return series
      .map((row,index)=>row.future?null:{x:x(index),y:y(row[key]),value:row[key],row,index})
      .filter((point):point is NonNullable<typeof point>=>point!==null)
  }

  function linePath(key:'views'|'events') {
    const points=pointsFor(key)
    return points.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
  }

  function areaPath(key:'views'|'events') {
    const points=pointsFor(key)
    if(points.length<2) return ''
    const line=points.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
    return `${line} L ${points.at(-1)!.x.toFixed(2)} ${baseline} L ${points[0].x.toFixed(2)} ${baseline} Z`
  }

  const yTicks=[1,.75,.5,.25,0].map(ratio=>({
    value:maxValue*ratio,
    y:CHART.top+(1-ratio)*plotHeight,
  }))
  const weekStart=series[0]?.label ?? '—'
  const weekEnd=series.at(-1)?.label ?? '—'

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
            <span>PUBLIC ACTIVITY / THIS WEEK</span>
            <h2>Views and explicit events</h2>
          </div>
          <div className="control-chart-legend">
            <span><i data-series="views"/>PAGEVIEWS</span>
            <span><i data-series="events"/>EVENTS</span>
          </div>
        </header>

        <div className="control-line-chart-scroll">
          <svg
            className="control-line-chart"
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            role="img"
            aria-label={`Pageviews and events for ${weekStart} through ${weekEnd}`}
          >
            <defs>
              <linearGradient id="controlViewsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4aa7ff" stopOpacity=".28"/>
                <stop offset="100%" stopColor="#4aa7ff" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="controlEventsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#df96b6" stopOpacity=".22"/>
                <stop offset="100%" stopColor="#df96b6" stopOpacity="0"/>
              </linearGradient>
            </defs>

            <g className="control-line-grid">
              {yTicks.map(tick=>(
                <g key={tick.y}>
                  <line x1={CHART.left} y1={tick.y} x2={CHART.width-CHART.right} y2={tick.y}/>
                  <text x={CHART.left-12} y={tick.y+3} textAnchor="end">{compact(tick.value)}</text>
                </g>
              ))}
            </g>

            {areaPath('views') && <path className="control-line-area" data-series="views" d={areaPath('views')}/>}
            {areaPath('events') && <path className="control-line-area" data-series="events" d={areaPath('events')}/>}
            <path className="control-line-series" data-series="views" d={linePath('views')}/>
            <path className="control-line-series" data-series="events" d={linePath('events')}/>

            <g className="control-line-points">
              {series.map((row,index)=>row.future?null:(
                <g key={row.label}>
                  <circle data-series="views" cx={x(index)} cy={y(row.views)} r="3.5">
                    <title>{row.label} · {row.views} pageviews · {row.visitors} visitors</title>
                  </circle>
                  <circle data-series="events" cx={x(index)} cy={y(row.events)} r="3.5">
                    <title>{row.label} · {row.events} events</title>
                  </circle>
                </g>
              ))}
            </g>

            <g className="control-line-x-axis">
              {series.map((row,index)=>(
                <text key={row.label} x={x(index)} y={CHART.height-18} textAnchor="middle" data-future={row.future||undefined}>
                  <tspan x={x(index)}>{row.weekday.toUpperCase()}</tspan>
                  <tspan x={x(index)} dy="11">{row.label}</tspan>
                </text>
              ))}
            </g>

            <g className="control-line-hover-days">
              {series.map((row,index)=>{
                if(row.future) return null
                const px=x(index)
                const tooltipWidth=176
                const tooltipHeight=78
                const hitLeft=Math.max(CHART.left,index===0?CHART.left:px-step/2)
                const hitRight=Math.min(
                  CHART.width-CHART.right,
                  index===series.length-1?CHART.width-CHART.right:px+step/2,
                )
                const topPoint=Math.min(y(row.views),y(row.events))
                const tooltipX=Math.max(
                  CHART.left+4,
                  Math.min(px-tooltipWidth/2,CHART.width-CHART.right-tooltipWidth-4),
                )
                const tooltipY=Math.max(CHART.top+4,topPoint-tooltipHeight-14)

                return (
                  <g className="control-line-hover-day" key={row.label}>
                    <rect
                      className="control-line-hover-hit"
                      x={hitLeft}
                      y={CHART.top}
                      width={Math.max(1,hitRight-hitLeft)}
                      height={plotHeight}
                    />
                    <line
                      className="control-line-hover-guide"
                      x1={px}
                      y1={CHART.top}
                      x2={px}
                      y2={baseline}
                    />
                    <circle
                      className="control-line-hover-ring"
                      data-series="views"
                      cx={px}
                      cy={y(row.views)}
                      r="6.5"
                    />
                    <circle
                      className="control-line-hover-ring"
                      data-series="events"
                      cx={px}
                      cy={y(row.events)}
                      r="6.5"
                    />
                    <g
                      className="control-line-tooltip"
                      transform={`translate(${tooltipX} ${tooltipY})`}
                      pointerEvents="none"
                    >
                      <rect width={tooltipWidth} height={tooltipHeight} rx="8"/>
                      <text className="control-line-tooltip-date" x="12" y="17">
                        {row.weekday.toUpperCase()} · {row.label}
                      </text>

                      <rect className="control-line-tooltip-dot" data-series="views" x="12" y="28" width="6" height="6" rx="2"/>
                      <text className="control-line-tooltip-label" x="25" y="34">PAGEVIEWS</text>
                      <text className="control-line-tooltip-value" x={tooltipWidth-12} y="34" textAnchor="end">
                        {row.views.toLocaleString('en-US')}
                      </text>

                      <rect className="control-line-tooltip-dot" data-series="events" x="12" y="44" width="6" height="6" rx="2"/>
                      <text className="control-line-tooltip-label" x="25" y="50">EVENTS</text>
                      <text className="control-line-tooltip-value" x={tooltipWidth-12} y="50" textAnchor="end">
                        {row.events.toLocaleString('en-US')}
                      </text>

                      <text className="control-line-tooltip-visitors" x="12" y="67">
                        {row.visitors.toLocaleString('en-US')} VISITORS
                      </text>
                    </g>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        <footer>
          <span>CURRENT WEEK · {weekStart.toUpperCase()} — {weekEnd.toUpperCase()} · ASIA/HO_CHI_MINH</span>
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
