import { db, sqlClient } from '../src/db/client'
import { siteRegistry } from '../src/db/schema'
import { eq } from 'drizzle-orm'

type OrganismMeta = {
  x:number
  y:number
  roleEn:string
  roleVi:string
  importance:number
  linksTo:string[]
}

const positions: Record<string, OrganismMeta> = {
  'entity-core': { x:.5, y:.5, roleEn:'living surface core', roleVi:'lõi giao diện công khai', importance:1, linksTo:[] },
  mb: { x:.5, y:.15, roleEn:'semantic brain', roleVi:'bộ não ngữ nghĩa', importance:.9, linksTo:['entity-core'] },
  lightbi: { x:.18, y:.34, roleEn:'data cognition', roleVi:'hiểu dữ liệu', importance:.82, linksTo:['entity-core'] },
  'light-remote': { x:.16, y:.7, roleEn:'remote nerve', roleVi:'kết nối từ xa', importance:.8, linksTo:['entity-core'] },
  sentinel: { x:.82, y:.34, roleEn:'security sense', roleVi:'cảm biến an ninh', importance:.82, linksTo:['entity-core'] },
  'sentinel-music': { x:.84, y:.7, roleEn:'acoustic sense', roleVi:'cảm biến âm thanh', importance:.76, linksTo:['entity-core'] },
  n8n2erpnext: { x:.5, y:.82, roleEn:'workflow circulation', roleVi:'luồng workflow', importance:.78, linksTo:['entity-core'] },
}

const inserts = [
  {
    key:'entity-core',
    kind:'organ',
    enabled:true,
    status:'published',
    sort:1,
    labelEn:'ENTITY',
    labelVi:'ENTITY',
    titleEn:'Living surface core',
    titleVi:'Lõi giao diện công khai',
    summaryEn:'The public organism surface that binds sanitized runtime signals into one coherent view.',
    summaryVi:'Giao diện công khai gom các tín hiệu runtime đã lược bỏ dữ liệu nhạy cảm thành một góc nhìn thống nhất.',
    runtimeKey:'entity-core',
  },
  {
    key:'mb',
    kind:'organ',
    enabled:true,
    status:'published',
    sort:2,
    labelEn:'MB',
    labelVi:'MB',
    titleEn:'Semantic brain',
    titleVi:'Não ngữ nghĩa',
    summaryEn:'Semantic advisory layer. Runtime state remains private until a dedicated source is attached.',
    summaryVi:'Lớp cố vấn ngữ nghĩa. Trạng thái runtime giữ riêng tư cho tới khi có nguồn chuyên biệt.',
    runtimeKey:'mb',
  },
]

for (const row of inserts) {
  await db.insert(siteRegistry).values({
    ...row,
    meta:{ organism:positions[row.key] },
  }).onConflictDoUpdate({
    target:siteRegistry.key,
    set:{
      kind:row.kind,
      enabled:row.enabled,
      status:row.status,
      sort:row.sort,
      labelEn:row.labelEn,
      labelVi:row.labelVi,
      titleEn:row.titleEn,
      titleVi:row.titleVi,
      summaryEn:row.summaryEn,
      summaryVi:row.summaryVi,
      runtimeKey:row.runtimeKey,
    },
  })
}

for (const [key, organism] of Object.entries(positions)) {
  const [row] = await db.select({
    id:siteRegistry.id,
    meta:siteRegistry.meta,
  }).from(siteRegistry).where(eq(siteRegistry.key,key)).limit(1)

  if (!row) continue
  await db.update(siteRegistry).set({
    meta:{ ...row.meta, organism },
    updatedAt:new Date(),
  }).where(eq(siteRegistry.id,row.id))
}

console.log(`organism_registry_positions=${Object.keys(positions).length}`)
await sqlClient.end()
