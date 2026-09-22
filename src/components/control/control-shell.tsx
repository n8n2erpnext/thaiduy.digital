import Image from 'next/image'
import Link from 'next/link'
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
        <div className="control-brand">
          <div className="control-brand-head">
            <Link className="control-brand-logo" href="/" aria-label="Open thaiduy.digital">
              <Image src="/brand-mark.svg" width={28} height={28} alt="" priority />
            </Link>
            <div className="control-brand-copy">
              <strong>CONTROL</strong>
              <small>living systems operator</small>
            </div>
            <Link className="control-brand-home" href="/control" aria-label="Control overview" title="Control overview">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.5 10.5 12 3.7l8.5 6.8v9.1a.9.9 0 0 1-.9.9h-5.2v-6.2H9.6v6.2H4.4a.9.9 0 0 1-.9-.9z"/>
              </svg>
            </Link>
          </div>
        </div>
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
