import { ControlShell } from '@/components/control/control-shell'
import { requireControlOwner } from '@/lib/control-auth'

export default async function ControlLayout({ children }: { children: React.ReactNode }) {
  const session = await requireControlOwner()
  return <ControlShell email={session.user.email}>{children}</ControlShell>
}
