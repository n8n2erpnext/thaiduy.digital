import { ensureRedis } from '@/lib/redis'

export const MUSIC_SIGNAL_KEY = 'music:sensor:latest'
export const MUSIC_SIGNAL_CHANNEL = 'music:sensor:frames'
export const MUSIC_SIGNAL_TTL_SECONDS = 8

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
  vocalProbability?: number
}

export async function publishMusicDspFrame(frame: MusicDspFrame) {
  const client = await ensureRedis()
  const payload = JSON.stringify(frame)
  const multi = client.multi()
  multi.set(MUSIC_SIGNAL_KEY, payload, 'EX', MUSIC_SIGNAL_TTL_SECONDS)
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
