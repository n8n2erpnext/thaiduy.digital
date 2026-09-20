import { StackSpatial } from '@/components/stack/stack-spatial'
import { StackStatusBar } from '@/components/control/stack-status-bar'
import { getLivePrivateStackGraph } from '@/server/stack/public'
import {
  discoverySnapshotIsStale,
  getStackDiscoveryRefreshRequest,
} from '@/server/stack/snapshot'
import { refreshStackStatusAction } from './actions'

export default async function ControlStackPage() {
  const [{ graph }, refreshRequest] = await Promise.all([
    getLivePrivateStackGraph(),
    getStackDiscoveryRefreshRequest(),
  ])
  const stale = discoverySnapshotIsStale(graph.generatedAt)
  const pending = !!refreshRequest

  return (
    <section className="control-page">
      <header className="control-page-head">
        <p>CONTROL / STACK</p>
        <h1>Live infrastructure stack</h1>
        <span>
          Private Docker/LXD runtime status lives here. Refresh host state on demand;
          the public Stack receives only the sanitized projection.
        </span>
      </header>

      <p className="control-stack-note">
        House → Room → Object is the canonical Stack renderer. Runtime discovery stays
        outside the web runtime and enters through the host snapshot bridge.
      </p>

      <StackStatusBar
        generatedAt={graph.generatedAt}
        stale={stale}
        pending={pending}
        refreshAction={refreshStackStatusAction}
      />

      <div className="control-stack-spatial">
        <StackSpatial initialGraph={graph} locale="en" />
      </div>
    </section>
  )
}
