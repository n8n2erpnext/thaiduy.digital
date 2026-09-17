import { getAuditLog } from '@/control/queries'

export default async function AuditPage() {
  const rows = await getAuditLog(150)
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / AUDIT</p><h1>Operator activity</h1><span>Every durable mutation records actor, action, target and timestamp. Revisions keep before/after state for managed content and brain profiles.</span></header>
      <div className="control-table-wrap">
        <table className="control-table audit-table">
          <thead><tr><th>TIME</th><th>ACTION</th><th>ENTITY</th><th>ID</th><th>ACTOR</th></tr></thead>
          <tbody>{rows.map(row => (
            <tr key={row.id}><td>{row.createdAt.toLocaleString('en-GB')}</td><td>{row.action}</td><td>{row.entityType ?? '—'}</td><td>{row.entityId ?? '—'}</td><td>{row.actorId ?? 'system'}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="control-note">NO OPERATOR MUTATIONS YET.</p>}
    </section>
  )
}
