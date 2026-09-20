import Link from 'next/link'
import { RegistryForm } from '@/components/control/registry-form'
import type { ManagedRegistryItem } from '@/content/types'

type Props = {
  searchParams: Promise<{
    kind?: ManagedRegistryItem['kind']
    parentKey?: string
    sort?: string
  }>
}

export default async function NewRegistryPage({ searchParams }: Props) {
  const { kind,parentKey,sort } = await searchParams
  const safeKind = kind === 'project' ? 'section' : kind ?? 'section'
  return (
    <section className="control-page">
      <header className="control-page-head">
        <p>CONTENT / SITE STRUCTURE / NEW</p>
        <h1>Create registry record</h1>
        <span>Advanced site structure. Projects and Writing are managed from their dedicated CMS surfaces.</span>
      </header>
      <RegistryForm
        defaults={{
          kind:safeKind,
          parentKey:parentKey ?? '',
          sort:Number.isFinite(Number(sort)) ? Number(sort) : 0,
        }}
      />
      <Link className="control-back" href="/control/content/structure">← BACK TO SITE STRUCTURE</Link>
    </section>
  )
}
