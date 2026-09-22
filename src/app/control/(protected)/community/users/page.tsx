import Link from 'next/link'
import { getCommunityUsersAdmin } from '@/community/data'
import { setCommunityUserStatusAction } from './actions'

type UserRow={
  id:string
  name:string
  email:string
  image:string | null
  emailVerified:boolean
  createdAt:Date | string
  status:'active'|'blocked'
  note:string | null
  blockedAt:Date | string | null
  threads:number | string
  replies:number | string
}

export default async function CommunityUsersPage() {
  const users=await getCommunityUsersAdmin() as unknown as UserRow[]

  return (
    <section className="control-page community-users-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTROL / DISCUSS / USERS</p>
          <h1>Discuss members</h1>
          <span>Google accounts that can participate in public Discuss topics.</span>
        </div>
        <Link className="control-back" href="/control/community">← TOPICS</Link>
      </header>
      <div className="community-users-list">
        {users.length===0 && (
          <div className="cms-empty-state">
            <strong>No Google members yet.</strong>
            <p>Accounts will appear after Google sign-in is used on the public site.</p>
          </div>
        )}

        {users.map(member=>(
          <article className="community-user-row" data-status={member.status} key={member.id}>
            <div className="community-admin-author">
              {member.image
                ? <img src={member.image} alt="" />
                : <i>{member.name.slice(0,2).toUpperCase()}</i>}
              <div>
                <strong>{member.name}</strong>
                <small>{member.email}</small>
              </div>
            </div>

            <div className="community-user-meta">
              <span className={'control-state is-'+member.status}>{member.status.toUpperCase()}</span>
              <span>{Number(member.threads).toLocaleString('en-US')} THREADS</span>
              <span>{Number(member.replies).toLocaleString('en-US')} REPLIES</span>
              <time>JOINED {new Date(member.createdAt).toLocaleDateString('en-GB')}</time>
            </div>

            <div className="control-actions">
              <form action={setCommunityUserStatusAction}>
                <input type="hidden" name="userId" value={member.id} />
                <input type="hidden" name="status" value={member.status==='blocked'?'active':'blocked'} />
                <button className={member.status==='blocked'?'':'is-danger'} type="submit">
                  {member.status==='blocked'?'UNBLOCK':'BLOCK'}
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
