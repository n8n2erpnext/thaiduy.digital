import Link from 'next/link'
import {
  getCommunityAdminSummary,
  getCommunityModerationQueue,
} from '@/community/data'
import {
  moderateCommunityAction,
  trashCommunityAction,
} from './actions'

export default async function CommunityControlPage() {
  const [summary,items]=await Promise.all([
    getCommunityAdminSummary(),
    getCommunityModerationQueue(),
  ])

  return (
    <section className="control-page community-control-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTROL / COMMUNITY</p>
          <h1>Discuss moderation</h1>
          <span>Review public topics and replies before they become visible.</span>
        </div>
        <Link className="control-back" href="/control/community/users">MANAGE USERS →</Link>
      </header>

      <div className="control-stat-grid community-stat-grid">
        <div className="control-stat"><span>PENDING</span><strong>{summary.pending}</strong></div>
        <div className="control-stat"><span>THREADS</span><strong>{summary.threads}</strong></div>
        <div className="control-stat"><span>REPLIES</span><strong>{summary.replies}</strong></div>
        <Link className="control-stat" href="/control/community/users"><span>USERS</span><strong>{summary.users}</strong></Link>
      </div>

      <div className="community-admin-list">
        {items.length===0 && (
          <div className="cms-empty-state">
            <strong>No Discuss activity yet.</strong>
            <p>New Google-authenticated topics and replies will appear here.</p>
          </div>
        )}
        {items.map(item=>(
          <article className="community-admin-row" data-status={item.status} key={item.kind+item.id}>
            <div className="community-admin-author">
              {item.authorImage
                ? <img src={item.authorImage} alt="" />
                : <i>{item.authorName.slice(0,2).toUpperCase()}</i>}
              <div>
                <strong>{item.authorName}</strong>
                <small>{item.authorEmail}</small>
              </div>
            </div>

            <div className="community-admin-content">
              <header>
                <span className={'control-state is-'+item.status}>{item.status.toUpperCase()}</span>
                <b>{item.kind.toUpperCase()}</b>
                <time>{item.createdAt.toLocaleString('en-GB')}</time>
              </header>
              <Link href={'/guestbook/'+item.threadId} target="_blank">{item.title} ↗</Link>
              {item.bodyHtml ? (
                <div
                  className="community-admin-rich-preview discuss-post-body"
                  dangerouslySetInnerHTML={{__html:item.bodyHtml}}
                />
              ) : (
                <p>{item.body}</p>
              )}
            </div>

            <div className="control-actions community-admin-actions">
              {item.status!=='approved' && (
                <form action={moderateCommunityAction}>
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="threadId" value={item.threadId} />
                  <input type="hidden" name="status" value="approved" />
                  <button type="submit">APPROVE</button>
                </form>
              )}
              {item.status!=='rejected' && (
                <form action={moderateCommunityAction}>
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="threadId" value={item.threadId} />
                  <input type="hidden" name="status" value="rejected" />
                  <button type="submit">REJECT</button>
                </form>
              )}
              {item.status!=='hidden' && (
                <form action={moderateCommunityAction}>
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="threadId" value={item.threadId} />
                  <input type="hidden" name="status" value="hidden" />
                  <button type="submit">HIDE</button>
                </form>
              )}
              <form action={trashCommunityAction}>
                <input type="hidden" name="kind" value={item.kind} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="threadId" value={item.threadId} />
                <button className="is-danger" type="submit">TRASH</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
