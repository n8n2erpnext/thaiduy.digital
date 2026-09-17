import Link from 'next/link'
import { asc, eq, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { brainMemory } from '@/db/schema'
import { deleteKnowledgeAction, reseedKnowledgeAction, toggleKnowledgeAction } from './actions'

function summary(value: unknown) {
  const item = value as Record<string, unknown>
  const node = item.node as Record<string, unknown> | undefined
  const archetype = item.archetype as Record<string, unknown> | undefined
  if (node) return `${String(node.kind)} · ${String(node.family)} · ${Array.isArray(node.aliases) ? node.aliases.length : 0} aliases`
  if (archetype) return `${String(archetype.cue ?? '')} · ${String(archetype.meaning ?? archetype.rule ?? '')}`
  if (item.rule) return String(item.rule)
  if (item.weights) return 'source voting weights'
  return 'knowledge record'
}

export default async function BrainKnowledgePage() {
  const rows = await db.select().from(brainMemory).where(or(
    eq(brainMemory.hemisphere, 'knowledge-left'),
    eq(brainMemory.hemisphere, 'knowledge-right'),
    eq(brainMemory.hemisphere, 'knowledge-cortex'),
  )).orderBy(asc(brainMemory.hemisphere), asc(brainMemory.memoryKey))
  return (
    <section className="control-page">
      <header className="control-page-head">
        <p>CONTROL / BRAINS / KNOWLEDGE</p>
        <h1>Music knowledge pack</h1>
        <span>Persistent Luna knowledge. Each record can be edited, disabled or deleted without redeploying the site.</span>
      </header>
      <form action={reseedKnowledgeAction}><button className="control-primary" type="submit">RESEED DEFAULT PACK</button></form>
      <div className="control-setting-list">
        {rows.map(row => {
          const value = row.value as Record<string, unknown>
          const enabled = value.enabled !== false
          return (
            <article key={row.id}>
              <div>
                <strong>{row.hemisphere} / {row.memoryKey}</strong>
                <small>{enabled ? 'ENABLED' : 'DISABLED'} · confidence {row.confidence.toFixed(2)} · {summary(row.value)}</small>
              </div>
              <div className="control-inline-actions">
                <Link href={`/control/brains/knowledge/${row.id}`}>EDIT</Link>
                <form action={toggleKnowledgeAction}><input type="hidden" name="id" value={row.id}/><button type="submit">{enabled ? 'TURN OFF' : 'TURN ON'}</button></form>
                <form action={deleteKnowledgeAction}><input type="hidden" name="id" value={row.id}/><button type="submit">DELETE</button></form>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
