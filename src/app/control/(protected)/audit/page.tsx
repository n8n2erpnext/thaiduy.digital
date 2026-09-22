import { AuditLogPanel } from '@/components/control/audit-log-panel'
import { getAuditLogPage } from '@/control/queries'

export default async function AuditPage() {
  const result=await getAuditLogPage(10,1)
  const initial={
    total:result.total,
    page:result.page,
    pages:result.pages,
    limit:result.limit,
    rows:result.rows.map(row=>({
      id:row.id,
      actorId:row.actorId,
      action:row.action,
      entityType:row.entityType,
      entityId:row.entityId,
      createdAt:row.createdAt.toISOString(),
    })),
  }

  return (
    <section className="control-page">
      <header className="control-page-head">
        <p>CONTROL / AUDIT</p>
        <h1>Operator activity</h1>
        <span>
          Every durable mutation records actor, action, target and timestamp. Revisions keep before/after state for managed content and brain profiles.
        </span>
      </header>
      <AuditLogPanel initial={initial}/>
    </section>
  )
}
