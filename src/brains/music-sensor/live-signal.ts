import { ensureRedis } from '@/lib/redis'

export const MUSIC_SIGNAL_KEY = 'music:sensor:latest'
export const MUSIC_SIGNAL_CHANNEL = 'music:sensor:frames'
export const MUSIC_SIGNAL_ACTIVE_KEY = 'music:sensor:latest-active'
export const MUSIC_SIGNAL_TTL_SECONDS = 15

export type MusicDspFrame = {
  deviceId: string
  seq: number
  at: string
  sampleRate: number
  windowMs: number
  rms: number
  peak: number
  bass: number
  lowMid: number
  mid: number
  presence: number
  air: number
  spectralFlux: number
  spectralCentroid?: number
  spectralFlatness?: number
  zeroCrossingRate?: number
  tempoBpm?: number
  beatConfidence?: number
  meter?: '2/4'|'3/4'|'4/4'|'6/8'|'unknown'
  swingness?: number
  percussiveProbability?: number
  harmonicProbability?: number
  dynamicRange?: number
  vocalProbability?: number
}

const clamp01 = (value:number) => Math.max(0,Math.min(1,value))

export function estimateVocalProbability(
  frame:Pick<MusicDspFrame,'rms'|'bass'|'lowMid'|'mid'|'presence'|'air'|'spectralCentroid'>,
) {
  if (frame.rms < .03) return 0

  const vocalCore=frame.lowMid*.34 + frame.mid*.42 + frame.presence*.24
  const support=frame.bass*.55 + frame.air*.45
  const balance=clamp01(.55 + (vocalCore-support)*.35)

  const centroid=frame.spectralCentroid ?? 0
  const centroidFit=centroid<=700
    ? .15
    : centroid<2200
      ? .15 + ((centroid-700)/1500)*.85
      : centroid<=4200
        ? 1
        : centroid<8000
          ? 1 - ((centroid-4200)/3800)*.75
          : .25

  return clamp01(.06 + vocalCore*.62 + centroidFit*.18 + balance*.14)
}

export function normalizeMusicDspFrame(frame:MusicDspFrame):MusicDspFrame {
  if (typeof frame.vocalProbability==='number') return frame
  return { ...frame, vocalProbability:estimateVocalProbability(frame) }
}

function hasAudibleSignal(frame:Pick<MusicDspFrame,'rms'|'peak'>) {
  return frame.rms >= .025 || frame.peak >= .05
}

export async function publishMusicDspFrame(frame: MusicDspFrame) {
  const client = await ensureRedis()
  const normalized=normalizeMusicDspFrame(frame)
  const payload = JSON.stringify(normalized)
  const multi = client.multi()
  multi.set(MUSIC_SIGNAL_KEY, payload, 'EX', MUSIC_SIGNAL_TTL_SECONDS)
  if (hasAudibleSignal(normalized)) {
    multi.set(MUSIC_SIGNAL_ACTIVE_KEY, payload, 'EX', MUSIC_SIGNAL_TTL_SECONDS)
  }
  multi.publish(MUSIC_SIGNAL_CHANNEL, payload)
  await multi.exec()
}

export async function getLatestMusicDspFrame(maxAgeMs = 2_500) {
  const client = await ensureRedis()
  const payload = await client.get(MUSIC_SIGNAL_KEY)
  if (!payload) return null
  try {
    const frame = JSON.parse(payload) as MusicDspFrame
    const age = Date.now() - Date.parse(frame.at)
    if (!Number.isFinite(age) || age < -5_000 || age > maxAgeMs) return null
    return frame
  } catch {
    return null
  }
}

export type MusicDspAuthority = {
  mode:'hot'|'grace'|'lost'
  frame:MusicDspFrame|null
  ageMs:number|null
}

function parseFrame(payload:string|null,maxAgeMs:number) {
  if (!payload) return null
  try {
    const frame=JSON.parse(payload) as MusicDspFrame
    const ageMs=Date.now()-Date.parse(frame.at)
    if (!Number.isFinite(ageMs) || ageMs < -5_000 || ageMs > maxAgeMs) return null
    return { frame, ageMs:Math.max(0,ageMs) }
  } catch {
    return null
  }
}

export async function getMusicDspAuthority():Promise<MusicDspAuthority> {
  const client=await ensureRedis()
  const [latestRaw,activeRaw]=await client.mget(MUSIC_SIGNAL_KEY,MUSIC_SIGNAL_ACTIVE_KEY)
  const latest=parseFrame(latestRaw,2_500)
  if (latest && hasAudibleSignal(latest.frame)) {
    return { mode:'hot', frame:latest.frame, ageMs:latest.ageMs }
  }

  const active=parseFrame(activeRaw,10_000)
  if (active) {
    return { mode:'grace', frame:active.frame, ageMs:active.ageMs }
  }

  return { mode:'lost', frame:null, ageMs:null }
}
