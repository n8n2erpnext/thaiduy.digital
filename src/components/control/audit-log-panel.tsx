'use client'

import { useState } from 'react'

type AuditRow={
  id:number
  actorId:string | null
  action:string
  entityType:string | null
  entityId:string | null
  createdAt:string
}

type AuditState={
  rows:AuditRow[]
  total:number
  page:number
  pages:number
  limit:number
}

function formatTime(value:string) {
  const date=new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Ho_Chi_Minh',
    day:'2-digit',
    month:'2-digit',
    year:'numeric',
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit',
    hour12:false,
  }).format(date)
}

export function AuditLogPanel({initial}:{initial:AuditState}) {
  const [state,setState]=useState(initial)
  const [loading,setLoading]=useState(false)

  async function load(limit:number,page:number) {
    if (loading) return
    setLoading(true)
    try {
      const params=new URLSearchParams({limit:String(limit),page:String(page)})
      const response=await fetch(`/api/control/audit?${params.toString()}`,{
        credentials:'same-origin',
        cache:'no-store',
      })
      if (!response.ok) throw new Error('audit_fetch_failed')
      const data=await response.json() as AuditState
      setState(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="audit-panel" aria-busy={loading}>
      <header className="audit-panel-head">
        <div>
          <span>AUDIT LOG</span>
          <h2>Durable operator mutations</h2>
        </div>
        <div className="audit-list-controls">
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

      <div className={`control-table-wrap audit-table-wrap ${loading?'is-loading':''}`}>
        <table className="control-table audit-table">
          <thead>
            <tr>
              <th>TIME</th>
              <th>ACTION</th>
              <th>ENTITY</th>
              <th>ID</th>
              <th>ACTOR</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map(row=>(
              <tr key={row.id}>
                <td>{formatTime(row.createdAt)}</td>
                <td>{row.action}</td>
                <td>{row.entityType ?? '—'}</td>
                <td>{row.entityId ?? '—'}</td>
                <td>{row.actorId ?? 'system'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.rows.length===0 && <p className="audit-empty">NO OPERATOR MUTATIONS YET.</p>}
      </div>

      <footer className="audit-pagination">
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
