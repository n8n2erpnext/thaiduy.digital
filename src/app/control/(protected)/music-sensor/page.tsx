import { desc } from 'drizzle-orm'
import { db } from '@/db/client'
import { hubDevices } from '@/db/schema'
import { ensureRedis } from '@/lib/redis'
import { createMusicSensorPairCodeAction, revokeHubDeviceAction } from './actions'

export default async function MusicSensorControlPage() {
  const redis = await ensureRedis()
  const [devices, code] = await Promise.all([
    db.select().from(hubDevices).orderBy(desc(hubDevices.createdAt)),
    redis.get('hub:pair:current'),
  ])
  const ttl = code ? await redis.ttl('hub:pair:current') : -1

  return (
    <section className="control-page">
      <header className="control-page-head">
        <p>CONTROL / MUSIC SENSOR</p>
        <h1>Hub device pairing</h1>
        <span>Pair Thái Duy Hub devices with scoped permissions. Music Sensor is the first module.</span>
      </header>

      <div className="control-split">
        <section className="control-panel">
          <h2>PAIR ANDROID</h2>
          {code ? (
            <div className="control-stat">
              <span>ONE-TIME CODE · EXPIRES IN {Math.max(0, ttl)}s</span>
              <strong style={{ letterSpacing:'.18em' }}>{code}</strong>
            </div>
          ) : <p>No active pairing code.</p>}
          <form action={createMusicSensorPairCodeAction}>
            <button type="submit">{code ? 'ROTATE PAIR CODE' : 'CREATE PAIR CODE'}</button>
          </form>
          <p>Open Thái Duy Hub on Android, enter this six-digit code, then tap PAIR.</p>
        </section>

        <section className="control-panel">
          <h2>PAIRED DEVICES</h2>
          <div className="control-setting-list">

            {devices.length ? devices.map(device => (
              <article className="control-binding-card" key={device.id}>
                <div>
                  <strong>{device.name}</strong>
                  <small>
                    {device.platform.toUpperCase()} · {device.enabled && !device.revokedAt ? 'ENABLED' : 'REVOKED'}
                    {' · '}LAST SEEN {device.lastSeenAt ? device.lastSeenAt.toISOString() : 'NEVER'}
                    {' · '}SCOPES {device.scopes.join(', ')}
                  </small>
                </div>
                {device.enabled && !device.revokedAt && (
                  <form action={revokeHubDeviceAction}>
                    <input type="hidden" name="id" value={device.id} />
                    <button type="submit">REVOKE</button>
                  </form>
                )}
              </article>
            )) : <p>No paired Hub device yet.</p>}
          </div>
        </section>
      </div>
    </section>
  )
}
