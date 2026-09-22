import { SignOutButton } from './sign-out-button'
import { ControlNav } from './control-nav'

type Props = {
  email: string
  children: React.ReactNode
}

export function ControlShell({ email, children }: Props) {
  return (
    <div className="control-root">
      <aside className="control-sidebar">
        <div className="control-brand"><strong>TD / CONTROL</strong><small>living systems operator</small></div>
        <ControlNav />
        <div className="control-user">
          <span>OWNER SESSION</span>
          <small>{email}</small>
          <SignOutButton />
        </div>
      </aside>
      <main className="control-main">{children}</main>
    </div>
  )
}
