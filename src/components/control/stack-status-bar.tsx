'use client'

import { useEffect, useState } from 'react'

type Props = {
  generatedAt: string
  stale: boolean
  pending: boolean
  refreshAction: () => Promise<void>
}

type LiveStatus = {
  generatedAt: string
  signals?: Array<{ key:string; value:string }>
}

export function StackStatusBar({
  generatedAt,
  stale,
  pending,
  refreshAction,
}: Props) {
  const [statusAt, setStatusAt] = useState(generatedAt)
  const [isStale, setIsStale] = useState(stale)
  const [requested, setRequested] = useState(pending)
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const response = await fetch('/api/stack/live', { cache:'no-store' })
        if (response.ok) {
          const graph = await response.json() as LiveStatus
          if (!cancelled) {
            const fresh = !graph.signals?.some(
              signal => signal.key === 'discovery' && signal.value === 'STALE',
            )
            setIsStale(!fresh)
            if (graph.generatedAt !== statusAt) {
              setStatusAt(graph.generatedAt)
              setRequested(false)
            }
          }
        }
      } catch {}
      if (!cancelled) timer = setTimeout(poll, requested ? 4_000 : 20_000)
    }
    timer = setTimeout(poll, requested ? 1_000 : 15_000)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [requested, statusAt])

  return (
    <div className="control-stack-statusbar">
      <div>
        <span>LAST STATUS</span>
        <strong>{statusAt}</strong>
        <em data-stale={isStale}>{isStale ? 'STALE' : 'FRESH'}</em>
      </div>
      <form action={refreshAction} onSubmit={() => setRequested(true)}>
        <button className="control-primary" type="submit" disabled={requested}>
          {requested ? 'STATUS REQUESTED' : 'GET STATUS'}
        </button>
      </form>
    </div>
  )
}
