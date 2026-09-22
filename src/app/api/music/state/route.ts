import { NextResponse } from 'next/server'
import { runMusicSensorLearningCycle } from '@/brains/music-sensor/service'
import { getLatestMusicDspFrame } from '@/brains/music-sensor/live-signal'
import { getLatestHubPlayback } from '@/brains/music-sensor/playback-signal'
import type { MusicTagSource } from '@/brains/music-sensor/types'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { ensureRedis } from '@/lib/redis'
import { composeHumming, type HummingAfterglow } from '@/brains/music-sensor/composer'
import { HUMMING_GRAMMARS, HUMMING_POLICY } from '@/brains/music-sensor/knowledge'
import { persistHummingSketch } from '@/brains/music-sensor/sketchbook'
import type { HummingComposition } from '@/lib/music-state'

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
  composition: HummingComposition | null
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
    dominantLayer:'mid', energy:0, confidence:0, layers:emptyLayers, composition:null, updatedAt:new Date().toISOString(),
  }
}

const HUMMING_ACTIVITY_KEY = 'music:humming:last-activity'
const HUMMING_CYCLE_KEY = 'music:humming:cycle'
const HUMMING_AFTERGLOW_KEY = 'music:humming:afterglow'

type HummingCycle = {
  startedAt: number
  durationMs: number
  grammarId: string
  composition?: HummingComposition
}

function boundedSpan(seed: number, min: number, max: number) {
  if (max <= min) return min
  return min + Math.abs(seed % (max - min + 1))
}

function hummingLayers(dominant: readonly string[]) {
  const keys = ['bass','lowMid','mid','vocal','presence','air'] as const
  return Object.fromEntries(keys.map((key, index) => {
    const rank = dominant.indexOf(key)
    const weight = rank === 0 ? .72 : rank === 1 ? .56 : .18 + index * .035
    return [key, { weight, gain:Math.max(0, weight - .14) }]
  })) as PublicMusicState['layers']
}

function hummingState(cycle: HummingCycle): PublicMusicState {
  const grammar = HUMMING_GRAMMARS.find(item => item.id === cycle.grammarId) ?? HUMMING_GRAMMARS[0]
  const energy = (grammar.energy[0] + grammar.energy[1]) / 2
  const dominantLayer = grammar.dominant[0] as PublicMusicState['dominantLayer']
  return {
    mode:'humming', connected:true, signal:'semantic', track:null,
    genre:null, style:null, arrangement:null,
    texture:cycle.composition
      ? 'generated-'+(cycle.composition.instrument ?? cycle.composition.voice)
      : 'generated-motion-grammar',
    mood:grammar.mood, reinterpretation:false, dominantLayer, energy, confidence:.78,
    layers:hummingLayers(grammar.dominant), composition:cycle.composition ?? null,
    updatedAt:new Date().toISOString(),
  }
}

async function loadAfterglow(redis: Awaited<ReturnType<typeof ensureRedis>>) {
  const raw=await redis.get(HUMMING_AFTERGLOW_KEY)
  if (!raw) return null
  try {
    const value=JSON.parse(raw) as HummingAfterglow
    if (!Number.isFinite(value.at) || Date.now()-value.at > 24*60*60*1000) return null
    return value
  } catch { return null }
}

async function markRealPlayback() {
  const redis = await ensureRedis()
  await redis.set(HUMMING_ACTIVITY_KEY, String(Date.now()), 'EX', 60 * 60 * 24 * 7)
  await redis.del(HUMMING_CYCLE_KEY)
}

async function rememberAfterglow(value:HummingAfterglow) {
  const redis=await ensureRedis()
  await redis.set(HUMMING_AFTERGLOW_KEY,JSON.stringify(value),'EX',60*60*24*7)
}

function abstractModeFamily(genre:string|null, style:string|null, mood:string) {
  if (genre==='jazz' || style?.includes('jazz')) return 'dorian'
  if (mood.includes('intimate') || mood.includes('melanch')) return 'minor-pentatonic'
  if (mood.includes('warm')) return 'dorian'
  return 'major-pentatonic'
}

