'use client'

import { useSyncExternalStore } from 'react'
import { restingMusicState, type MusicCortexState } from '@/lib/music-state'

let snapshot: MusicCortexState = restingMusicState
let timer: ReturnType<typeof setTimeout> | null = null
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit(next: MusicCortexState) {
  snapshot = next
  for (const listener of listeners) listener()
}

async function poll() {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const response = await fetch('/api/music/state', { cache:'no-store' })
      if (response.ok) emit(await response.json() as MusicCortexState)
    } catch {
      emit(restingMusicState)
    } finally {
      inflight = null
      if (listeners.size) timer = setTimeout(poll, document.hidden ? 45_000 : 12_000)
    }
  })()
  return inflight
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) void poll()
  return () => {
    listeners.delete(listener)
    if (!listeners.size && timer) { clearTimeout(timer); timer = null }
  }
}

export function useMusicState() {
  return useSyncExternalStore(subscribe, () => snapshot, () => restingMusicState)
}
