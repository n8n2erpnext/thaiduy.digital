import { desc } from 'drizzle-orm'
import { AssetUpload } from '@/components/control/asset-upload'
import { db } from '@/db/client'
import { assets } from '@/db/schema'
import { assetProvider } from '@/lib/assets'
import { purgeAsset, restoreAsset, toggleAsset, trashAsset, updateAssetMeta } from './actions'

export default async function AssetsPage() {
  const rows = await db.select().from(assets).orderBy(desc(assets.createdAt))
  const provider = assetProvider()
  return (
    <section className="control-section">
      <div className="control-section-head">
        <div><p>CONTENT / MEDIA</p><h1>Media library</h1><span>Upload once, reuse in posts and public surfaces.</span></div>
        <span>STORAGE / {provider.toUpperCase()}</span>
      </div>
      <AssetUpload />
      <div className="asset-grid">
        {rows.map(row => (
          <article className={`asset-card ${row.deletedAt ? 'is-trashed' : ''}`} key={row.id}>
            <div className="asset-preview" style={row.mimeType.startsWith('image/') && row.publicUrl ? { backgroundImage: `url(${row.publicUrl})` } : undefined}><span>{row.mimeType}</span></div>
            <div className="asset-meta"><strong>{row.fileName}</strong><small>{Math.round(row.sizeBytes / 1024)} KB · {row.status.toUpperCase()}</small></div>
            <form className="asset-alt-form" action={updateAssetMeta.bind(null, row.id)}>
              <input name="altEn" defaultValue={row.altEn ?? ''} placeholder="Alt / EN" />
              <input name="altVi" defaultValue={row.altVi ?? ''} placeholder="Alt / VI" />
              <button type="submit">SAVE META</button>
            </form>
            <div className="asset-actions">
              {!row.deletedAt && <form action={toggleAsset.bind(null, row.id)}><button type="submit">{row.status === 'hidden' ? 'SHOW' : 'HIDE'}</button></form>}
              {!row.deletedAt && <form action={trashAsset.bind(null, row.id)}><button type="submit">TRASH</button></form>}
              {row.deletedAt && <form action={restoreAsset.bind(null, row.id)}><button type="submit">RESTORE</button></form>}
              {row.deletedAt && <form action={purgeAsset.bind(null, row.id)}><button className="danger" type="submit">PURGE</button></form>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
