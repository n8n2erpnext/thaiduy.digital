import type { ManagedRegistryItem } from '@/content/types'
import { saveRegistryAction } from '@/app/control/(protected)/content/actions'

type Props = { item?: ManagedRegistryItem | null }

const kinds = ['nav', 'project', 'stack-node', 'home-surface', 'section', 'feature'] as const
const statuses = ['draft', 'published', 'archived'] as const

export function RegistryForm({ item }: Props) {
  const meta = JSON.stringify(item?.meta ?? {}, null, 2)
  return (
    <form className="control-editor" action={saveRegistryAction}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="control-editor-grid">
        <label><span>KEY</span><input name="key" defaultValue={item?.key ?? ''} required maxLength={128} /></label>
        <label><span>KIND</span><select name="kind" defaultValue={item?.kind ?? 'section'}>{kinds.map(kind => <option key={kind}>{kind}</option>)}</select></label>
        <label><span>STATUS</span><select name="status" defaultValue={item?.status ?? 'draft'}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
        <label><span>SORT</span><input name="sort" type="number" defaultValue={item?.sort ?? 0} /></label>
        <label><span>PARENT KEY</span><input name="parentKey" defaultValue={item?.parentKey ?? ''} /></label>
        <label><span>RUNTIME KEY</span><input name="runtimeKey" defaultValue={item?.runtimeKey ?? ''} /></label>
      </div>
      <label className="control-toggle"><input name="enabled" type="checkbox" defaultChecked={item?.enabled ?? true} /><span>ENABLED</span></label>
      <div className="control-locale-grid">
        <fieldset><legend>ENGLISH</legend>
          <label><span>LABEL</span><input name="labelEn" defaultValue={item?.label.en ?? ''} required /></label>
          <label><span>TITLE</span><input name="titleEn" defaultValue={item?.title?.en ?? ''} /></label>
          <label><span>SUMMARY</span><textarea name="summaryEn" rows={5} defaultValue={item?.summary?.en ?? ''} /></label>
        </fieldset>
        <fieldset><legend>TIẾNG VIỆT</legend>
          <label><span>NHÃN</span><input name="labelVi" defaultValue={item?.label.vi ?? ''} required /></label>
          <label><span>TIÊU ĐỀ</span><input name="titleVi" defaultValue={item?.title?.vi ?? ''} /></label>
          <label><span>MÔ TẢ</span><textarea name="summaryVi" rows={5} defaultValue={item?.summary?.vi ?? ''} /></label>
        </fieldset>
      </div>
      <label className="control-meta"><span>META / JSON</span><textarea name="meta" rows={10} defaultValue={meta} spellCheck={false} /></label>
      <div className="control-editor-footer"><span>{item ? `ID · ${item.id}` : 'NEW REGISTRY ITEM'}</span><button className="control-primary" type="submit">SAVE CHANGES</button></div>
    </form>
  )
}
