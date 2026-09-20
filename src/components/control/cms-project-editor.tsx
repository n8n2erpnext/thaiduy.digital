import Link from 'next/link'
import type { ManagedRegistryItem } from '@/content/types'
import { saveProjectAction } from '@/app/control/(protected)/content/projects/actions'

type RuntimeState = {
  state:string
  matchedCount:number
  onlineCount:number
  degradedCount:number
} | null

type Props = {
  project?: ManagedRegistryItem | null
  runtime?: RuntimeState
}

export function CmsProjectEditor({ project,runtime }: Props) {
  const plane = String(project?.meta?.plane ?? '')
  const mode = String(project?.meta?.mode ?? '')
  const logoUrl = String(project?.meta?.logoUrl ?? '')
  const overviewEn = String(project?.meta?.overviewEn ?? '')
  const overviewVi = String(project?.meta?.overviewVi ?? '')
  const highlightsEn = String(project?.meta?.highlightsEn ?? '')
  const highlightsVi = String(project?.meta?.highlightsVi ?? '')
  const architectureEn = String(project?.meta?.architectureEn ?? '')
  const architectureVi = String(project?.meta?.architectureVi ?? '')
  const websiteUrl = String(project?.meta?.websiteUrl ?? '')
  const demoUrl = String(project?.meta?.demoUrl ?? '')
  const githubUrl = String(project?.meta?.githubUrl ?? '')
  const docsUrl = String(project?.meta?.docsUrl ?? '')

  return (
    <form className="cms-project-editor" action={saveProjectAction}>
      {project && <input type="hidden" name="id" value={project.id} />}

      <header className="cms-project-topbar">
        <div>
          <Link href="/control/content/projects">← PROJECTS</Link>
          <span>{project ? project.key : 'NEW PROJECT'}</span>
        </div>
        <div>
          <select name="status" defaultValue={project?.status ?? 'draft'}>
            <option value="draft">DRAFT</option>
            <option value="published">PUBLISHED</option>
            <option value="archived">ARCHIVED</option>
          </select>
          <label className="control-toggle">
            <input name="enabled" type="checkbox" defaultChecked={project?.enabled ?? true} />
            <span>VISIBLE</span>
          </label>
          <button className="control-primary" type="submit">SAVE PROJECT</button>
        </div>
      </header>
      <div className="cms-project-workspace">
        <main className="cms-project-main">
          <section className="cms-project-identity">
            <span>PROJECT IDENTITY</span>
            <div className="cms-project-name-grid">
              <label>
                <small>NAME / EN</small>
                <input name="labelEn" defaultValue={project?.label.en ?? ''} placeholder="Project name" required />
              </label>
              <label>
                <small>NAME / VI</small>
                <input name="labelVi" defaultValue={project?.label.vi ?? ''} placeholder="Tên dự án" required />
              </label>
            </div>
          </section>

          <section className="cms-project-logo-settings">
            <div>
              <span>PROJECT MARK</span>
              <p>Used on /projects and the project detail hero. A public path such as /project-logos/lightbi.svg is supported.</p>
            </div>
            <div className="cms-project-logo-row">
              <label>
                <span>LOGO URL</span>
                <input name="logoUrl" defaultValue={logoUrl} placeholder="/project-logos/project.svg" />
              </label>
              <div className="cms-project-logo-preview">
                {logoUrl
                  ? <img src={logoUrl} alt="" />
                  : <span>{(project?.label.en || project?.label.vi || 'P').slice(0,2).toUpperCase()}</span>}
              </div>
            </div>
          </section>

          <div className="cms-project-language-grid">
            <fieldset>
              <legend>ENGLISH</legend>
              <label>
                <span>ROLE / POSITIONING</span>
                <input name="titleEn" defaultValue={project?.title?.en ?? ''} placeholder="Local-first BI / governed analytics" />
              </label>
              <label>
                <span>SUMMARY</span>
                <textarea name="summaryEn" rows={7} defaultValue={project?.summary?.en ?? ''} placeholder="What this project is and why it exists…" />
              </label>
            </fieldset>
            <fieldset>
              <legend>TIẾNG VIỆT</legend>
              <label>
                <span>VAI TRÒ / ĐỊNH VỊ</span>
                <input name="titleVi" defaultValue={project?.title?.vi ?? ''} placeholder="BI local-first / phân tích có quản trị" />
              </label>
              <label>
                <span>MÔ TẢ</span>
                <textarea name="summaryVi" rows={7} defaultValue={project?.summary?.vi ?? ''} placeholder="Dự án này là gì và vì sao nó tồn tại…" />
              </label>
            </fieldset>
          </div>
          <section className="cms-project-detail-settings">
            <div>
              <span>PROJECT DETAIL</span>
              <p>These fields enrich /projects/[project]. Leave them empty to fall back to the card summary.</p>
            </div>

            <div className="cms-project-language-grid">
              <fieldset>
                <legend>ENGLISH DETAIL</legend>
                <label>
                  <span>OVERVIEW</span>
                  <textarea name="overviewEn" rows={6} defaultValue={overviewEn} placeholder="A fuller project overview…" />
                </label>
                <label>
                  <span>HIGHLIGHTS · ONE PER LINE</span>
                  <textarea name="highlightsEn" rows={5} defaultValue={highlightsEn} placeholder={'Local-first core\nGoverned metrics\nPublic runtime projection'} />
                </label>
                <label>
                  <span>ARCHITECTURE NOTE</span>
                  <textarea name="architectureEn" rows={5} defaultValue={architectureEn} placeholder="How the public surface relates to the runtime…" />
                </label>
              </fieldset>
              <fieldset>
                <legend>CHI TIẾT TIẾNG VIỆT</legend>
                <label>
                  <span>TỔNG QUAN</span>
                  <textarea name="overviewVi" rows={6} defaultValue={overviewVi} placeholder="Mô tả dự án đầy đủ hơn…" />
                </label>
                <label>
                  <span>ĐIỂM NỔI BẬT · MỖI DÒNG MỘT Ý</span>
                  <textarea name="highlightsVi" rows={5} defaultValue={highlightsVi} />
                </label>
                <label>
                  <span>GHI CHÚ KIẾN TRÚC</span>
                  <textarea name="architectureVi" rows={5} defaultValue={architectureVi} />
                </label>
              </fieldset>
            </div>

            <div className="cms-project-links-grid">
              <label><span>WEBSITE</span><input name="websiteUrl" defaultValue={websiteUrl} placeholder="https://…" /></label>
              <label><span>DEMO</span><input name="demoUrl" defaultValue={demoUrl} placeholder="https://…" /></label>
              <label><span>GITHUB</span><input name="githubUrl" defaultValue={githubUrl} placeholder="https://github.com/…" /></label>
              <label><span>DOCS</span><input name="docsUrl" defaultValue={docsUrl} placeholder="https://…" /></label>
            </div>
          </section>

          <section className="cms-project-taxonomy">
            <div>
              <span>PUBLIC SIGNAL</span>
              <p>These labels appear at the bottom of the public project card.</p>
            </div>
            <div className="cms-project-taxonomy-grid">
              <label>
                <span>PLANE</span>
                <input name="plane" defaultValue={plane} placeholder="DATA / COGNITION" />
              </label>
              <label>
                <span>MODE</span>
                <input name="mode" defaultValue={mode} placeholder="PRODUCT" />
              </label>
              <label>
                <span>ORDER</span>
                <input name="sort" type="number" defaultValue={project?.sort ?? 10} />
              </label>
            </div>
          </section>
        </main>

        <aside className="cms-project-side">
          <section>
            <span>PUBLIC SURFACE</span>
            <strong>{project ? '/projects/' + project.key : '/projects/[project]'}</strong>
            <p>Saving this record changes the catalogue card and its public project detail page directly.</p>
            <Link href={project ? '/projects/' + project.key : '/projects'} target="_blank">OPEN PUBLIC PROJECT ↗</Link>
          </section>

          <section>
            <span>RUNTIME</span>
            {runtime ? (
              <>
                <strong data-runtime={runtime.state}>{runtime.state.toUpperCase()}</strong>
                <p>{runtime.matchedCount} matched nodes · {runtime.onlineCount} online · {runtime.degradedCount} degraded</p>
              </>
            ) : (
              <>
                <strong data-runtime="offline">OFF STACK</strong>
                <p>No runtime binding is attached yet. Content can still be published normally.</p>
              </>
            )}
          </section>
          {project && (
            <section>
              <span>SYSTEM IDENTITY</span>
              <dl>
                <div><dt>KEY</dt><dd>{project.key}</dd></div>
                <div><dt>UPDATED</dt><dd>{project.updatedAt?.toLocaleString('en-GB') ?? '—'}</dd></div>
              </dl>
              <small>
                Runtime binding and organism metadata are preserved automatically and are not edited here.
              </small>
            </section>
          )}
        </aside>
      </div>
    </form>
  )
}
