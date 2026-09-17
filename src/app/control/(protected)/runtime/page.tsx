import { getRuntimeBindings } from '@/control/queries'
import { deleteRuntimeBindingAction, saveRuntimeBindingAction } from './actions'

function BindingForm({ binding }: { binding?: Awaited<ReturnType<typeof getRuntimeBindings>>[number] }) {
  return (
    <form className="control-setting-editor" action={saveRuntimeBindingAction}>
      {binding && <input type="hidden" name="id" value={binding.id} />}
      <label><span>REGISTRY KEY</span><input name="registryKey" required defaultValue={binding?.registryKey ?? ''} /></label>
      <label><span>SOURCE</span><input name="source" required defaultValue={binding?.source ?? ''} placeholder="sentinel.music / lightbi / github" /></label>
      <label><span>STATE</span>
        <select name="enabled" defaultValue={String(binding?.enabled ?? true)}><option value="true">ENABLED</option><option value="false">DISABLED</option></select>
      </label>
      <label><span>PUBLIC FIELDS · JSON ARRAY</span><textarea name="publicFields" rows={4} spellCheck={false} defaultValue={JSON.stringify(binding?.publicFields ?? [], null, 2)} /></label>
      <label><span>CONFIG · JSON</span><textarea name="config" rows={6} spellCheck={false} defaultValue={JSON.stringify(binding?.config ?? {}, null, 2)} /></label>
      <button type="submit">{binding ? 'SAVE BINDING' : 'CREATE BINDING'}</button>
    </form>
  )
}

export default async function RuntimePage() {
  const bindings = await getRuntimeBindings()
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / RUNTIME</p><h1>Runtime bindings</h1><span>Bind public registry objects to live-state sources. Every binding has an independent kill switch and an explicit allowlist of public fields.</span></header>
      <div className="control-split">
        <section className="control-panel"><h2>ACTIVE REGISTRY</h2>
          <div className="control-setting-list">{bindings.length ? bindings.map(binding => (
            <article key={binding.id} className="control-binding-card">
              <div><strong>{binding.registryKey}</strong><small>{binding.source} · {binding.enabled ? 'ENABLED' : 'DISABLED'}</small></div>
              <BindingForm binding={binding} />
              <form action={deleteRuntimeBindingAction}><input type="hidden" name="id" value={binding.id}/><button type="submit">DELETE</button></form>
            </article>
          )) : <p>No runtime bindings yet.</p>}</div>
        </section>
        <section className="control-panel"><h2>NEW BINDING</h2><BindingForm /></section>
      </div>
    </section>
  )
}
