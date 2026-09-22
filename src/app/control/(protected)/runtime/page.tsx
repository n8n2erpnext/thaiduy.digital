import { getRuntimeBindings } from '@/control/queries'
import { deleteRuntimeBindingAction, saveRuntimeBindingAction } from './actions'

type Binding = Awaited<ReturnType<typeof getRuntimeBindings>>[number]

function BindingForm({ binding }: { binding?: Binding }) {
  return (
    <form className="control-runtime-form" action={saveRuntimeBindingAction}>
      {binding && <input type="hidden" name="id" value={binding.id} />}
      <div className="control-runtime-fields">
        <label>
          <span>REGISTRY KEY</span>
          <input name="registryKey" required defaultValue={binding?.registryKey ?? ''} />
        </label>
        <label>
          <span>SOURCE</span>
          <input name="source" required defaultValue={binding?.source ?? ''} placeholder="sentinel.music / lightbi / github" />
        </label>
        <label>
          <span>STATE</span>
          <select name="enabled" defaultValue={String(binding?.enabled ?? true)}>
            <option value="true">ENABLED</option>
            <option value="false">DISABLED</option>
          </select>
        </label>
      </div>
      <label className="control-runtime-wide">
        <span>PUBLIC FIELDS · JSON ARRAY</span>
        <textarea name="publicFields" rows={5} spellCheck={false} defaultValue={JSON.stringify(binding?.publicFields ?? [], null, 2)} />
      </label>
      <label className="control-runtime-wide">
        <span>CONFIG · JSON</span>
        <textarea name="config" rows={7} spellCheck={false} defaultValue={JSON.stringify(binding?.config ?? {}, null, 2)} />
      </label>
      <button className="control-runtime-save" type="submit">{binding ? 'SAVE BINDING' : 'CREATE BINDING'}</button>
    </form>
  )
}

export default async function RuntimePage() {
  const bindings = await getRuntimeBindings()
  const enabled = bindings.filter(binding => binding.enabled).length

  return (
    <section className="control-page control-runtime-page">
      <header className="control-page-head">
        <p>CONTROL / RUNTIME</p>
        <h1>Runtime bindings</h1>
        <span>Bind public registry objects to live-state sources. Every binding has an independent kill switch and an explicit allowlist of public fields.</span>
      </header>

      <div className="control-runtime-summary">
        <span><strong>{bindings.length}</strong> BINDINGS</span>
        <span><strong>{enabled}</strong> ENABLED</span>
        <span><strong>{bindings.length - enabled}</strong> DISABLED</span>
      </div>

      <div className="control-runtime-layout">
        <section className="control-runtime-registry">
          <header><span>ACTIVE REGISTRY</span><em>{bindings.length} RECORDS</em></header>
          {bindings.length ? bindings.map((binding, index) => (
            <article className="control-runtime-card" key={binding.id}>
              <div className="control-runtime-card-head">
                <div>
                  <span>{String(index + 1).padStart(2, '0')} / {binding.source}</span>
                  <h2>{binding.registryKey}</h2>
                </div>
                <strong data-enabled={binding.enabled}>{binding.enabled ? 'ENABLED' : 'DISABLED'}</strong>
              </div>
              <BindingForm binding={binding} />
              <footer>
                <span>ID {binding.id}</span>
                <form action={deleteRuntimeBindingAction}>
                  <input type="hidden" name="id" value={binding.id}/>
                  <button type="submit">DELETE BINDING</button>
                </form>
              </footer>
            </article>
          )) : <p className="control-runtime-empty">No runtime bindings yet.</p>}
        </section>

        <aside className="control-runtime-create">
          <div className="control-card-kicker"><span>NEW BINDING</span><em>REGISTRY</em></div>
          <h2>Add a live-state source</h2>
          <p>Start disabled when the public field allowlist still needs review.</p>
          <BindingForm />
        </aside>
      </div>
    </section>
  )
}
