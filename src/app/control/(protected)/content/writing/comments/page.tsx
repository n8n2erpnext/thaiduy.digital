import Link from 'next/link'
import { getWritingModerationQueue } from '@/content/engagement'
import {
  approveCommentAction,
  rejectCommentAction,
  trashCommentAction,
} from './actions'

export default async function WritingCommentsPage() {
  const comments = await getWritingModerationQueue()
  const pending = comments.filter(comment => comment.status === 'pending')

  return (
    <section className="control-page cms-comments-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTENT / WRITING / COMMENTS</p>
          <h1>Comments</h1>
          <span>Google-authenticated comments stay private until approved.</span>
        </div>
        <Link className="control-back" href="/control/content/writing">← WRITING</Link>
      </header>

      <div className="cms-list-summary">
        <span><strong>{pending.length}</strong> PENDING</span>
        <span><strong>{comments.filter(c => c.status === 'approved').length}</strong> APPROVED</span>
        <span><strong>{comments.filter(c => c.status === 'rejected').length}</strong> REJECTED</span>
      </div>
      <div className="cms-comment-list">
        {comments.length === 0 && (
          <div className="cms-empty-state">
            <strong>No comments yet.</strong>
            <p>New Google-authenticated comments will appear here for moderation.</p>
          </div>
        )}

        {comments.map(comment => (
          <article className="cms-comment-row" data-status={comment.status} key={comment.id}>
            <div className="cms-comment-author">
              {comment.authorImage
                ? <img src={comment.authorImage} alt="" />
                : <span>{comment.authorName.slice(0,2).toUpperCase()}</span>}
              <div>
                <strong>{comment.authorName}</strong>
                <small>{comment.authorEmail}</small>
              </div>
            </div>

            <div className="cms-comment-body">
              <div>
                <span className={'control-state is-' + comment.status}>{comment.status.toUpperCase()}</span>
                <Link href={'/writing/' + comment.postSlug} target="_blank">
                  {comment.postTitleEn || comment.postTitleVi || comment.postSlug} ↗
                </Link>
                <time>{comment.createdAt.toLocaleString('en-GB')}</time>
              </div>
              <p>{comment.body}</p>
            </div>
            <div className="control-actions cms-comment-actions">
              {comment.status !== 'approved' && (
                <form action={approveCommentAction}>
                  <input type="hidden" name="id" value={comment.id} />
                  <input type="hidden" name="slug" value={comment.postSlug} />
                  <button type="submit">APPROVE</button>
                </form>
              )}
              {comment.status !== 'rejected' && (
                <form action={rejectCommentAction}>
                  <input type="hidden" name="id" value={comment.id} />
                  <input type="hidden" name="slug" value={comment.postSlug} />
                  <button type="submit">REJECT</button>
                </form>
              )}
              <form action={trashCommentAction}>
                <input type="hidden" name="id" value={comment.id} />
                <input type="hidden" name="slug" value={comment.postSlug} />
                <button className="is-danger" type="submit">TRASH</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
