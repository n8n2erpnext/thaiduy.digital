import Link from 'next/link'
import { getBrainMemoryStats, getBrainProfiles } from '@/control/queries'
import { saveBrainAction } from './actions'

export default async function BrainsPage() {
  const [profiles, memory] = await Promise.all([getBrainProfiles(), getBrainMemoryStats()])
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / BRAINS</p><h1>Luna brain profiles</h1><span>Two independent hemispheres observe in parallel; the cortex fuses their evidence and owns the public decision state.</span><Link href="/control/brains/knowledge">OPEN KNOWLEDGE MANAGER</Link></header>
      <div className="brain-profile-list">
        {profiles.map(profile => {
          const stats = (memory as Record<string, unknown>[]).filter(row => row.brain_key === profile.brainKey)
          return (
            <form className="brain-profile" action={saveBrainAction} key={profile.id}>
              <input type="hidden" name="brainKey" value={profile.brainKey}/>
              <header><div><span>BRAIN PROFILE</span><h2>{profile.brainKey}</h2></div><label className="control-toggle"><input name="enabled" type="checkbox" defaultChecked={profile.enabled}/><span>ENABLED</span></label></header>
              <div className="brain-hemisphere-grid">
                <label><span>LEFT HEMISPHERE / SEMANTIC</span><textarea name="leftConfig" rows={12} defaultValue={JSON.stringify(profile.leftConfig, null, 2)} spellCheck={false}/></label>
                <label><span>RIGHT HEMISPHERE / SIGNAL</span><textarea name="rightConfig" rows={12} defaultValue={JSON.stringify(profile.rightConfig, null, 2)} spellCheck={false}/></label>
                <label><span>CORTEX / FUSION</span><textarea name="cortexConfig" rows={12} defaultValue={JSON.stringify(profile.cortexConfig, null, 2)} spellCheck={false}/></label>
              </div>
              <div className="brain-memory-row">
                <label><span>MEMORY POLICY</span><textarea name="memoryConfig" rows={6} defaultValue={JSON.stringify(profile.memoryConfig, null, 2)} spellCheck={false}/></label>
                <div className="brain-memory-stats"><span>MEMORY STATE</span>{stats.length === 0 ? <strong>EMPTY / READY TO LEARN</strong> : stats.map((row, index) => <p key={index}>{String(row.hemisphere)} · {String(row.entries)} entries</p>)}</div>
              </div>
              <footer><span>LEFT → RIGHT → CORTEX / bounded memory</span><button className="control-primary" type="submit">SAVE BRAIN PROFILE</button></footer>
            </form>
          )
        })}
      </div>
    </section>
  )
}
