import { getFeatureFlags, getSiteSettings } from '@/control/queries'
import { saveSettingAction, toggleFeatureAction } from './actions'

export default async function SettingsPage() {
  const [flags, settings] = await Promise.all([getFeatureFlags(), getSiteSettings()])
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / SETTINGS</p><h1>Behavior and site settings</h1><span>Feature flags are kill switches. Durable site settings are JSON documents kept in Postgres and audited on change.</span></header>
      <div className="control-split">
        <section className="control-panel"><h2>FEATURE FLAGS</h2>
          <div className="control-setting-list">{flags.map(flag => (
            <article key={flag.key}><div><strong>{flag.key}</strong><small>{flag.enabled ? 'ENABLED' : 'DISABLED'}</small></div>
              <form action={toggleFeatureAction}><input type="hidden" name="key" value={flag.key}/><input type="hidden" name="enabled" value={String(!flag.enabled)}/><button type="submit">{flag.enabled ? 'TURN OFF' : 'TURN ON'}</button></form>
            </article>
          ))}</div>
        </section>
        <section className="control-panel"><h2>SITE SETTINGS</h2>
          <div className="control-setting-list">{settings.map(setting => (
            <form className="control-setting-editor" action={saveSettingAction} key={setting.key}>
              <input type="hidden" name="key" value={setting.key}/><strong>{setting.key}</strong>
              <textarea name="value" rows={6} defaultValue={JSON.stringify(setting.value, null, 2)} spellCheck={false}/><button type="submit">SAVE</button>
            </form>
          ))}</div>
        </section>
      </div>
    </section>
  )
}
