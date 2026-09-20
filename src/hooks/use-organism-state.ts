"use client"

import { useEffect, useSyncExternalStore } from 'react'
import type { PublicOrganismState } from '@/lib/organism'

let snapshot: PublicOrganismState = {
  mode:'calm',
  updatedAt:new Date(0).toISOString(),
  nodes:[],
  links:[],
  events:[],
}
let fallbackTimer: number | null = null
let source: EventSource | null = null
let started = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

async function refresh() {
  try {
    const response = await fetch('/api/stack/organism', { cache:'no-store' })
    if (!response.ok) return
    snapshot = await response.json() as PublicOrganismState
    emit()
  } catch {}
}

function stopFallback() {
  if (fallbackTimer === null) return
  window.clearInterval(fallbackTimer)
  fallbackTimer = null
}

function startFallback() {
  if (fallbackTimer !== null) return
  void refresh()
  fallbackTimer = window.setInterval(refresh, 12_000)
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true

  if (typeof EventSource === 'undefined') {
    startFallback()
    return
  }

  source = new EventSource('/api/entity/stream')
  source.addEventListener('organism.state', event => {
    try {
      snapshot = JSON.parse((event as MessageEvent<string>).data) as PublicOrganismState
      stopFallback()
      emit()
    } catch {
      startFallback()
    }
  })
  source.addEventListener('error', () => startFallback())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  start()
  return () => {
    listeners.delete(listener)
    if (listeners.size !== 0) return
    source?.close()
    source = null
    stopFallback()
    started = false
  }
}

function getSnapshot() {
  return snapshot
}

export function useOrganismState(initial?: PublicOrganismState) {
  useEffect(() => {
    if (initial && snapshot.nodes.length === 0) {
      snapshot = initial
      emit()
    }
  }, [initial])

  return useSyncExternalStore(subscribe, getSnapshot, () => initial ?? snapshot)
}
