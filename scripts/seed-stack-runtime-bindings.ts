import { db, sqlClient } from '../src/db/client'
import { runtimeBindings } from '../src/db/schema'

const bindings = [
  {
    registryKey:'lightbi',
    source:'stack.discovery',
    enabled:true,
    publicFields:['state','matchedCount','updatedAt'],
    config:{
      matchAny:['lightbi'],
      excludeAny:['network-lightbi'],
      provider:'host-snapshot-bridge',
    },
  },
  {
    registryKey:'light-remote',
    source:'stack.discovery',
    enabled:true,
    publicFields:['state','matchedCount','updatedAt'],
    config:{
      matchAny:['remote-bridge-poc','light-remote-review','light-remote-review-leaf'],
      provider:'host-snapshot-bridge',
    },
  },
  {
    registryKey:'n8n2erpnext',
    source:'stack.discovery',
    enabled:true,
    publicFields:['state','matchedCount','updatedAt'],
    config:{
      matchAny:['docker-n8n','n8n-postgres'],
      provider:'host-snapshot-bridge',
    },
  },
  {
    registryKey:'sentinel',
    source:'stack.discovery',
    enabled:true,
    publicFields:['state','matchedCount','updatedAt'],
    config:{
      matchAny:['crowdsec','sentinel'],
      provider:'host-snapshot-bridge',
    },
  },
]

for (const binding of bindings) {
  await db.insert(runtimeBindings).values(binding).onConflictDoUpdate({
    target:[runtimeBindings.registryKey, runtimeBindings.source],
    set:{
      enabled:binding.enabled,
      publicFields:binding.publicFields,
      config:binding.config,
      updatedAt:new Date(),
    },
  })
}

console.log(`stack_runtime_bindings=${bindings.length}`)
await sqlClient.end()
