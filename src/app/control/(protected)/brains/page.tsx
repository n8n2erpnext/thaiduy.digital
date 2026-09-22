import Link from 'next/link'
import { BrainProfileEditor } from '@/components/control/brain-profile-editor'
import { getBrainMemoryStats, getBrainProfiles } from '@/control/queries'

type MemoryRow=Record<string,unknown>

export default async function BrainsPage() {
  const [profiles,memory]=await Promise.all([
    getBrainProfiles(),
    getBrainMemoryStats(),
  ])

  const totalMemory=(memory as MemoryRow[]).reduce((sum,row)=>sum+Number(row.entries ?? 0),0)
  const enabled=profiles.filter(profile=>profile.enabled).length

  return (
    <section className="control-page control-brains-page">
      <header className="control-page-head control-brains-head">
        <div>
          <p>CONTROL / BRAINS</p>
          <h1>Brain profiles</h1>
          <span>
            Configure bounded semantic, signal and fusion roles without exposing runtime JSON as the primary interface.
          </span>
        </div>
        <Link className="control-primary-button" href="/control/brains/knowledge">OPEN KNOWLEDGE MANAGER</Link>
      </header>

      <div className="brain-summary-strip">
        <div><span>PROFILES</span><strong>{profiles.length}</strong></div>
        <div><span>ENABLED</span><strong>{enabled}</strong></div>
        <div><span>MEMORY ENTRIES</span><strong>{totalMemory.toLocaleString('en-US')}</strong></div>
        <div><span>MODEL</span><strong>LEFT / RIGHT / CORTEX</strong></div>
      </div>

      <div className="brain-profile-list">
        {profiles.map(profile=>{
          const stats=(memory as MemoryRow[])
            .filter(row=>row.brain_key===profile.brainKey)
            .map(row=>({
              hemisphere:String(row.hemisphere ?? ''),
              entries:Number(row.entries ?? 0),
              lastLearned:row.last_learned?String(row.last_learned):null,
            }))

          return (
            <BrainProfileEditor
              key={profile.id}
              brainKey={profile.brainKey}
              enabled={profile.enabled}
              leftConfig={profile.leftConfig as Record<string,unknown>}
              rightConfig={profile.rightConfig as Record<string,unknown>}
              cortexConfig={profile.cortexConfig as Record<string,unknown>}
              memoryConfig={profile.memoryConfig as Record<string,unknown>}
              stats={stats}
            />
          )
        })}
      </div>
    </section>
  )
}
