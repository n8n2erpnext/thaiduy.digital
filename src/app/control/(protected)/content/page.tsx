import Link from 'next/link'
import { isNull } from 'drizzle-orm'
import { getRegistryAll } from '@/content/repository'
import { getPostsAdmin } from '@/content/posts'
import { getWritingTags } from '@/content/writing-tags'
import { db } from '@/db/client'
import { assets } from '@/db/schema'

export default async function ControlContentPage() {
  const [projects,posts,assetRows,tags] = await Promise.all([
    getRegistryAll('project'),
    getPostsAdmin(),
    db.select({ id:assets.id }).from(assets).where(isNull(assets.deletedAt)),
    getWritingTags({includeDisabled:true}),
  ])

  const activeProjects = projects.filter(project => !project.deletedAt)
  const activePosts = posts.filter(post => !post.deletedAt)
  const publishedProjects = activeProjects.filter(project => project.status === 'published' && project.enabled)
  const publishedPosts = activePosts.filter(post => post.status === 'published')

  return (
    <section className="control-page cms-home cms-home-focused">
      <header className="control-page-head">
        <p>CONTROL / CONTENT</p>
        <h1>Content</h1>
        <span>Two editorial surfaces. Projects maps to /projects. Writing maps to /writing.</span>
      </header>
      <div className="cms-primary-content-grid">
        <Link className="cms-primary-content-card" href="/control/content/projects">
          <div className="cms-primary-content-kicker">
            <span>PROJECTS</span>
            <em>/projects</em>
          </div>
          <h2>Projects</h2>
          <p>
            Manage public project identity, positioning and runtime-aware cards.
            One project record equals one card on the public Projects surface.
          </p>
          <div className="cms-primary-content-stats">
            <span><strong>{activeProjects.length}</strong> TOTAL</span>
            <span><strong>{publishedProjects.length}</strong> PUBLIC</span>
          </div>
          <strong className="cms-primary-content-action">OPEN PROJECTS →</strong>
        </Link>

        <Link className="cms-primary-content-card" href="/control/content/writing">
          <div className="cms-primary-content-kicker">
            <span>WRITING</span>
            <em>/writing</em>
          </div>
          <h2>Writing</h2>
          <p>
            Write bilingual long-form posts with rich text, slash commands,
            R2 media and Unsplash, then publish directly to Writing.
          </p>
          <div className="cms-primary-content-stats">
            <span><strong>{activePosts.length}</strong> TOTAL</span>
            <span><strong>{publishedPosts.length}</strong> PUBLISHED</span>
          </div>
          <strong className="cms-primary-content-action">OPEN WRITING →</strong>
        </Link>
      </div>
      <div className="cms-content-utilities">
        <Link href="/control/content/tags">
          <div><span>WRITING TAGS</span><strong>{tags.length}</strong></div>
          <p>Reusable tag identity and color registry for Writing.</p>
          <em>MANAGE TAGS →</em>
        </Link>
        <Link href="/control/assets">
          <div><span>MEDIA</span><strong>{assetRows.length}</strong></div>
          <p>Shared R2 and Unsplash library for both editorial surfaces.</p>
          <em>OPEN MEDIA →</em>
        </Link>
        <Link href="/control/content/structure">
          <div><span>SITE STRUCTURE</span><strong>ADV</strong></div>
          <p>Navigation, homepage, managed sections and internal configuration.</p>
          <em>OPEN STRUCTURE →</em>
        </Link>
      </div>

      {(activeProjects.length > 0 || activePosts.length > 0) && (
        <section className="cms-recent">
          <div className="cms-recent-head">
            <div><span>RECENT</span><h3>Latest editorial changes</h3></div>
          </div>
          {[
            ...activeProjects.map(project => ({
              id:'project-' + project.id,
              label:project.label.en || project.label.vi,
              type:'PROJECT',
              updatedAt:project.updatedAt ?? new Date(0),
              href:'/control/content/projects/' + project.id,
            })),
            ...activePosts.map(post => ({
              id:'post-' + post.id,
              label:post.titleEn || post.titleVi || 'Untitled',
              type:'WRITING',
              updatedAt:post.updatedAt,
              href:'/control/content/writing/' + post.id,
            })),
          ]
            .sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0,6)
            .map(item => (
              <Link className="cms-recent-row" href={item.href} key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.type}</span>
                <time>{item.updatedAt.toLocaleString('en-GB')}</time>
              </Link>
            ))}
        </section>
      )}
    </section>
  )
}
