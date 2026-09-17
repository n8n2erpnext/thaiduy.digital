export type EntityMode = 'bootstrap' | 'calm' | 'active' | 'thinking' | 'watching' | 'degraded'

export type EntityNodeState = 'offline' | 'standby' | 'online' | 'active'

export type EntityNode = {
  id: 'mb' | 'sentinel' | 'music' | 'light-remote' | 'lightbi' | 'n8n2erpnext'
  label: string
  role: string
  state: EntityNodeState
}

export type PublicEntityState = {
  mode: EntityMode
  updatedAt: string
  nodes: EntityNode[]
}

export const bootstrapEntityState: PublicEntityState = {
  mode: 'bootstrap',
  updatedAt: new Date(0).toISOString(),
  nodes: [
    { id: 'mb', label: 'MB', role: 'semantic brain', state: 'offline' },
    { id: 'sentinel', label: 'Sentinel', role: 'watching', state: 'offline' },
    { id: 'music', label: 'Music Sensor', role: 'listening', state: 'offline' },
    { id: 'light-remote', label: 'Light Remote', role: 'remote nerve', state: 'offline' },
    { id: 'lightbi', label: 'LightBI', role: 'data cognition', state: 'offline' },
    { id: 'n8n2erpnext', label: 'n8n2erpnext', role: 'workflow circulation', state: 'offline' },
  ],
}
