import { MusicSensorExplorer } from '@/components/living/music-sensor-explorer'
import { SiteHeader } from '@/components/site/header'
import { MUSIC_K2_CONCEPTS, MUSIC_K2_VERSION } from '@/brains/music-sensor/k2-general'
import { MUSIC_NODES } from '@/brains/music-sensor/knowledge'
import { resolveLocale } from '@/i18n/locale'

export default async function MusicSensorPage() {
  const locale=await resolveLocale()
  const relations=MUSIC_K2_CONCEPTS.reduce(
    (sum,concept)=>sum+concept.parents.length+concept.related.length,
    0,
  )

  return (
    <div className="site-shell">
      <SiteHeader locale={locale}/>
      <MusicSensorExplorer
        locale={locale}
        concepts={MUSIC_K2_CONCEPTS.length}
        relations={relations}
        semanticNodes={MUSIC_NODES.length}
        knowledgeVersion={MUSIC_K2_VERSION}
      />
    </div>
  )
}
