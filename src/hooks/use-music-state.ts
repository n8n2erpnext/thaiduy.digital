'use client'

import { useSyncExternalStore } from 'react'
import {
  restingMusicState,
  type MusicCortexState,
  type MusicDspPublicFrame,
  type MusicLayerName,
} from '@/lib/music-state'

let baseSnapshot: MusicCortexState = restingMusicState
let snapshot: MusicCortexState = restingMusicState
let pollTimer: ReturnType<typeof setTimeout> | null = null
let staleTimer: ReturnType<typeof setTimeout> | null = null
let stream: EventSource | null = null
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

const signalLayers = ['bass','lowMid','mid','presence','air'] as const

function emit(next: MusicCortexState) {
  snapshot = next
  for (const listener of listeners) listener()
}

function applyDsp(frame: MusicDspPublicFrame) {
  if (baseSnapshot.mode !== 'listening' || !baseSnapshot.connected) return
  const layers = { ...baseSnapshot.layers }
  for (const name of signalLayers) {
    const live = Math.max(0, Math.min(1, frame[name]))
    const weight = Math.max(0, Math.min(1, baseSnapshot.layers[name].weight * 0.22 + live * 0.78))
    layers[name] = { weight, gain:Math.max(0, Math.min(1, 0.35 + weight * 0.8)) }
  }
  if (typeof frame.vocalProbability === 'number') {
    const live = Math.max(0, Math.min(1, frame.vocalProbability))
    const weight = Math.max(0, Math.min(1, baseSnapshot.layers.vocal.weight * 0.22 + live * 0.78))
    layers.vocal = { weight, gain:Math.max(0, Math.min(1, 0.35 + weight * 0.8)) }
  }

  const candidates: Array<[MusicLayerName, number]> = signalLayers.map(name => [name, layers[name].weight])
  if (typeof frame.vocalProbability === 'number') candidates.push(['vocal', layers.vocal.weight])
  const dominantLayer = candidates.sort((a,b) => b[1] - a[1])[0]?.[0] ?? baseSnapshot.dominantLayer
  emit({ ...baseSnapshot, signal:'dsp', energy:frame.rms, dominantLayer, layers, updatedAt:frame.at })

  if (staleTimer) clearTimeout(staleTimer)
  staleTimer = setTimeout(() => emit(baseSnapshot), 2_500)
}

function startStream() {
  if (stream) return
  stream = new EventSource('/api/music/stream')
  stream.addEventListener('signal', (event) => {
    try { applyDsp(JSON.parse((event as MessageEvent<string>).data) as MusicDspPublicFrame) } catch {}
  })
  stream.onerror = () => {
    if (staleTimer) clearTimeout(staleTimer)
    staleTimer = setTimeout(() => emit(baseSnapshot), 500)
  }
}

async function poll() {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const response = await fetch('/api/music/state', { cache:'no-store' })
      if (response.ok) {
        baseSnapshot = await response.json() as MusicCortexState
        if (snapshot.signal !== 'dsp') emit(baseSnapshot)
      }
    } catch {
      baseSnapshot = restingMusicState
      if (snapshot.signal !== 'dsp') emit(restingMusicState)
    } finally {
      inflight = null
      if (listeners.size) pollTimer = setTimeout(poll, document.hidden ? 45_000 : 12_000)
    }
  })()
  return inflight
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    startStream()
    void poll()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size) return
    if (pollTimer) clearTimeout(pollTimer)
    if (staleTimer) clearTimeout(staleTimer)
    pollTimer = null
    staleTimer = null
    stream?.close()
    stream = null
  }
}

export function useMusicState() {
  return useSyncExternalStore(subscribe, () => snapshot, () => restingMusicState)
}
