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
  tempoAutocorrBpm?: number
  tempoOnsetBpm?: number
  tempoReliable?: boolean
  tempoSource?: 'autocorr'|'onset'|'blend'|'unknown'
  tempoAutocorrConfidence?: number
  tempoOnsetConfidence?: number
  processIntervalMs?: number
  beatConfidence?: number
  meter?: '2/4'|'3/4'|'4/4'|'6/8'|'12/8'|'unknown'
  meterCorr2?: number
  meterCorr3?: number
  meterCorr4?: number
  meterAccent2?: number
  meterAccent3?: number
  meterAccent4?: number
  meterConfidence?: number
  meterBeatLag?: number
  subdivisionSimple?: number
  subdivisionTriplet?: number
  swingness?: number
  percussiveProbability?: number
  harmonicProbability?: number
  dynamicRange?: number
  vocalProbability?: number
}

const clamp01 = (value:number) => Math.max(0,Math.min(1,value))

export function estimateVocalProbability(
  frame:Pick<
    MusicDspFrame,
    'rms'|'bass'|'lowMid'|'mid'|'presence'|'air'|'spectralFlux'|'spectralCentroid'|
    'spectralFlatness'|'zeroCrossingRate'|'harmonicProbability'|'percussiveProbability'
  >,
) {
  if (frame.rms < .03) return 0

  // A vocal probability must require more than "harmonic energy in the vocal
  // bands". Violin and piano both satisfy that condition. Favor a mid/presence
  // shape with articulation, then explicitly penalize strongly harmonic
  // low-mid-dominant instrument profiles.
  const vocalCore=frame.lowMid*.18 + frame.mid*.46 + frame.presence*.36
  const upperVoice=frame.mid*.62 + frame.presence*.38
  const lowerSupport=frame.bass*.30 + frame.lowMid*.70
  const voiceContrast=clamp01((upperVoice-lowerSupport+.12)/.42)

  const centroid=frame.spectralCentroid ?? 0
  const centroidFit=centroid<=550
    ? .08
    : centroid<1100
      ? .08 + ((centroid-550)/550)*.72
      : centroid<=3200
        ? .80 + ((centroid-1100)/2100)*.20
        : centroid<6500
          ? 1 - ((centroid-3200)/3300)*.72
          : .28

  const zcr=frame.zeroCrossingRate ?? 0
  const zcrFit=zcr<=.012
    ? .20
    : zcr<.035
      ? .20 + ((zcr-.012)/.023)*.80
      : zcr<=.09
        ? 1
        : clamp01(1-(zcr-.09)/.12)

  const articulation=clamp01((frame.spectralFlux-.08)/.55)
  const harmonic=clamp01(frame.harmonicProbability ?? 0)
  const instrumentLike=
    clamp01((harmonic-.70)/.18) *
    clamp01((frame.lowMid-frame.presence+.10)/.38)
  const bassMask=clamp01((frame.bass-.58)/.34)

  const raw=clamp01(
    .04 +
    vocalCore*.42 +
    centroidFit*.16 +
    zcrFit*.08 +
    articulation*.08 +
    voiceContrast*.18
  )
  return clamp01(
    raw *
    (1-instrumentLike*.58) *
    (1-bassMask*.22)
  )
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
