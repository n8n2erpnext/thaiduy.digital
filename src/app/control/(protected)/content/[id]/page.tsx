import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RegistryForm } from '@/components/control/registry-form'
import { getRegistryItem } from '@/content/repository'

type Props = { params: Promise<{ id: string }> }

export default async function EditRegistryPage({ params }: Props) {
  const { id } = await params
  const item = await getRegistryItem(id)
  if (!item) notFound()
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / CONTENT / EDIT</p><h1>{item.label.en}</h1><span>{item.kind} · {item.key}</span></header>
      <RegistryForm item={item} />
      <Link className="control-back" href="/control/content">← BACK TO REGISTRY</Link>
    </section>
  )
}
