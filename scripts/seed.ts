import { db, sqlClient } from '../src/db/client'
import { brainProfiles, featureFlags, siteRegistry, siteSettings } from '../src/db/schema'
import { fallbackRegistry } from '../src/content/fallback'

async function seed() {
  for (const item of fallbackRegistry) {
    await db.insert(siteRegistry).values({
      key: item.key,
      kind: item.kind,
      enabled: item.enabled,
      status: item.status,
      sort: item.sort,
      parentKey: item.parentKey,
      labelEn: item.label.en,
      labelVi: item.label.vi,
      titleEn: item.title?.en,
      titleVi: item.title?.vi,
      summaryEn: item.summary?.en,
      summaryVi: item.summary?.vi,
      meta: item.meta ?? {},
      runtimeKey: item.runtimeKey,
    }).onConflictDoNothing({ target: siteRegistry.key })
  }
  const flags = [
    ['traffic.analytics', true],
    ['music.sensor', true],
    ['music.idle_humming', true],
    ['public.topology', true],
    ['public.runtime_state', true],
  ] as const
  for (const [key, enabled] of flags) {
    await db.insert(featureFlags).values({ key, enabled }).onConflictDoNothing({ target: featureFlags.key })
  }

  await db.insert(brainProfiles).values({
    brainKey: 'sentinel-music',
    enabled: true,
    leftConfig: { role: 'semantic-ear', sources: ['lastfm', 'musicbrainz', 'listenbrainz'] },
    rightConfig: { role: 'acoustic-ear', sources: ['local-dsp'], bands: ['bass', 'lowMid', 'mid', 'presence', 'air', 'vocal'] },
    cortexConfig: { role: 'fusion', hysteresisMs: 4000, crossfadeMs: 2200 },
    memoryConfig: { leftMax: 4096, rightMax: 4096, cortexMax: 2048 },
  }).onConflictDoNothing({ target: brainProfiles.brainKey })

  await db.insert(siteSettings).values({ key: 'site.identity', value: { name: 'Thái Duy', domain: 'thaiduy.digital' } }).onConflictDoNothing({ target: siteSettings.key })
}
seed()
  .then(async () => {
    console.log('greenfield_seed_complete')
    await sqlClient.end()
  })
  .catch(async error => {
    console.error(error)
    await sqlClient.end()
    process.exit(1)
  })
