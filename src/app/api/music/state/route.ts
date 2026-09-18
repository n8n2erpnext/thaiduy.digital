import { NextResponse } from 'next/server'
import { runMusicSensorLearningCycle } from '@/brains/music-sensor/service'
import { getLatestMusicDspFrame } from '@/brains/music-sensor/live-signal'
import type { MusicTagSource } from '@/brains/music-sensor/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type LastfmTrack = {
  '@attr'?: { nowplaying?: string }
  artist?: { '#text'?: string; mbid?: string }
  name?: string
  mbid?: string
  url?: string
}

type LastfmRecent = { recenttracks?: { track?: LastfmTrack[] } }
type LastfmTopTags = { toptags?: { tag?: Array<{ name?: string; count?: number | string }> } }

type PublicMusicState = {
  mode: 'resting' | 'listening' | 'humming'
  connected: boolean
  signal: 'offline' | 'semantic' | 'dsp'
  track: null | { artist: string; title: string; url: string }
  genre: string | null
  style: string | null
  arrangement: string | null
  texture: string
  mood: string
  reinterpretation: boolean
  dominantLayer: 'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air'
  energy: number
  confidence: number
  layers: Record<'bass' | 'lowMid' | 'mid' | 'vocal' | 'presence' | 'air', { weight: number; gain: number }>
  updatedAt: string
}

const emptyLayers = {
  bass:{ weight:0.2, gain:0 }, lowMid:{ weight:0.35, gain:0 }, mid:{ weight:0.45, gain:0 },
  vocal:{ weight:0.1, gain:0 }, presence:{ weight:0.2, gain:0 }, air:{ weight:0.15, gain:0 },
}

function resting(connected: boolean): PublicMusicState {
  return {
    mode:'resting', connected, signal:connected ? 'semantic' : 'offline', track:null,
    genre:null, style:null, arrangement:null, texture:'unknown', mood:'calm', reinterpretation:false,
    dominantLayer:'mid', energy:0, confidence:0, layers:emptyLayers, updatedAt:new Date().toISOString(),
  }
}

function lastfmUrl(method: string) {
  const endpoint = process.env.LASTFM_ENDPOINT ?? 'https://ws.audioscrobbler.com/2.0/'
  const url = new URL(endpoint)
  url.searchParams.set('method', method)
  url.searchParams.set('api_key', process.env.LASTFM_API_KEY ?? '')
  url.searchParams.set('format', 'json')
  return url
}

async function getJson<T>(url: URL): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(url, { cache:'no-store', signal:controller.signal })
    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function tagsFrom(payload: LastfmTopTags | null, source: MusicTagSource) {
  return (payload?.toptags?.tag ?? []).slice(0, 16).flatMap(tag => {
    const name = tag.name?.trim()
    const count = Number(tag.count ?? 0)
    if (!name || !Number.isFinite(count) || count <= 0) return []
    return [{ name, weight:Math.min(100, count), source }]
  })
}

function fallbackTags(title: string) {
  const tags: Array<{ name:string; weight:number; source:MusicTagSource }> = []
  const classicalForm = /\b(concerto|sonata|symphony|prelude|fugue|requiem|overture|serenade|etude|nocturne|adagio|allegro|andante)\b/i
  const catalogNumber = /\b(rv|bwv|kv?|op)\.?\s*\d+/i
  if (classicalForm.test(title) || catalogNumber.test(title)) tags.push({ name:'classical', weight:0.86, source:'heuristic' })
  if (/\bconcerto\b/i.test(title)) tags.push({ name:'concerto', weight:0.82, source:'heuristic' })
  if (/\bsonata\b/i.test(title)) tags.push({ name:'sonata', weight:0.82, source:'heuristic' })
  return tags
}

async function loadTags(artist: string, title: string) {
  const trackUrl = lastfmUrl('track.getTopTags')
  trackUrl.searchParams.set('artist', artist)
  trackUrl.searchParams.set('track', title)
  const artistUrl = lastfmUrl('artist.getTopTags')
  artistUrl.searchParams.set('artist', artist)
  const [track, artistTags] = await Promise.all([
    getJson<LastfmTopTags>(trackUrl), getJson<LastfmTopTags>(artistUrl),
  ])
  const tags = [...tagsFrom(track, 'lastfm-track'), ...tagsFrom(artistTags, 'lastfm-artist')]
  return tags.length ? tags : fallbackTags(title)
}

export async function GET() {
  const apiKey = process.env.LASTFM_API_KEY
  const username = process.env.LASTFM_USERNAME
  if (!apiKey || !username) return noStore(resting(false))

  const recentUrl = lastfmUrl('user.getrecenttracks')
  recentUrl.searchParams.set('user', username)
  recentUrl.searchParams.set('limit', '2')
  const [recent, live] = await Promise.all([
    getJson<LastfmRecent>(recentUrl),
    getLatestMusicDspFrame(5_000),
  ])
  if (!recent) return noStore(resting(false))

  const current = (recent.recenttracks?.track ?? []).find(track => track['@attr']?.nowplaying === 'true')
  if (!current?.name) return noStore(resting(true))

  const artist = current.artist?.['#text']?.trim() || 'Unknown Artist'
  const title = current.name.trim()
  const tags = await loadTags(artist, title)
  const cycle = await runMusicSensorLearningCycle({
    artist, title, tags,
    playback:{ active:true, source:live ? 'local' : 'lastfm' },
    identity:{ recordingMbid:current.mbid || undefined },
    audio:live ? {
      rms:live.rms, peak:live.peak,
      bass:live.bass, lowMid:live.lowMid, mid:live.mid,
      presence:live.presence, air:live.air,
      spectralFlux:live.spectralFlux,
      spectralCentroid:live.spectralCentroid,
      vocalProbability:live.vocalProbability,
    } : undefined,
  })
  if (!cycle.enabled) return noStore(resting(true))

  const state = cycle.decision.state
  const style = state.performedStyle ?? state.catalogStyle ?? state.catalogGenre
  return noStore({
    mode:state.mode, connected:true, signal:live ? 'dsp' : 'semantic',
    track:{ artist, title, url:current.url ?? '' },
    genre:state.catalogGenre, style, arrangement:state.arrangement, texture:state.texture,
    mood:state.mood, reinterpretation:state.reinterpretation, dominantLayer:state.dominantLayer,
    energy:live?.rms ?? 0, confidence:cycle.decision.confidence, layers:state.layers,
    updatedAt:live?.at ?? new Date().toISOString(),
  })
}

function noStore(payload: PublicMusicState) {
  return NextResponse.json(payload, { headers:{
    'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma:'no-cache', Expires:'0',
  } })
}