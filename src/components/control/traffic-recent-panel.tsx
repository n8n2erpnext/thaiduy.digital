'use client'

import { useState } from 'react'

type RecentRow={
  type:string
  name:string
  path:string
  location:string
  device:string
  browser:string
  created_at:string
}

type RecentState={
  recent:RecentRow[]
  total:number
  page:number
  pages:number
  limit:number
}

type Props={
  scope:'overview'|'cv'
  title:string
  eyebrow:string
  emptyLabel:string
  initial:RecentState
}

function formatTime(value:string) {
  const date=new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Ho_Chi_Minh',
    day:'2-digit',
    month:'short',
    hour:'2-digit',
    minute:'2-digit',
    hour12:false,
  }).format(date)
}

export function TrafficRecentPanel({scope,title,eyebrow,emptyLabel,initial}:Props) {
  const [state,setState]=useState(initial)
  const [loading,setLoading]=useState(false)

  async function load(limit:number,page:number) {
    if (loading) return
    setLoading(true)
    try {
      const params=new URLSearchParams({
        scope,
        limit:String(limit),
        page:String(page),
      })
      const response=await fetch(`/api/control/traffic/recent?${params.toString()}`,{
        credentials:'same-origin',
        cache:'no-store',
      })
      if (!response.ok) throw new Error('traffic_recent_failed')
      const data=await response.json() as RecentState
      setState(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="traffic-recent" aria-busy={loading}>
      <header className="traffic-section-head traffic-recent-head">
        <div><span>{eyebrow}</span><h2>{title}</h2></div>
        <div className="traffic-list-controls">
          <span>SHOW</span>
          {[10,20,30].map(limit=>(
            <button
              className={state.limit===limit?'is-active':undefined}
              disabled={loading}
              key={limit}
              type="button"
              onClick={()=>void load(limit,1)}
            >
              {limit}
            </button>
          ))}
        </div>
      </header>

      <div className={`traffic-recent-list ${loading?'is-loading':''}`}>
        {state.recent.length===0 && <p>{emptyLabel}</p>}
        {state.recent.map((row,index)=>(
          <article key={`${row.created_at}-${index}`}>
            <time>{formatTime(row.created_at)}</time>
            <span data-type={row.type}>{row.type.toUpperCase()}</span>
            <strong>{row.name || (scope==='cv'?'cv_view':row.path)}</strong>
            <small>{row.path}</small>
            <em>{row.location} · {row.device} · {row.browser}</em>
          </article>
        ))}
      </div>

      <footer className="traffic-pagination">
        <span>{state.total.toLocaleString('en-US')} RECORDS · PAGE {state.page} / {state.pages}</span>
        <nav>
          <button
            disabled={loading || state.page<=1}
            type="button"
            onClick={()=>void load(state.limit,state.page-1)}
          >
            ← PREVIOUS
          </button>
          <button
            disabled={loading || state.page>=state.pages}
            type="button"
            onClick={()=>void load(state.limit,state.page+1)}
          >
            NEXT →
          </button>
        </nav>
      </footer>
    </section>
  )
}