async function idleMusicState(connected: boolean) {
  if (!(await isFeatureEnabled('music.idle_humming', false))) return resting(connected)

  const redis = await ensureRedis()
  const now = Date.now()
  const rawCycle = await redis.get(HUMMING_CYCLE_KEY)

  if (rawCycle) {
    try {
      const cycle = JSON.parse(rawCycle) as HummingCycle
      if (now < cycle.startedAt + cycle.durationMs) {
        if (!cycle.composition) {
          const grammar=HUMMING_GRAMMARS.find(item=>item.id===cycle.grammarId) ?? HUMMING_GRAMMARS[0]
          cycle.composition=await composeHumming({
            seed:Math.floor(cycle.startedAt/1000),startedAt:cycle.startedAt,durationMs:cycle.durationMs,
            mood:grammar.mood,tempo:grammar.tempo,swing:grammar.swing,afterglow:await loadAfterglow(redis),
          })
          await redis.set(HUMMING_CYCLE_KEY,JSON.stringify(cycle),'PX',Math.max(1000,cycle.startedAt+cycle.durationMs-now+60_000))
        } else if (!cycle.composition.sketchbookMonth || !cycle.composition.sketchNumber) {
          cycle.composition=await persistHummingSketch(cycle.composition)
          await redis.set(HUMMING_CYCLE_KEY,JSON.stringify(cycle),'PX',Math.max(1000,cycle.startedAt+cycle.durationMs-now+60_000))
        }
        return hummingState(cycle)
      }
      await redis.set(HUMMING_ACTIVITY_KEY,String(cycle.startedAt + cycle.durationMs),'EX',60 * 60 * 24 * 7)
      await redis.del(HUMMING_CYCLE_KEY)
      return resting(connected)
    } catch {
      await redis.del(HUMMING_CYCLE_KEY)
    }
  }

  const rawLast = await redis.get(HUMMING_ACTIVITY_KEY)
  if (!rawLast) {
    await redis.set(HUMMING_ACTIVITY_KEY, String(now), 'EX', 60 * 60 * 24 * 7)
    return resting(connected)
  }

  const lastActivity = Number(rawLast)
  if (!Number.isFinite(lastActivity)) {
    await redis.set(HUMMING_ACTIVITY_KEY, String(now), 'EX', 60 * 60 * 24 * 7)
    return resting(connected)
  }

  const restMs = boundedSpan(
    Math.floor(lastActivity / 1000),
    HUMMING_POLICY.minRestMs,
    HUMMING_POLICY.maxRestMs,
  )
  if (now - lastActivity < restMs) return resting(connected)

  const grammarIndex = Math.abs(Math.floor(now / 60_000)) % HUMMING_GRAMMARS.length
  const grammar = HUMMING_GRAMMARS[grammarIndex]
  const durationMs = boundedSpan(
    Math.floor(now / 1000) + grammarIndex * 97,
    HUMMING_POLICY.minDurationMs,
    HUMMING_POLICY.maxDurationMs,
  )
  const cycle: HummingCycle = {
    startedAt:now,
    durationMs,
    grammarId:grammar.id,
    composition:await composeHumming({
      seed:Math.floor(now/1000)+grammarIndex*997,startedAt:now,durationMs,
      mood:grammar.mood,tempo:grammar.tempo,swing:grammar.swing,afterglow:await loadAfterglow(redis),
    }),
  }
  await redis.set(
    HUMMING_CYCLE_KEY,
    JSON.stringify(cycle),
    'PX',
    durationMs + 60_000,
  )
  return hummingState(cycle)
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
  if (!(await isFeatureEnabled('music.sensor', true))) {
    return noStore(resting(false))
  }

  const [hubPlayback, live] = await Promise.all([
    getLatestHubPlayback(90_000),
    getLatestMusicDspFrame(5_000),
  ])

  const localActive = hubPlayback && (
    hubPlayback.state === 'playing' || hubPlayback.state === 'buffering'
  )

  if (localActive) {
    await markRealPlayback()
    const artist = hubPlayback.artist.trim() || 'Unknown Artist'
    const title = hubPlayback.title.trim()
    const tags = process.env.LASTFM_API_KEY
      ? await loadTags(artist, title)
      : fallbackTags(title)

    const cycle = await runMusicSensorLearningCycle({
      artist,
      title,
      tags,
      playback:{ active:true, source:'local' },
      positionMs:hubPlayback.positionMs,
      identity:{ durationMs:hubPlayback.durationMs },
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
    await rememberAfterglow({
      at:Date.now(), mood:state.mood, genre:state.catalogGenre, style, texture:state.texture,
      dominantLayer:state.dominantLayer, energy:live?.rms ?? .18,
      swingness:style==='swing' || state.catalogGenre==='jazz' ? .34 : .08,
      meter:style==='waltz' ? '3/4' : '4/4', modeFamily:abstractModeFamily(state.catalogGenre,style,state.mood),
    })
    return noStore({
      mode:state.mode,
      connected:true,
      signal:live ? 'dsp' : 'semantic',
      track:{ artist, title, url:'' },
      genre:state.catalogGenre,
      style,
      arrangement:state.arrangement,
      texture:state.texture,
      mood:state.mood,
      reinterpretation:state.reinterpretation,
      dominantLayer:state.dominantLayer,
      energy:live?.rms ?? 0,
      confidence:cycle.decision.confidence,
      layers:state.layers,
      composition:null,
      updatedAt:live?.at ?? hubPlayback.at,
    })
  }

  if (hubPlayback) {
    return noStore(await idleMusicState(true))
  }

  const apiKey = process.env.LASTFM_API_KEY
  const username = process.env.LASTFM_USERNAME
  if (!apiKey || !username) return noStore(await idleMusicState(Boolean(hubPlayback)))

  const recentUrl = lastfmUrl('user.getrecenttracks')
  recentUrl.searchParams.set('user', username)
  recentUrl.searchParams.set('limit', '2')
  const recent = await getJson<LastfmRecent>(recentUrl)
  if (!recent) return noStore(await idleMusicState(Boolean(hubPlayback)))

  const current = (recent.recenttracks?.track ?? []).find(track => track['@attr']?.nowplaying === 'true')
  if (!current?.name) return noStore(await idleMusicState(true))

  await markRealPlayback()
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
  await rememberAfterglow({
    at:Date.now(), mood:state.mood, genre:state.catalogGenre, style, texture:state.texture,
    dominantLayer:state.dominantLayer, energy:live?.rms ?? .18,
    swingness:style==='swing' || state.catalogGenre==='jazz' ? .34 : .08,
    meter:style==='waltz' ? '3/4' : '4/4', modeFamily:abstractModeFamily(state.catalogGenre,style,state.mood),
  })
  return noStore({
    mode:state.mode, connected:true, signal:live ? 'dsp' : 'semantic',
    track:{ artist, title, url:current.url ?? '' },
    genre:state.catalogGenre, style, arrangement:state.arrangement, texture:state.texture,
    mood:state.mood, reinterpretation:state.reinterpretation, dominantLayer:state.dominantLayer,
    energy:live?.rms ?? 0, confidence:cycle.decision.confidence, layers:state.layers,
    composition:null,
    updatedAt:live?.at ?? new Date().toISOString(),
  })
}

function noStore(payload: PublicMusicState) {
  return NextResponse.json(payload, { headers:{
    'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma:'no-cache', Expires:'0',
  } })
}