import Link from 'next/link'
import { TagColorField } from '@/components/control/tag-color-field'
import { getWritingTagUsage } from '@/content/writing-tags'
import { createWritingTagAction, updateWritingTagAction } from './actions'

export default async function WritingTagsPage() {
  const tags=await getWritingTagUsage()
  const active=tags.filter(tag=>tag.enabled)
  const disabled=tags.filter(tag=>!tag.enabled)

  return (
    <section className="control-page cms-tags-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTENT / WRITING / TAGS</p>
          <h1>Tags</h1>
          <span>Create tag identity once, choose it from posts, and keep the same color everywhere public.</span>
        </div>
        <Link href="/control/content/writing">← WRITING</Link>
      </header>

      <div className="cms-list-summary">
        <span><strong>{tags.length}</strong> TOTAL</span>
        <span><strong>{active.length}</strong> ACTIVE</span>
        <span><strong>{disabled.length}</strong> DISABLED</span>
        <span><strong>{tags.reduce((sum,tag)=>sum+tag.usage,0)}</strong> ASSIGNMENTS</span>
      </div>

      <section className="cms-tag-create">
        <div>
          <span>NEW TAG</span>
          <strong>Create reusable taxonomy</strong>
          <p>Slug is generated once from the name and stays stable after creation.</p>
        </div>
        <form action={createWritingTagAction}>
          <label>
            <span>NAME</span>
            <input name="name" maxLength={64} placeholder="architecture" required />
          </label>
          <TagColorField />
          <button className="control-primary" type="submit">CREATE TAG</button>
        </form>
      </section>

      <div className="cms-tag-registry">
        {tags.length===0 && (
          <div className="cms-empty-state">
            <strong>No tags yet.</strong>
            <p>Create the first tag above, then it will become available in the Writing editor.</p>
          </div>
        )}
        {tags.map(tag=>(
          <form className={'cms-tag-row'+(tag.enabled?'':' is-disabled')} action={updateWritingTagAction} key={tag.id}>
            <input type="hidden" name="id" value={tag.id}/>
            <div className="cms-tag-row-identity">
              <span className="cms-tag-live-preview" style={{backgroundColor:tag.color,color:tag.textColor}}>
                #{tag.name}
              </span>
              <div>
                <code>{tag.slug}</code>
                <small>{tag.usage} {tag.usage===1?'post':'posts'}</small>
              </div>
            </div>
            <label className="cms-tag-name-edit">
              <span>DISPLAY NAME</span>
              <input name="name" defaultValue={tag.name} maxLength={64} required/>
            </label>
            <TagColorField defaultValue={tag.color}/>
            <label className="cms-tag-enabled">
              <input type="checkbox" name="enabled" defaultChecked={tag.enabled}/>
              <span>ACTIVE</span>
            </label>
            <button type="submit">SAVE</button>
          </form>
        ))}
      </div>
    </section>
  )
}
