import Link from 'next/link'
import { countPendingComments } from '@/content/engagement'
import { getPostsAdmin } from '@/content/posts'
import {
  changePostHighlightAction,
  changePostStatusAction,
  purgePostAction,
  restorePostAction,
  trashPostAction,
} from './actions'

function title(post: Awaited<ReturnType<typeof getPostsAdmin>>[number]) {
  return post.titleEn || post.titleVi || 'Untitled'
}

export default async function WritingPage() {
  const [posts,pendingComments] = await Promise.all([
    getPostsAdmin(),
    countPendingComments(),
  ])
  const live = posts.filter(post => !post.deletedAt)
  const trashed = posts.filter(post => post.deletedAt)

  return (
    <section className="control-page cms-post-list-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTENT / WRITING</p>
          <h1>Writing</h1>
          <span>Write, translate and publish directly to /writing.</span>
        </div>
        <div className="cms-writing-head-actions">
          <Link href="/control/content/tags">TAGS</Link>
          <Link href="/control/content/writing/comments">
            COMMENTS{pendingComments ? ' · ' + pendingComments + ' PENDING' : ''}
          </Link>
          <Link className="control-primary" href="/control/content/writing/new">NEW POST</Link>
        </div>
      </header>
      <div className="cms-list-summary">
        <span><strong>{live.length}</strong> ACTIVE</span>
        <span><strong>{live.filter(post => post.status === 'published').length}</strong> PUBLISHED</span>
        <span><strong>{live.filter(post => post.status === 'draft').length}</strong> DRAFT</span>
        <span><strong>{live.filter(post => post.highlight).length}</strong> HIGHLIGHT</span>
        <span><strong>{trashed.length}</strong> TRASH</span>
      </div>

      <div className="cms-post-list">
        {live.length === 0 && (
          <div className="cms-empty-state">
            <strong>No posts yet.</strong>
            <p>Create the first story and publish it to Writing.</p>
            <Link className="control-primary" href="/control/content/writing/new">CREATE POST</Link>
          </div>
        )}
        {live.map(post => (
          <article className="cms-post-row" key={post.id}>
            <Link className="cms-post-row-main" href={'/control/content/writing/' + post.id}>
              {post.coverUrl ? <img src={post.coverUrl} alt="" /> : <span className="cms-post-no-cover">POST</span>}
              <div>
                <strong>{title(post)}</strong>
                <small>/writing/{post.slug}</small>
                {(post.highlight || post.tagRecords.length > 0) && (
                  <div className="cms-post-taxonomy">
                    {post.highlight && <b>HIGHLIGHT</b>}
                    {post.tagRecords.map(tag => (
                      <span key={tag.id} style={{backgroundColor:tag.color,color:tag.textColor,borderColor:tag.color}}>
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
            <div className="cms-post-row-state">
              <span className={'control-state is-' + post.status}>{post.status.toUpperCase()}</span>
              <small>{post.updatedAt.toLocaleString('en-GB')}</small>
            </div>
            <div className="control-actions">
              <form action={changePostHighlightAction}>
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="highlight" value={String(!post.highlight)} />
                <button type="submit">{post.highlight ? 'UNHIGHLIGHT' : 'HIGHLIGHT'}</button>
              </form>
              {post.status !== 'published' ? (
                <form action={changePostStatusAction}>
                  <input type="hidden" name="id" value={post.id} />
                  <input type="hidden" name="status" value="published" />
                  <button type="submit">PUBLISH</button>
                </form>
              ) : (
                <form action={changePostStatusAction}>
                  <input type="hidden" name="id" value={post.id} />
                  <input type="hidden" name="status" value="draft" />
                  <button type="submit">UNPUBLISH</button>
                </form>
              )}
              <Link href={'/control/content/writing/' + post.id}>EDIT</Link>
              <form action={trashPostAction}>
                <input type="hidden" name="id" value={post.id} />
                <button type="submit">TRASH</button>
              </form>
            </div>
          </article>
        ))}
      </div>
      {trashed.length > 0 && (
        <details className="cms-trash">
          <summary>TRASH · {trashed.length}</summary>
          <div className="cms-post-list">
            {trashed.map(post => (
              <article className="cms-post-row is-trashed" key={post.id}>
                <div className="cms-post-row-main">
                  <span className="cms-post-no-cover">TRASH</span>
                  <div><strong>{title(post)}</strong><small>{post.slug}</small></div>
                </div>
                <div className="control-actions">
                  <form action={restorePostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit">RESTORE</button>
                  </form>
                  <form action={purgePostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button className="is-danger" type="submit">PURGE</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
