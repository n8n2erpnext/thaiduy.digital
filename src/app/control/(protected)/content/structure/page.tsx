import Link from 'next/link'
import { getRegistryAdmin } from '@/content/repository'
import {
  purgeRegistryAction,
  restoreRegistryAction,
  toggleRegistryAction,
  trashRegistryAction,
} from '../actions'

const filters = [
  ['all','ALL'],
  ['home-surface','HOMEPAGE'],
  ['nav','NAVIGATION'],
  ['section','PAGES'],
  ['feature','FEATURES'],
  ['organ','ORGANS'],
  ['stack-node','STACK NODES'],
] as const

type Props = { searchParams: Promise<{ kind?:string }> }

export default async function ContentStructurePage({ searchParams }: Props) {
  const { kind } = await searchParams
  const active = filters.some(([value]) => value === kind) ? kind ?? 'all' : 'all'
  const all = (await getRegistryAdmin()).filter(item => item.kind !== 'project')
  const items = active === 'all' ? all : all.filter(item => item.kind === active)

  return (
    <section className="control-page">
      <header className="control-page-head control-page-head-row">
        <div>
          <p>CONTENT / SITE STRUCTURE</p>
          <h1>Site structure</h1>
          <span>Advanced registry records. Normal writing and media work lives one level up in Content.</span>
        </div>
        <Link className="control-primary" href="/control/content/new">NEW RECORD</Link>
      </header>
      <div className="cms-structure-nav">
        {filters.map(([value,label]) => (
          <Link
            href={value === 'all' ? '/control/content/structure' : '/control/content/structure?kind=' + value}
            data-active={active === value}
            key={value}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="control-table-wrap">
        <table className="control-table">
          <thead>
            <tr>
              <th>ORDER</th><th>KIND</th><th>KEY</th><th>LABEL</th>
              <th>STATE</th><th>UPDATED</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const trashed = Boolean(item.deletedAt)
              return (
                <tr key={item.id} className={trashed ? 'is-trashed' : ''}>
                  <td>{item.sort}</td>
                  <td>{item.kind}</td>
                  <td>{item.key}</td>
                  <td>{item.label.en}<small>{item.label.vi}</small></td>
                  <td>
                    <span className={'control-state is-' + (trashed ? 'trash' : item.status)}>
                      {trashed ? 'TRASH' : item.status}
                    </span>
                    <small>{item.enabled ? 'enabled' : 'disabled'}</small>
                  </td>
                  <td>{item.updatedAt?.toLocaleString('en-GB') ?? '—'}</td>
                  <td className="control-actions">
                    {!trashed && <Link href={'/control/content/' + item.id}>EDIT</Link>}
                    {!trashed && (
                      <form action={toggleRegistryAction}>
                        <input type="hidden" name="id" value={item.id}/>
                        <input type="hidden" name="enabled" value={String(!item.enabled)}/>
                        <button type="submit">{item.enabled ? 'OFF' : 'ON'}</button>
                      </form>
                    )}
                    {!trashed && (
                      <form action={trashRegistryAction}>
                        <input type="hidden" name="id" value={item.id}/>
                        <button type="submit">TRASH</button>
                      </form>
                    )}
                    {trashed && (
                      <form action={restoreRegistryAction}>
                        <input type="hidden" name="id" value={item.id}/>
                        <button type="submit">RESTORE</button>
                      </form>
                    )}
                    {trashed && (
                      <form action={purgeRegistryAction}>
                        <input type="hidden" name="id" value={item.id}/>
                        <button className="is-danger" type="submit">PURGE</button>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Link className="control-back" href="/control/content">← CONTENT</Link>
    </section>
  )
}
