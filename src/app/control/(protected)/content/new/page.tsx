import Link from 'next/link'
import { RegistryForm } from '@/components/control/registry-form'

export default function NewRegistryPage() {
  return (
    <section className="control-page">
      <header className="control-page-head"><p>CONTROL / CONTENT / NEW</p><h1>Create registry item</h1><span>Draft first, publish when the bilingual content and runtime binding are ready.</span></header>
      <RegistryForm />
      <Link className="control-back" href="/control/content">← BACK TO REGISTRY</Link>
    </section>
  )
}
