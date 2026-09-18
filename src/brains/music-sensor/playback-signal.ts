import { ensureRedis } from '@/lib/redis'

export const MUSIC_PLAYBACK_KEY = 'music:playback:latest'
export const MUSIC_PLAYBACK_CHANNEL = 'music:playback:events'
export const MUSIC_PLAYBACK_TTL_SECONDS = 180

export type HubPlaybackSignal = {
  deviceId: string
  packageName: string
  artist: string
  title: string
  album?: string
  state: 'playing' | 'paused' | 'stopped' | 'buffering'
  positionMs?: number
  durationMs?: number
  at: string
}

export async function publishHubPlayback(signal: HubPlaybackSignal) {
  const redis = await ensureRedis()
  const payload = JSON.stringify(signal)
  const multi = redis.multi()
  multi.set(MUSIC_PLAYBACK_KEY, payload, 'EX', MUSIC_PLAYBACK_TTL_SECONDS)
  multi.publish(MUSIC_PLAYBACK_CHANNEL, payload)
  await multi.exec()
}

export async function getLatestHubPlayback(maxAgeMs = 90_000) {
  const redis = await ensureRedis()
  const raw = await redis.get(MUSIC_PLAYBACK_KEY)
  if (!raw) return null
  try {
    const signal = JSON.parse(raw) as HubPlaybackSignal
    const age = Date.now() - Date.parse(signal.at)
    if (!Number.isFinite(age) || age < -5_000 || age > maxAgeMs) return null
    return signal
  } catch {
    return null
  }
}
