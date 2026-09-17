import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db } from '@/db/client'
import { brainMemory } from '@/db/schema'
import { saveKnowledgeAction } from '../actions'

export default async function BrainKnowledgeEditPage({ params }: PageProps<'/control/brains/knowledge/[id]'>) {
  const resolved = await params
  const id = Number(resolved.id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const [row] = await db.select().from(brainMemory).where(eq(brainMemory.id, id)).limit(1)
  if (!row || !row.hemisphere.startsWith('knowledge-')) notFound()

  return (
    <section className="control-page">
      <header className="control-page-head">
        <p>CONTROL / BRAINS / KNOWLEDGE / EDIT</p>
        <h1>{row.memoryKey}</h1>
        <span>{row.brainKey} · {row.hemisphere}</span>
      </header>
      <form className="control-form" action={saveKnowledgeAction}>
        <input type="hidden" name="id" value={row.id}/>
        <label><span>CONFIDENCE</span><input name="confidence" type="number" min="0" max="1" step="0.01" defaultValue={row.confidence}/></label>
        <label><span>KNOWLEDGE JSON</span><textarea name="value" rows={24} defaultValue={JSON.stringify(row.value, null, 2)} spellCheck={false}/></label>
        <div className="control-inline-actions">
          <button className="control-primary" type="submit">SAVE KNOWLEDGE</button>
          <Link href="/control/brains/knowledge">BACK</Link>
        </div>
      </form>
    </section>
  )
}
