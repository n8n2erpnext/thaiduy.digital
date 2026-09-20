import Link from 'next/link'
import { getRegistryAll } from '@/content/repository'
import { getLivePublicStackGraph } from '@/server/stack/public'
import { projectRuntimeFromStack } from '@/server/stack/projection'
import {
  purgeProjectAction,
  restoreProjectAction,
  toggleProjectAction,
  trashProjectAction,
} from './actions'

export default async function ProjectsContentPage() {
  const [projects,{ graph }] = await Promise.all([
    getRegistryAll('project'),
    getLivePublicStackGraph(),
  ])
  const runtime = await projectRuntimeFromStack(graph)
  const active = projects.filter(project => !project.deletedAt)
  const trashed = projects.filter(project => project.deletedAt)

  return (
    <section className="control-page cms-project-list-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTENT / PROJECTS</p>
          <h1>Projects</h1>
          <span>One CMS surface, one public project surface. Runtime state stays attached automatically.</span>
        </div>
        <Link className="control-primary" href="/control/content/projects/new">NEW PROJECT</Link>
      </header>
      <div className="cms-list-summary">
        <span><strong>{active.length}</strong> PROJECTS</span>
        <span><strong>{active.filter(item => item.status === 'published' && item.enabled).length}</strong> PUBLIC</span>
        <span><strong>{active.filter(item => runtime[item.key]?.matchedCount).length}</strong> ON STACK</span>
        <span><strong>{trashed.length}</strong> TRASH</span>
      </div>

      <div className="cms-project-list">
        {active.map((project,index) => {
          const state = runtime[project.key]
          const runtimeState = state?.state ?? 'offline'
          return (
            <article className="cms-project-row" key={project.id}>
              <div className="cms-project-order">{String(index + 1).padStart(2,'0')}</div>
              <Link className="cms-project-row-main" href={'/control/content/projects/' + project.id}>
                <strong>{project.label.en || project.label.vi}</strong>
                <span>{project.title?.en || project.title?.vi || '—'}</span>
                <small>{String(project.meta?.plane ?? '')} · {String(project.meta?.mode ?? '')}</small>
              </Link>
              <div className="cms-project-row-state">
                <span className={'control-state is-' + project.status}>{project.status.toUpperCase()}</span>
                <strong data-runtime={runtimeState}>{runtimeState.toUpperCase()}</strong>
                <small>{state?.matchedCount ?? 0} NODES</small>
              </div>
              <div className="control-actions">
                <Link href={'/control/content/projects/' + project.id}>EDIT</Link>
                <form action={toggleProjectAction}>
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="enabled" value={String(!project.enabled)} />
                  <button type="submit">{project.enabled ? 'HIDE' : 'SHOW'}</button>
                </form>
                <form action={trashProjectAction}>
                  <input type="hidden" name="id" value={project.id} />
                  <button type="submit">TRASH</button>
                </form>
              </div>
            </article>
          )
        })}
      </div>

      {trashed.length > 0 && (
        <details className="cms-trash">
          <summary>TRASH · {trashed.length}</summary>
          <div className="cms-project-list">
            {trashed.map(project => (
              <article className="cms-project-row is-trashed" key={project.id}>
                <div className="cms-project-order">—</div>
                <div className="cms-project-row-main">
                  <strong>{project.label.en || project.label.vi}</strong>
                  <span>{project.key}</span>
                </div>
                <div />
                <div className="control-actions">
                  <form action={restoreProjectAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <button type="submit">RESTORE</button>
                  </form>
                  <form action={purgeProjectAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <button className="is-danger" type="submit">PURGE</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </details>
      )}

      <div className="cms-project-footer">
        <Link href="/projects" target="_blank">OPEN PUBLIC PROJECTS ↗</Link>
        <Link href="/control/content">← CONTENT</Link>
      </div>
    </section>
  )
}
