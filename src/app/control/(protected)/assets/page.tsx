import { desc } from 'drizzle-orm'
import { AssetUpload } from '@/components/control/asset-upload'
import { db } from '@/db/client'
import { assets } from '@/db/schema'
import { assetProvider } from '@/lib/assets'
import { purgeAsset, restoreAsset, toggleAsset, trashAsset, updateAssetMeta } from './actions'

export default async function AssetsPage() {
  const rows = await db.select().from(assets).orderBy(desc(assets.createdAt))
  const provider = assetProvider()
  const active = rows.filter(row => !row.deletedAt)
  const ready = active.filter(row => row.status === 'ready')
  const hidden = active.filter(row => row.status === 'hidden')
  const trashed = rows.filter(row => row.deletedAt)

  return (
    <section className="control-page control-assets-page">
      <header className="control-page-head">
        <p>CONTROL / MEDIA</p>
        <h1>Media library</h1>
        <span>Upload once, add bilingual metadata, and reuse the same governed asset across Writing, Projects and public surfaces.</span>
      </header>

      <div className="control-asset-summary">
        <span><strong>{active.length}</strong> ACTIVE</span>
        <span><strong>{ready.length}</strong> READY</span>
        <span><strong>{hidden.length}</strong> HIDDEN</span>
        <span><strong>{trashed.length}</strong> TRASHED</span>
        <span><strong>{provider.toUpperCase()}</strong> STORAGE</span>
      </div>

      <section className="control-asset-upload">
        <div>
          <div className="control-card-kicker">
            <span>NEW ASSET</span>
            <em>{provider.toUpperCase()}</em>
          </div>
          <h2>Upload to the shared library</h2>
          <p>Images and PDFs are stored once. Alt text can be refined here without replacing the underlying file.</p>
        </div>
        <AssetUpload />
      </section>

      <section className="control-asset-library">
        <header>
          <div>
            <span>LIBRARY</span>
            <h2>{rows.length} stored assets</h2>
          </div>
          <em>NEWEST FIRST</em>
        </header>

        {rows.length ? (
          <div className="asset-grid">
            {rows.map(row => (
              <article className={`asset-card ${row.deletedAt ? 'is-trashed' : ''}`} key={row.id}>
                <div
                  className="asset-preview"
                  style={row.mimeType.startsWith('image/') && row.publicUrl ? { backgroundImage: `url(${row.publicUrl})` } : undefined}
                >
                  <span>{row.mimeType}</span>
                  <i>{row.source.toUpperCase()}</i>
                </div>

                <div className="asset-meta">
                  <div>
                    <strong>{row.fileName}</strong>
                    <small>{Math.round(row.sizeBytes / 1024)} KB · {row.status.toUpperCase()}</small>
                  </div>
                  <span data-state={row.deletedAt ? 'trashed' : row.status}>
                    {row.deletedAt ? 'TRASHED' : row.status.toUpperCase()}
                  </span>
                </div>

                <form className="asset-alt-form" action={updateAssetMeta.bind(null, row.id)}>
                  <label>
                    <span>ALT / EN</span>
                    <input name="altEn" defaultValue={row.altEn ?? ''} placeholder="English alternative text" />
                  </label>
                  <label>
                    <span>ALT / VI</span>
                    <input name="altVi" defaultValue={row.altVi ?? ''} placeholder="Mô tả thay thế tiếng Việt" />
                  </label>
                  <button type="submit">SAVE META</button>
                </form>

                <div className="asset-actions">
                  {!row.deletedAt && (
                    <form action={toggleAsset.bind(null, row.id)}>
                      <button type="submit">{row.status === 'hidden' ? 'SHOW' : 'HIDE'}</button>
                    </form>
                  )}
                  {!row.deletedAt && (
                    <form action={trashAsset.bind(null, row.id)}>
                      <button type="submit">TRASH</button>
                    </form>
                  )}
                  {row.deletedAt && (
                    <form action={restoreAsset.bind(null, row.id)}>
                      <button type="submit">RESTORE</button>
                    </form>
                  )}
                  {row.deletedAt && (
                    <form action={purgeAsset.bind(null, row.id)}>
                      <button className="danger" type="submit">PURGE</button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="control-asset-empty">
            <span>NO ASSETS YET</span>
            <p>Upload the first governed media item above.</p>
          </div>
        )}
      </section>
    </section>
  )
}
