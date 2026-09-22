import Link from 'next/link'
import {
  getCommunityAdminSummary,
  getCommunityTopicsAdmin,
  type CommunityAdminFilterStatus,
} from '@/community/data'

type Props={
  searchParams:Promise<{
    page?:string
    status?:string
    q?:string
  }>
}

const statuses:CommunityAdminFilterStatus[]=[
  'all','attention','pending','approved','hidden','rejected',
]

function pageNumber(value:string|undefined) {
  const parsed=Number.parseInt(value ?? '1',10)
  return Number.isFinite(parsed) && parsed>0?parsed:1
}

function statusValue(value:string|undefined):CommunityAdminFilterStatus {
  return statuses.includes(value as CommunityAdminFilterStatus)
    ? value as CommunityAdminFilterStatus
    : 'all'
}

function hrefFor({
  page,status,q,
}:{
  page:number
  status:CommunityAdminFilterStatus
  q:string
}) {
  const params=new URLSearchParams()
  if (page>1) params.set('page',String(page))
  if (status!=='all') params.set('status',status)
  if (q) params.set('q',q)
  const query=params.toString()
  return '/control/community'+(query?'?'+query:'')
}
export default async function CommunityControlPage({searchParams}:Props) {
  const raw=await searchParams
  const page=pageNumber(raw.page)
  const status=statusValue(raw.status)
  const q=(raw.q ?? '').trim().slice(0,120)

  const [summary,topics]=await Promise.all([
    getCommunityAdminSummary(),
    getCommunityTopicsAdmin({page,limit:20,status,q}),
  ])

  return (
    <section className="control-page discuss-control-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTROL / DISCUSS</p>
          <h1>Topics</h1>
          <span>Search, filter and manage Discuss topic-by-topic.</span>
        </div>
        <div className="discuss-control-head-actions">
          <Link className="control-back" href="/discuss" target="_blank">OPEN DISCUSS ↗</Link>
          <Link className="control-back" href="/control/community/users">USERS →</Link>
        </div>
      </header>

      <div className="control-stat-grid community-stat-grid">
        <Link className="control-stat" href="/control/community?status=attention">
          <span>PENDING</span><strong>{summary.pending}</strong>
        </Link>
        <div className="control-stat"><span>TOPICS</span><strong>{summary.threads}</strong></div>
        <div className="control-stat"><span>REPLIES</span><strong>{summary.replies}</strong></div>
        <Link className="control-stat" href="/control/community/users">
          <span>USERS</span><strong>{summary.users}</strong>
        </Link>
      </div>
      <form className="discuss-control-filter" method="get">
        <label>
          <span>SEARCH</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Topic, content, author or email…"
            maxLength={120}
          />
        </label>
        <label>
          <span>STATUS</span>
          <select name="status" defaultValue={status}>
            <option value="all">ALL</option>
            <option value="attention">ATTENTION</option>
            <option value="pending">PENDING TOPIC</option>
            <option value="approved">APPROVED</option>
            <option value="hidden">HIDDEN</option>
            <option value="rejected">REJECTED</option>
          </select>
        </label>
        <button type="submit">APPLY</button>
        {(q || status!=='all') && <Link href="/control/community">CLEAR</Link>}
      </form>

      <div className="discuss-topic-index-head">
        <span>{topics.total.toLocaleString('en-US')} TOPICS</span>
        <span>PAGE {topics.page} / {topics.pages}</span>
      </div>

      <div className="discuss-topic-admin-list">
        {topics.items.length===0 && (
          <div className="cms-empty-state">
            <strong>No matching topics.</strong>
            <p>Change the search or status filter to broaden the result set.</p>
          </div>
        )}

        {topics.items.map(topic=>(
          <article className="discuss-topic-admin-row" data-status={topic.status} key={topic.id}>
            <div className="community-admin-author">
              {topic.authorImage
                ? <img src={topic.authorImage} alt="" />
                : <i>{topic.authorName.slice(0,2).toUpperCase()}</i>}
              <div>
                <strong>{topic.authorName}</strong>
                <small>{topic.authorEmail}</small>
              </div>
            </div>

            <div className="discuss-topic-admin-content">
              <header>
                <span className={'control-state is-'+topic.status}>{topic.status.toUpperCase()}</span>
                {topic.pinned && <span className="discuss-control-chip is-signal">PINNED</span>}
                {topic.locked && <span className="discuss-control-chip">LOCKED</span>}
                {Number(topic.pendingReplies)>0 && (
                  <span className="discuss-control-chip is-pending">
                    {Number(topic.pendingReplies)} PENDING REPLIES
                  </span>
                )}
              </header>
              <Link href={'/control/community/'+topic.id}>{topic.title}</Link>
              <p>{topic.body}</p>
            </div>

            <div className="discuss-topic-admin-metrics">
              <span><strong>{Number(topic.replyCount)}</strong> REPLIES</span>
              <span><strong>{Number(topic.likeCount)}</strong> REACTIONS</span>
              <time>ACTIVE {new Date(topic.lastActivityAt).toLocaleString('en-GB')}</time>
              <Link href={'/control/community/'+topic.id}>MANAGE →</Link>
            </div>
          </article>
        ))}
      </div>
      {topics.pages>1 && (
        <nav className="control-hot-pagination discuss-control-pagination" aria-label="Topic pagination">
          <Link
            href={hrefFor({page:Math.max(1,topics.page-1),status,q})}
            data-disabled={topics.page===1 || undefined}
            aria-disabled={topics.page===1}
          >
            ← PREV
          </Link>
          <span>PAGE {topics.page} / {topics.pages}</span>
          <Link
            href={hrefFor({page:Math.min(topics.pages,topics.page+1),status,q})}
            data-disabled={topics.page===topics.pages || undefined}
            aria-disabled={topics.page===topics.pages}
          >
            NEXT →
          </Link>
        </nav>
      )}
    </section>
  )
}
